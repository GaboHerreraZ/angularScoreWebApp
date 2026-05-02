import { Component, computed, DestroyRef, effect, inject, resource, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { CustomTable } from '@/app/shared/components/table/table';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';
import { StateControl } from '@/app/shared/components/state-control/state-control';
import { CityControl } from '@/app/shared/components/city-control/city-control';
import { CompanyService } from './company.service';
import { AuthService } from '@/app/core/services/auth.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { Company as CompanyModel } from '@/app/types/company';
import { InvitationsResponse } from '@/app/types/invitation';
import { Parameter } from '@/app/types/parameter';
import { TableActionEvent, TableSettings } from '@/app/types/table';

@Component({
    selector: 'app-company',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        CardModule,
        InputTextModule,
        SelectModule,
        AutoCompleteModule,
        FloatLabelModule,
        FluidModule,
        TagModule,
        SkeletonModule,
        TooltipModule,
        DialogModule,
        CustomTable,
        PhoneInput,
        StateControl,
        CityControl
    ],
    templateUrl: './company.html'
})
export class Company {
    private destroyRef = inject(DestroyRef);
    private companyService = inject(CompanyService);
    private authService = inject(AuthService);
    private parameterService = inject(ParameterService);
    private supabaseService = inject(SupabaseService);
    private notificationService = inject(NotificationService);

    private canAddUser = computed(() => this.authService.currentProfile()?.permissions?.canAddUser ?? false);

    user = this.supabaseService.currentUser();

    companyResource = resource<CompanyModel[], string>({
        params: () => this.user!.id as string,
        loader: ({ params: userId }) => firstValueFrom(this.companyService.getCompanyByUser(userId))
    });

    sectorsResource = resource<Parameter[], string>({
        params: () => 'sector',
        loader: ({ params: type }) => firstValueFrom(this.parameterService.getByType(type))
    });

    filteredSectors = signal<Parameter[]>([]);

    onSearchSector(event: AutoCompleteCompleteEvent): void {
        const query = (event.query ?? '').toLowerCase().trim();
        const all = this.sectorsResource.value() ?? [];
        if (!query) {
            this.filteredSectors.set(all);
            return;
        }
        this.filteredSectors.set(all.filter(s => s.label.toLowerCase().includes(query)));
    }

    accountTypesResource = resource<Parameter[], string>({
        params: () => 'account_type',
        loader: ({ params: type }) => firstValueFrom(this.parameterService.getByType(type))
    });

    banksResource = resource<Parameter[], string>({
        params: () => 'bank',
        loader: ({ params: type }) => firstValueFrom(this.parameterService.getByType(type))
    });

    saving = signal(false);
    uploadingLogo = signal(false);
    company = signal<CompanyModel | null>(null);
    logoPreview = signal<string | null>(null);

    identificationTypesResource = resource<Parameter[], string>({
        params: () => 'identification_type',
        loader: ({ params: type }) => firstValueFrom(this.parameterService.getByType(type))
    });

    invitationsResource = resource<InvitationsResponse, string>({
        params: () => this.user!.id as string,
        loader: ({ params: userId }) => firstValueFrom(this.companyService.getInvitations(userId))
    });

    invitationsData = computed(() => {
        const invitations = this.invitationsResource.value()?.data ?? [];
        return invitations.map(inv => ({
            id: inv.id,
            email: inv.email,
            company: inv.company.name,
            invitedBy: `${inv.invitedByUser.name} ${inv.invitedByUser.lastName}`,
            status: inv.status.label,
            statusCode: inv.status.code,
            createdAt: new Date(inv.createdAt).toLocaleDateString('es-CO'),
            canResend: inv.status.code === 'rejected',
            canDeactivate: inv.status.code === 'accepted',
            canActivate: inv.status.code === 'canceled'
        }));
    });

    invitationsTableSettings = computed<TableSettings>(() => ({
        title: 'Usuarios Invitados',
        titleIcon: 'pi pi-users',
        columns: [
            { header: 'Correo', field: 'email', type: 'text' },
            { header: 'Empresa', field: 'company', type: 'text' },
            { header: 'Invitado por', field: 'invitedBy', type: 'text' },
            { header: 'Estado', field: 'status', type: 'status', severityMap: { 'Pendiente': 'warn', 'Aceptada': 'success', 'Rechazada': 'danger', 'Inactivo': 'secondary', 'Cancelada':'danger' }, defaultSeverity: 'info' },
            { header: 'Fecha', field: 'createdAt', type: 'text', filterable: false }
        ],
        actions: [
            { id: 'resendInvitation', icon: 'pi pi-replay', severity: 'info', tooltip: 'Reenviar invitación', visibleField: 'canResend' },
            { id: 'deactivateUser', icon: 'pi pi-ban', severity: 'danger', tooltip: 'Desactivar usuario', visibleField: 'canDeactivate' },
            { id: 'activateUser', icon: 'pi pi-check-circle', severity: 'success', tooltip: 'Activar usuario', visibleField: 'canActivate' }
        ],
        ...(this.canAddUser() ? {
            addButton: {
                label: 'Invitar usuario',
                icon: 'pi pi-user-plus',
                severity: 'success'
            }
        } : {}),
        rows: 5,
        rowsPerPageOptions: [5, 10],
        showGridlines: false,
        showSearch: false,
        showColumnFilters: false
    }));

