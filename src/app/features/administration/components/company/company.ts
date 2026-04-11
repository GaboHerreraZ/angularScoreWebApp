import { Component, computed, DestroyRef, effect, inject, resource, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass, DecimalPipe } from '@angular/common';
import { finalize, firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { CustomTable } from '@/app/shared/components/table/table';
import { CompanyService } from './company.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { Company as CompanyModel } from '@/app/types/company';
import { InvitationsResponse } from '@/app/types/invitation';
import { Parameter } from '@/app/types/parameter';
import { SubscriptionUsage } from '@/app/types/subscription';
import { TableActionEvent, TableSettings } from '@/app/types/table';

@Component({
    selector: 'app-company',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        DecimalPipe,
        NgClass,
        ButtonModule,
        CardModule,
        InputTextModule,
        SelectModule,
        FloatLabelModule,
        FluidModule,
        TagModule,
        SkeletonModule,
        ProgressBarModule,
        TooltipModule,
        DialogModule,
        CustomTable
    ],
    templateUrl: './company.html'
})
export class Company {
    private destroyRef = inject(DestroyRef);
    private companyService = inject(CompanyService);
    private parameterService = inject(ParameterService);
    private supabaseService = inject(SupabaseService);
    private notificationService = inject(NotificationService);

    user = this.supabaseService.currentUser();

    companyResource = resource<CompanyModel[], string>({
        params: () => this.user!.id as string,
        loader: ({ params: userId }) => firstValueFrom(this.companyService.getCompanyByUser(userId))
    });

    sectorsResource = resource<Parameter[], string>({
        params: () => 'sector',
        loader: ({ params: type }) => firstValueFrom(this.parameterService.getByType(type))
    });

    accountTypesResource = resource<Parameter[], string>({
        params: () => 'account_type',
        loader: ({ params: type }) => firstValueFrom(this.parameterService.getByType(type))
    });

    banksResource = resource<Parameter[], string>({
        params: () => 'bank',
        loader: ({ params: type }) => firstValueFrom(this.parameterService.getByType(type))
    });

    saving = signal(false);
    company = signal<CompanyModel | null>(null);

    subscriptionUsageResource = resource<SubscriptionUsage, string>({
        params: () => this.company()?.id as string,
        loader: ({ params: companyId }) => firstValueFrom(this.companyService.getSubscriptionUsage(companyId))
    });

    subscriptionUsage = computed(() => this.subscriptionUsageResource.value() ?? null);

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
            canResend: inv.status.code === 'rechazada',
            canDeactivate: inv.status.code === 'aceptada',
            canActivate: inv.status.code === 'cancelado'
        }));
    });

    invitationsTableSettings: TableSettings = {
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
        addButton: {
            label: 'Invitar usuario',
            icon: 'pi pi-user-plus',
            severity: 'success'
        },
        rows: 5,
        rowsPerPageOptions: [5, 10],
        showGridlines: false,
        showSearch: false,
        showColumnFilters: false
    };

    usagePercentage(used: number, max: number): number {
        if (max === 0) return 0;
        return Math.round((used / max) * 100);
    }

    usageSeverity(used: number, max: number): string {
        const pct = this.usagePercentage(used, max);
        if (pct >= 90) return 'danger';
        if (pct >= 70) return 'warn';
        return 'success';
    }

    usageProgressColor(used: number, max: number): string {
        const pct = this.usagePercentage(used, max);
        if (pct >= 90) return 'var(--red-500)';
        if (pct >= 70) return 'var(--yellow-500)';
        return 'var(--green-500)';
    }

    supportLevelLabel(level: string): string {
        const labels: Record<string, string> = {
            email: 'Correo electrónico',
            priority: 'Prioritario',
            dedicated: 'Dedicado'
        };
        return labels[level] ?? level;
    }

    dashboardLevelLabel(level: string): string {
        const labels: Record<string, string> = {
            basic: 'Básico',
            advanced: 'Avanzado',
            full: 'Completo'
        };
        return labels[level] ?? level;
    }

    form = new FormGroup({
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        nit: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
        state: new FormControl({value:'', disabled: true}, { nonNullable: true }),
        city: new FormControl({value:'', disabled: true}, { nonNullable: true  }),
        sectorId: new FormControl<number | null>(null, { validators: [Validators.required] }),
        accountTypeId: new FormControl<number | null>(null),
        accountBankId: new FormControl<number | null>(null),
        accountNumber: new FormControl<string | null>(null, { validators: [Validators.maxLength(50)] }),
        isActive: new FormControl({ value: false, disabled: true }, { nonNullable: true }),
        createdAt: new FormControl({ value: '', disabled: true }, { nonNullable: true })
    });

    constructor() {
        effect(() => {
            const companies = this.companyResource.value();
            if (companies?.length) {
                const c: CompanyModel = companies[0];
                this.company.set(c);
                this.form.patchValue({
                    name: c.name,
                    nit: c.nit,
                    city: c.city,
                    state: c.state,
                    sectorId: c.sectorId,
                    accountTypeId: c.accountTypeId,
                    accountBankId: c.accountBankId,
                    accountNumber: c.accountNumber,
                    isActive: c.isActive,
                    createdAt: new Date(c.createdAt).toLocaleDateString('es-CO')
                });
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formData = this.form.getRawValue();
        const payload = {
            name: formData.name,
            city: formData.city,
            sectorId: formData.sectorId,
            accountTypeId: formData.accountTypeId,
            accountBankId: formData.accountBankId,
            accountNumber: formData.accountNumber
        };

        this.saving.set(true);
        this.companyService.updateCompany(this.company()!.id, payload as any).pipe(
            finalize(() => this.saving.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
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
        ).subscribe({
            next: () => {
                this.notificationService.success('Invitación reenviada correctamente. El usuario recibirá un nuevo correo.');
                this.invitationsResource.reload();
            },
            error: () => {
                this.notificationService.error('No se pudo reenviar la invitación. Intenta de nuevo.');
            }
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
        ).subscribe({
            next: () => {
                this.notificationService.success(isActive ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.');
                this.invitationsResource.reload();
            },
            error: () => {
                this.notificationService.error(isActive ? 'No se pudo activar el usuario.' : 'No se pudo desactivar el usuario.');
            }
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
        ).subscribe({
            next: () => {
                this.notificationService.success('Invitación enviada correctamente', 'Ok');
                this.inviteDialogVisible.set(false);
                this.companyResource.reload();
                this.invitationsResource.reload();
            },
            error: () => {
                this.notificationService.error('No se pudo enviar la invitación', 'Error');
            }
        });
    }

    isInvalid(controlName: string): boolean {
        const control = this.form.get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(controlName: string): string {
        const control = this.form.get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
        return '';
    }
}
