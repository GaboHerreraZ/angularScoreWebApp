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
import { CustomTable } from '@/app/shared/components/table/table';
import { CompanyService } from './company.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { Company as CompanyModel } from '@/app/types/company';
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

    saving = signal(false);
    company = signal<CompanyModel | null>(null);

    subscriptionUsageResource = resource<SubscriptionUsage, string>({
        params: () => this.company()?.id as string,
        loader: ({ params: companyId }) => firstValueFrom(this.companyService.getSubscriptionUsage(companyId))
    });

    subscriptionUsage = computed(() => this.subscriptionUsageResource.value() ?? null);

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

    usersData = computed(() => {
        const c = this.company();
        if (!c?.userCompanies) return [];
        return c.userCompanies.map(uc => ({
            id: uc.id,
            fullName: `${uc.user.name} ${uc.user.lastName}`,
            isActive: uc.isActive,
            role: uc.role.label,
            phone: uc.user.phone,
            email: uc.user.email,
            canDelete: uc.role.code !== 'administrator'
        }));
    });

    usersTableSettings = computed<TableSettings>(() => {
        const c = this.company();
        const maxUsers = c?.subscription?.maxUsers ?? 0;
        const currentUsers = c?.userCompanies?.length ?? 0;
        return {
            title: 'Usuarios Asociados',
            titleIcon: 'pi pi-users',
            columns: [
                { header: 'Nombre Completo', field: 'fullName', type: 'text' },
                { header: 'Activo', field: 'isActive', type: 'boolean', filterable: false },
                { header: 'Rol', field: 'role', type: 'text' },
                { header: 'Teléfono', field: 'phone', type: 'text', filterable: false },
                { header: 'Correo', field: 'email', type: 'text' }
            ],
            actions: [
                { id: 'delete', icon: 'pi pi-trash', severity: 'danger', tooltip: 'Eliminar', visibleField: 'canDelete' }
            ],
            addButton: {
                label: 'Invitar usuario',
                icon: 'pi pi-user-plus',
                severity: 'success',
                disabled: currentUsers >= maxUsers
            },
            rows: 5,
            rowsPerPageOptions: [5, 10],
            showGridlines: false,
            showSearch: false,
            showColumnFilters: false
        };
    });

    form = new FormGroup({
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        nit: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
        state: new FormControl({value:'', disabled: true}, { nonNullable: true }),
        city: new FormControl({value:'', disabled: true}, { nonNullable: true  }),
        sectorId: new FormControl<number | null>(null, { validators: [Validators.required] }),
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
            sectorId: formData.sectorId
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

    onUserAction(event: TableActionEvent): void {
        if (event.action === 'delete') {
            console.log('Delete user:', event.row);
        }
    }

    onInviteUser(): void {
        console.log('Invite user');
    }

    isInvalid(controlName: string): boolean {
        const control = this.form.get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(controlName: string): string {
        const control = this.form.get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        return '';
    }
}