    billingDepartmentId = signal<number | null>(null);

    billingStateControl = viewChild<StateControl>('billingStateControl');
    billingCityControl = viewChild<CityControl>('billingCityControl');

    private pendingBillingStateName: string | null = null;
    private pendingBillingCityName: string | null = null;

    billingForm = new FormGroup({
        billingName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingLastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingDocType: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        billingDocNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        billingAddress: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingState: new FormControl<{ id: number; name: string } | null>(null, { validators: [Validators.required] }),
        billingCity: new FormControl<{ id: number; name: string } | null>(null, { validators: [Validators.required] }),
        billingPhone: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    });

    form = new FormGroup({
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        nit: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
        state: new FormControl({value:'', disabled: true}, { nonNullable: true }),
        city: new FormControl({value:'', disabled: true}, { nonNullable: true  }),
        sectorId: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        accountTypeId: new FormControl<number | null>(null),
        accountBankId: new FormControl<number | null>(null),
        accountNumber: new FormControl<string | null>(null, { validators: [Validators.maxLength(50)] }),
        isActive: new FormControl({ value: false, disabled: true }, { nonNullable: true }),
        createdAt: new FormControl({ value: '', disabled: true }, { nonNullable: true })
    });

    currentLogoUrl = computed(() => this.logoPreview() ?? this.company()?.logoSignedUrl ?? null);

    constructor() {
        this.billingForm.controls.billingState.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(state => {
            this.billingDepartmentId.set(state?.id ?? null);
            this.billingForm.controls.billingCity.reset();
        });

        effect(() => {
            const ctrl = this.billingStateControl();
            const departments = ctrl?.departmentsResource.value();
            if (this.pendingBillingStateName && departments?.length) {
                const match = departments.find(d => d.name === this.pendingBillingStateName);
                if (match) {
                    this.billingForm.controls.billingState.setValue(match, { emitEvent: true });
                    this.billingForm.markAsPristine();
                    this.pendingBillingStateName = null;
                }
            }
        });

        effect(() => {
            const ctrl = this.billingCityControl();
            const cities = ctrl?.citiesResource.value();
            if (this.pendingBillingCityName && cities?.length) {
                const match = cities.find(c => c.name === this.pendingBillingCityName);
                if (match) {
                    this.billingForm.controls.billingCity.setValue(match, { emitEvent: false });
                    this.billingForm.markAsPristine();
                    this.pendingBillingCityName = null;
                }
            }
        });

        effect(() => {
            const companies = this.companyResource.value();
            if (companies?.length) {
                const c: CompanyModel = companies[0];
                this.company.set(c);
                this.logoPreview.set(null);

                const sectors = this.sectorsResource.value() ?? [];
                const sector = sectors.find(s => s.id === c.sectorId) ?? null;

                this.form.patchValue({
                    name: c.name,
                    nit: c.nit,
                    city: c.city,
                    state: c.state,
                    sectorId: sector,
                    accountTypeId: c.accountTypeId,
                    accountBankId: c.accountBankId,
                    accountNumber: c.accountNumber,
                    isActive: c.isActive,
                    createdAt: new Date(c.createdAt).toLocaleDateString('es-CO')
                });

                const idTypes = this.identificationTypesResource.value() ?? [];
                const docType = idTypes.find(t => t.id === c.billingDocTypeId) ?? null;

                this.pendingBillingStateName = c.billingState ?? null;
                this.pendingBillingCityName = c.billingCity ?? null;

                this.billingForm.patchValue({
                    billingName: c.billingName ?? '',
                    billingLastName: c.billingLastName ?? '',
                    billingDocType: docType,
                    billingDocNumber: c.billingDocNumber ?? '',
                    billingEmail: c.billingEmail ?? '',
                    billingAddress: c.billingAddress ?? '',
                    billingPhone: c.billingPhone ?? ''
                });

                this.form.markAsPristine();
                this.billingForm.markAsPristine();
            }
        });
    }

    onUploadLogo(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/webp';

        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                this.notificationService.error('El logo no puede superar los 2 MB', 'Archivo muy grande');
                return;
            }

            const companyId = this.company()?.id;
            if (!companyId) return;

