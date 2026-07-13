import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { CustomersService } from '../customers.service';
import { HelpTooltip } from '@/app/shared/components/help-tooltip/help-tooltip';
import { CustomerDetail as CustomerDetailModel, BureauPerson } from '@/app/types/customer';
import { formatCurrency, formatShortDate } from '@/app/shared/utils/format.util';

interface InfoField {
    label: string;
    value: string | null | undefined;
    icon?: string;
    span?: boolean;
}

@Component({
    selector: 'app-customer-detail',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule, SkeletonModule, TableModule, HelpTooltip],
    templateUrl: './customer-detail.html'
})
export class CustomerDetail {
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);
    private customersService = inject(CustomersService);

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

    isJuridica = computed(() => this.customer()?.personType?.code === 'PJ');
    bureau = computed(() => this.customer()?.bureauProfile ?? null);

    // ── Datos de identificación ────────────────────────────────────────────
    generalFields = computed<InfoField[]>(() => {
        const c = this.customer();
        if (!c) return [];
        const idLabel = c.verificationDigit
            ? `${c.identificationNumber}-${c.verificationDigit}`
            : c.identificationNumber;
        return [
            { label: 'Tipo de persona', value: c.personType?.label, icon: 'pi pi-user' },
            { label: 'Tipo de identificación', value: c.identificationType?.label, icon: 'pi pi-id-card' },
            { label: 'Número de identificación', value: idLabel, icon: 'pi pi-hashtag' },
            { label: 'Actividad económica', value: c.economicActivity?.label, icon: 'pi pi-briefcase', span: true }
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

    // ── Persona jurídica: perfil de buró ───────────────────────────────────
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
