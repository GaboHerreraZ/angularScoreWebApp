import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { CreditStudyStep1, BureauPerson } from '@/app/types/credit-study';

interface PeopleSection {
    title: string;
    icon: string;
    people: BureauPerson[];
}

@Component({
    selector: 'app-bureau-profile',
    standalone: true,
    imports: [CommonModule, TagModule, TableModule],
    templateUrl: './bureau-profile.html'
})
export class BureauProfile {
    step1 = input.required<CreditStudyStep1>();

    customer = computed(() => this.step1().customer);
    isLegalEntity = computed(() => this.step1().isLegalEntity);
    profile = computed(() => this.customer().bureauProfile);

    /** Nombre completo para persona natural. */
    fullName = computed(() => {
        const c = this.customer();
        const parts = [c.firstName, c.secondName, c.firstLastName, c.secondLastName].filter(Boolean);
        return parts.length ? parts.join(' ') : (c.businessName ?? null);
    });

    /** Documento con dígito de verificación cuando aplica. */
    identificationDisplay = computed(() => {
        const c = this.customer();
        if (!c.identificationNumber) return null;
        return c.verificationDigit ? `${c.identificationNumber}-${c.verificationDigit}` : c.identificationNumber;
    });

    /** Grupos de personas (rep. legal, junta, socios, revisoría) para persona jurídica. */
    peopleSections = computed<PeopleSection[]>(() => {
        const p = this.profile();
        if (!p) return [];

        const sections: PeopleSection[] = [];

        const legalRep = [...(p.legalRep?.main ?? []), ...(p.legalRep?.alternates ?? [])];
        if (legalRep.length) {
            sections.push({ title: 'Representación Legal', icon: 'pi pi-id-card', people: legalRep });
        }

        const board = [...(p.board?.main ?? []), ...(p.board?.alternates ?? [])];
        if (board.length) {
            sections.push({ title: 'Junta Directiva', icon: 'pi pi-users', people: board });
        }

        const auditors = [
            ...(p.statutoryAuditors?.main ?? []),
            ...(p.statutoryAuditors?.alternates ?? []),
            ...(p.statutoryAuditors?.auditFirm ? [p.statutoryAuditors.auditFirm] : [])
        ];
        if (auditors.length) {
            sections.push({ title: 'Revisoría Fiscal', icon: 'pi pi-verified', people: auditors });
        }

        return sections;
    });

    partners = computed(() => this.profile()?.partners ?? null);

    lastConsultedDisplay = computed(() => {
        const raw = this.customer().lastConsultedAt;
        if (!raw) return null;
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
    });

    statusSeverity(status: string | null): 'success' | 'danger' | 'warn' | 'secondary' {
        if (!status) return 'secondary';
        const s = status.toUpperCase();
        if (s === 'ACTIVO' || s === 'ACTIVA' || s === 'VIGENTE') return 'success';
        if (s === 'INACTIVO' || s === 'INACTIVA' || s === 'CANCELADA') return 'danger';
        return 'warn';
    }
}