            this.uploadingLogo.set(true);
            this.companyService.uploadLogo(companyId, file).pipe(
                finalize(() => this.uploadingLogo.set(false)),
                takeUntilDestroyed(this.destroyRef)
            ).subscribe((updated) => {
                this.logoPreview.set(updated.logoSignedUrl);
                this.notificationService.success('Logo actualizado correctamente', 'Ok');
            });
        };

        input.click();
    }

    onSave(): void {
        if (this.form.invalid || this.billingForm.invalid) {
            this.form.markAllAsTouched();
            this.billingForm.markAllAsTouched();
            return;
        }

        const formData = this.form.getRawValue();
        const billingData = this.billingForm.getRawValue();
        const payload = {
            name: formData.name,
            city: formData.city,
            sectorId: formData.sectorId?.id ?? null,
            accountTypeId: formData.accountTypeId,
            accountBankId: formData.accountBankId,
            accountNumber: formData.accountNumber,
            billingName: billingData.billingName,
            billingLastName: billingData.billingLastName,
            billingDocTypeId: billingData.billingDocType?.id ?? null,
            billingDocNumber: billingData.billingDocNumber,
            billingEmail: billingData.billingEmail,
            billingAddress: billingData.billingAddress,
            billingState: billingData.billingState?.name ?? null,
            billingCity: billingData.billingCity?.name ?? null,
            billingPhone: billingData.billingPhone
        };

        this.saving.set(true);
        this.companyService.updateCompany(this.company()!.id, payload as any).pipe(
            finalize(() => this.saving.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.form.markAsPristine();
                this.billingForm.markAsPristine();
                this.notificationService.success('Empresa Actualizada Correctamente', 'Ok');
            }
        });
    }

    inviteDialogVisible = signal(false);
    inviting = signal(false);
    inviteForm = new FormGroup({
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] })
    });

    // Confirmation dialog
    confirmDialogVisible = signal(false);
    confirmDialogTitle = signal('');
    confirmDialogMessage = signal('');
    confirmDialogIcon = signal('');
    confirmDialogSeverity = signal<'success' | 'danger' | 'info'>('info');
    processingAction = signal(false);
    private pendingAction: (() => void) | null = null;

    onInvitationAction(event: TableActionEvent): void {
        switch (event.action) {
            case 'resendInvitation':
                this.confirmDialogTitle.set('Reenviar invitación');
                this.confirmDialogMessage.set(`La invitación será enviada nuevamente al correo ${event.row.email}. El usuario recibirá un nuevo enlace para unirse a la empresa.`);
                this.confirmDialogIcon.set('pi pi-replay');
                this.confirmDialogSeverity.set('info');
                this.pendingAction = () => this.resendInvitation(event.row.email);
                this.confirmDialogVisible.set(true);
                break;

            case 'deactivateUser':
                this.confirmDialogTitle.set('Desactivar usuario');
                this.confirmDialogMessage.set(`Se desactivará el acceso de ${event.row.email} a la empresa. El usuario no podrá iniciar sesión ni realizar cambios hasta que sea reactivado.`);
                this.confirmDialogIcon.set('pi pi-ban');
                this.confirmDialogSeverity.set('danger');
                this.pendingAction = () => this.toggleStatus(event.row.id, false);
                this.confirmDialogVisible.set(true);
                break;

            case 'activateUser':
                this.confirmDialogTitle.set('Activar usuario');
                this.confirmDialogMessage.set(`Se reactivará el acceso de ${event.row.email} a la empresa. El usuario podrá iniciar sesión y operar con normalidad.`);
                this.confirmDialogIcon.set('pi pi-check-circle');
                this.confirmDialogSeverity.set('success');
                this.pendingAction = () => this.toggleStatus(event.row.id, true);
                this.confirmDialogVisible.set(true);
                break;
        }
    }

    onConfirmAction(): void {
        this.pendingAction?.();
    }

    private resendInvitation(email: string): void {
        const companyId = this.company()?.id;
        if (!companyId) return;

        this.processingAction.set(true);
        this.companyService.inviteUser(companyId, email).pipe(
            finalize(() => {
                this.processingAction.set(false);
                this.confirmDialogVisible.set(false);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            this.notificationService.success('Invitación reenviada correctamente. El usuario recibirá un nuevo correo.');
            this.invitationsResource.reload();
        });
    }

    private toggleStatus(invitationId: string, isActive: boolean): void {
        this.processingAction.set(true);
        this.companyService.toggleInvitationStatus(invitationId, isActive).pipe(
            finalize(() => {
                this.processingAction.set(false);
                this.confirmDialogVisible.set(false);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            this.notificationService.success(isActive ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.');
            this.invitationsResource.reload();
        });
    }

    onInviteUser(): void {
        this.inviteForm.reset();
        this.inviteDialogVisible.set(true);
    }

    onInviteSubmit(): void {
        if (this.inviteForm.invalid) {
            this.inviteForm.markAllAsTouched();
            return;
        }

        const companyId = this.company()?.id;
        if (!companyId) return;

        this.inviting.set(true);
        this.companyService.inviteUser(companyId, this.inviteForm.controls.email.value).pipe(
            finalize(() => this.inviting.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            this.notificationService.success('Invitación enviada correctamente', 'Ok');
            this.inviteDialogVisible.set(false);
            this.companyResource.reload();
            this.invitationsResource.reload();
        });
    }

    isInvalid(controlName: string, form: FormGroup = this.form): boolean {
        const control = form.get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(controlName: string, form: FormGroup = this.form): string {
        const control = form.get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['email']) return 'Ingrese un email válido';
        if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
        return '';
    }
}
