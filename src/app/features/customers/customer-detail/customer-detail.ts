import { Component, computed, DestroyRef, effect, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { SelectModule } from 'primeng/select';
import { CustomersService } from '../customers.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { HelpTooltip } from '@/app/shared/components/help-tooltip/help-tooltip';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';
import { SectorSelect } from '@/app/shared/components/sector-select/sector-select';
import { StateControl } from '@/app/shared/components/state-control/state-control';
import { CityControl } from '@/app/shared/components/city-control/city-control';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { CustomerDetail as CustomerDetailModel, BureauPerson, CustomerParameter, UpdateCustomerPayload } from '@/app/types/customer';
import { formatCurrency, formatShortDate } from '@/app/shared/utils/format.util';
import { LocationOption } from '@/app/core/services/locations.service';

interface InfoField {
    label: string;
    value: string | null | undefined;
    icon?: string;
    span?: boolean;
}



@Component({
    selector: 'app-customer-detail',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        TagModule,
        SkeletonModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        FloatLabelModule,
        FluidModule,
        SelectModule,
        HelpTooltip,
        PhoneInput,
        SectorSelect,
        StateControl,
        CityControl
    ],
    templateUrl: './customer-detail.html'
})
export class CustomerDetail {
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);
    private customersService = inject(CustomersService);
    private parameterService = inject(ParameterService);
    private notificationService = inject(NotificationService);

    // Lee :id de la ruta propia o de la del padre (el detalle vive dentro del wrapper con tabs).
    customerId = toSignal(
        (this.route.parent ? this.route.parent.params : this.route.params).pipe(
            map(p => p['id']),
            filter((id): id is string => id !== undefined),
            distinctUntilChanged()
        )
    );

    loading = signal(false);
    customer = signal<CustomerDetailModel | null>(null);

    isJuridica = computed(() => this.customer()?.personType?.code === 'legalEntity');
    bureau = computed(() => this.customer()?.bureauProfile ?? null);

    // ── Edición de datos de contacto y actividad económica ────────────────
    editing = signal(false);
    saving = signal(false);

    editForm = new FormGroup({
        email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
        phone: new FormControl('', { nonNullable: true }),
        state: new FormControl<LocationOption | null>(null),
        city: new FormControl<LocationOption | null>(null),
        address: new FormControl('', { nonNullable: true }),
        economicActivity: new FormControl<CustomerParameter | null>(null),
        legalRepName: new FormControl('', { nonNullable: true }),
        legalRepIdentificationTypeId: new FormControl<number | null>(null),
        legalRepIdentificationNumber: new FormControl('', { nonNullable: true }),
        legalRepEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
        legalRepPhone: new FormControl('', { nonNullable: true })
    });

    identificationTypes = toSignal(this.parameterService.getByType('identification_type'));

    stateRef = viewChild<StateControl>('stateRef');
    cityRef = viewChild<CityControl>('cityRef');

    regionCode = signal<string | null>(null);
    /** Nombres guardados como texto (API) pendientes de resolver contra los catálogos de departamento/ciudad. */
    private pendingStateName = signal<string | null>(null);
    private pendingCityName = signal<string | null>(null);
    /** Evita que la resolución programática del departamento borre la ciudad pendiente. */
    private resolvingState = false;

    // ── Datos de identificación (solo lectura) ─────────────────────────────
    generalFields = computed<InfoField[]>(() => {
        const c = this.customer();
        if (!c) return [];
        const idLabel = c.verificationDigit
            ? `${c.identificationNumber}-${c.verificationDigit}`
            : c.identificationNumber;
        return [
            { label: 'Tipo de persona', value: c.personType?.label, icon: 'pi pi-user' },
            { label: 'Tipo de identificación', value: c.identificationType?.label, icon: 'pi pi-id-card' },
            { label: 'Número de identificación', value: idLabel, icon: 'pi pi-hashtag' }
        ];
    });

    economicActivityLabel = computed(() => {
        const activity = this.customer()?.economicActivity;
        if (!activity) return null;
        return activity.code ? `${activity.code} - ${activity.label}` : activity.label;
    });

    // ── Representante legal (solo persona jurídica) ────────────────────────
    legalRepFields = computed<InfoField[]>(() => {
        const r = this.customer()?.legalRep;
        return [
            { label: 'Nombre completo', value: r?.name, icon: 'pi pi-user' },
            { label: 'Tipo de identificación', value: r?.identificationType?.label, icon: 'pi pi-id-card' },
            { label: 'Número de identificación', value: r?.identificationNumber, icon: 'pi pi-hashtag' },
            { label: 'Correo electrónico', value: r?.email, icon: 'pi pi-envelope' },
            { label: 'Teléfono', value: r?.phone, icon: 'pi pi-phone' }
        ];
    });

    contactFields = computed<InfoField[]>(() => {
        const c = this.customer();
        if (!c) return [];
        return [
            { label: 'Correo electrónico', value: c.email, icon: 'pi pi-envelope' },
            { label: 'Teléfono', value: c.phone, icon: 'pi pi-phone' },
            { label: 'Departamento', value: c.state, icon: 'pi pi-map' },
            { label: 'Ciudad', value: c.city, icon: 'pi pi-map-marker' },
            { label: 'Dirección', value: c.address, icon: 'pi pi-home', span: true }
        ];
    });

    // ── Persona natural ────────────────────────────────────────────────────
    nameFields = computed<InfoField[]>(() => {
        const n = this.customer()?.nameParts;
        if (!n) return [];
        return [
            { label: 'Primer nombre', value: n.firstName },
            { label: 'Segundo nombre', value: n.secondName },
            { label: 'Primer apellido', value: n.firstLastName },
            { label: 'Segundo apellido', value: n.secondLastName }
        ];
    });

    demographicsFields = computed<InfoField[]>(() => {
        const d = this.customer()?.demographics;
        if (!d) return [];
        return [
            { label: 'Fecha de nacimiento', value: formatShortDate(d.birthDate), icon: 'pi pi-calendar' },
            { label: 'Ciudad de nacimiento', value: d.birthCity, icon: 'pi pi-map-marker' },
            { label: 'Género', value: this.genderLabel(d.gender), icon: 'pi pi-user' },
            { label: 'Rango de edad', value: d.ageRange, icon: 'pi pi-chart-bar' },
            { label: 'Estado del documento', value: d.documentStatus, icon: 'pi pi-verified' }
        ];
    });

    // ── Persona jurídica: perfil de Datacredito ───────────────────────────────────
    bureauGeneralFields = computed<InfoField[]>(() => {
        const g = this.bureau()?.generalProfile;
        if (!g) return [];
        return [
            { label: 'Organización jurídica', value: g.legalOrganizationLabel },
            { label: 'Actividad económica (CIIU)', value: g.ciiuCode ? `${g.ciiuCode} — ${g.economicActivity ?? ''}` : g.economicActivity },
            { label: 'Número de empleados', value: g.employeeCount ? `${g.employeeCount} (${g.employeeRange ?? ''})` : g.employeeRange },
            { label: 'Fecha de constitución', value: formatShortDate(g.incorporationDate) },
            { label: 'Embargos', value: g.seizedLabel },
            { label: 'Liquidación', value: g.inLiquidationLabel },
            { label: 'Capital autorizado', value: formatCurrency(g.authorizedCapital) },
            { label: 'Capital suscrito', value: formatCurrency(g.subscribedCapital) },
            { label: 'Capital pagado', value: formatCurrency(g.paidCapital) }
        ];
    });

    bureauRegistrationFields = computed<InfoField[]>(() => {
        const r = this.bureau()?.registration;
        if (!r) return [];
        return [
            { label: 'Número de matrícula', value: r.number },
            { label: 'Cámara de comercio', value: r.chamberOfCommerce },
            { label: 'Constitución', value: formatShortDate(r.incorporation) },
            { label: 'Última renovación', value: formatShortDate(r.lastRenewal) },
            { label: 'Estado', value: r.status }
        ];
    });

    // Grupos de personas (rep. legal, junta, revisoría) aplanados en filas para la tabla.
    legalRepPeople = computed(() => this.flattenGroup(this.bureau()?.legalRep?.main, this.bureau()?.legalRep?.alternates));
    boardPeople = computed(() => this.flattenGroup(this.bureau()?.board?.main, this.bureau()?.board?.alternates));
    auditorPeople = computed(() => {
        const sa = this.bureau()?.statutoryAuditors;
        const people = this.flattenGroup(sa?.main, sa?.alternates);
        if (sa?.auditFirm) people.push(sa.auditFirm);
        return people;
    });
    partners = computed(() => this.bureau()?.partners ?? null);

    constructor() {
        effect(() => {
            const id = this.customerId();
            if (id) this.loadCustomer(id);
        });

        // Al cambiar el departamento se refresca la lista de ciudades; si el
        // cambio lo hizo el usuario (no la resolución inicial), la ciudad
        // seleccionada deja de ser válida y se limpia.
        this.editForm.controls.state.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(state => {
            this.regionCode.set(state?.code ?? null);
            if (this.resolvingState) {
                this.resolvingState = false;
            } else {
                this.pendingCityName.set(null);
                this.editForm.controls.city.reset();
            }
        });

        // Resuelve el departamento guardado (string) contra el catálogo una vez cargado.
        effect(() => {
            const departments = this.stateRef()?.departmentsResource.value();
            const pending = this.pendingStateName();
            if (!pending || !departments?.length) return;
            this.pendingStateName.set(null);
            const match = departments.find(d => d.name === pending) ?? null;
            if (match) {
                this.resolvingState = true;
                this.editForm.controls.state.setValue(match);
            }
        });

        // Resuelve la ciudad guardada (string) cuando cargan las ciudades del departamento.
        effect(() => {
            const cities = this.cityRef()?.citiesResource.value();
            const pending = this.pendingCityName();
            if (!pending || !cities?.length) return;
            this.pendingCityName.set(null);
            const match = cities.find(c => c.name === pending) ?? null;
            if (match) {
                this.editForm.controls.city.setValue(match, { emitEvent: false });
            }
        });
    }

    startEdit(): void {
        const c = this.customer();
        if (!c) return;
        this.editForm.reset({
            email: c.email ?? '',
            phone: c.phone ?? '',
            state: null,
            city: null,
            address: c.address ?? '',
            economicActivity: c.economicActivity ?? null,
            legalRepName: c.legalRep?.name ?? '',
            legalRepIdentificationTypeId: c.legalRep?.identificationType?.id ?? null,
            legalRepIdentificationNumber: c.legalRep?.identificationNumber ?? '',
            legalRepEmail: c.legalRep?.email ?? '',
            legalRepPhone: c.legalRep?.phone ?? ''
        });
        this.regionCode.set(null);
        this.pendingStateName.set(c.state);
        this.pendingCityName.set(c.city);
        this.editing.set(true);
    }

    cancelEdit(): void {
        this.editing.set(false);
        this.pendingStateName.set(null);
        this.pendingCityName.set(null);
    }

    saveEdit(): void {
        const c = this.customer();
        if (!c) return;
        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            return;
        }

        const v = this.editForm.getRawValue();
        const payload: UpdateCustomerPayload = {
            email: v.email.trim() || null,
            phone: v.phone.trim() || null,
            cityCode: v.city?.code ?? null,
            address: v.address.trim() || null,
            economicActivityId: v.economicActivity?.id ?? null
        };

        // El representante legal solo aplica (y solo viaja) para persona jurídica.
        if (this.isJuridica()) {
            payload.legalRepName = v.legalRepName.trim() || null;
            payload.legalRepIdentificationTypeId = v.legalRepIdentificationTypeId;
            payload.legalRepIdentificationNumber = v.legalRepIdentificationNumber.trim() || null;
            payload.legalRepEmail = v.legalRepEmail.trim() || null;
            payload.legalRepPhone = v.legalRepPhone.trim() || null;
        }

        this.saving.set(true);
        this.customersService.updateCustomer(c.id, payload).pipe(
            finalize(() => this.saving.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: updated => {
                this.customer.set(updated);
                this.customersService.customerUpdated.set(updated);
                this.editing.set(false);
                this.notificationService.success('La información del cliente se actualizó correctamente.');
            },
            error: () => this.notificationService.error('No se pudo actualizar la información del cliente. Intenta de nuevo.')
        });
    }

    isInvalid(controlName: string): boolean {
        const control = this.editForm.get(controlName);
        return !!control && control.invalid && control.touched;
    }

    private loadCustomer(id: string): void {
        this.loading.set(true);
        this.customersService.getCustomerById(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(customer => this.customer.set(customer));
    }

    fullName(p: BureauPerson): string {
        return [p.name, p.lastName].filter(Boolean).join(' ') || '—';
    }

    document(p: BureauPerson): string {
        return [p.documentType, p.documentNumber].filter(Boolean).join(' ') || '—';
    }

    private flattenGroup(main: BureauPerson[] | null | undefined, alternates: BureauPerson[] | null | undefined): BureauPerson[] {
        return [...(main ?? []), ...(alternates ?? [])];
    }

    private genderLabel(code: string | null): string | null {
        if (!code) return null;
        const map: Record<string, string> = { F: 'Femenino', M: 'Masculino' };
        return map[code] ?? code;
    }

}
