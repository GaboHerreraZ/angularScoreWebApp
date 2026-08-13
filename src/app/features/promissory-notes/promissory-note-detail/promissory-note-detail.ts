import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PromissoryNotesService } from '../promissory-notes.service';
import { ConfirmService, provideConfirm } from '@/app/shared/services/confirm.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { PromissoryNoteDetail as PromissoryNoteDetailModel } from '@/app/types/promissory-note';
import { TagSeverity } from '@/app/types/table';
import { formatCurrency, formatShortDate } from '@/app/shared/utils/format.util';

interface InfoField {
    label: string;
    value: string | null | undefined;
    icon?: string;
    span?: boolean;
}

/** Ventana (en días) antes del vencimiento en la que se habilita el recordatorio. */
const REMINDER_WINDOW_DAYS = 7;

const VIABILITY_LABELS: Record<string, string> = {
    approved: 'Viable',
    conditional: 'Viable con condiciones',
    rejected: 'No viable'
};

@Component({
    selector: 'app-promissory-note-detail',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, ConfirmDialogModule, SkeletonModule, TagModule, TooltipModule],
    providers: [provideConfirm()],
    templateUrl: './promissory-note-detail.html'
})
export class PromissoryNoteDetail {
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private promissoryNotesService = inject(PromissoryNotesService);
    private confirmService = inject(ConfirmService);
    private notificationService = inject(NotificationService);

    noteId = toSignal(
        this.route.params.pipe(
            map(p => p['id']),
            filter((id): id is string => id !== undefined),
            distinctUntilChanged()
        )
    );

    loading = signal(false);
    sendingReminder = signal(false);
    note = signal<PromissoryNoteDetailModel | null>(null);

    isSigned = computed(() => this.note()?.status?.code === 'signed');

    statusSeverity = computed<TagSeverity>(() => {
        const map: Record<string, TagSeverity> = {
            signed: 'success',
            sent: 'info',
            pending: 'warn',
            declined: 'danger'
        };
        return map[this.note()?.status?.code ?? ''] ?? 'info';
    });

    amountLabel = computed(() => formatCurrency(this.note()?.amount));

    /** Chip del vencimiento: rojo si ya venció, ámbar si vence en la próxima semana. */
    dueTag = computed<{ label: string; severity: TagSeverity; icon: string } | null>(() => {
        const dueDate = this.note()?.dueDate;
        if (!dueDate) return null;
        const due = new Date(dueDate);
        const now = new Date();
        if (due < now) {
            return { label: `Venció el ${formatShortDate(dueDate)}`, severity: 'danger', icon: 'pi pi-exclamation-triangle' };
        }
        const soon = new Date(due);
        soon.setDate(soon.getDate() - REMINDER_WINDOW_DAYS);
        if (now >= soon) {
            return { label: `Vence el ${formatShortDate(dueDate)}`, severity: 'warn', icon: 'pi pi-clock' };
        }
        return { label: `Vence el ${formatShortDate(dueDate)}`, severity: 'secondary', icon: 'pi pi-calendar' };
    });

    /** Fecha desde la que se habilita el recordatorio (una semana antes del vencimiento). */
    reminderAvailableFrom = computed<Date | null>(() => {
        const dueDate = this.note()?.dueDate;
        if (!dueDate) return null;
        const from = new Date(dueDate);
        from.setDate(from.getDate() - REMINDER_WINDOW_DAYS);
        return from;
    });

    /** El recordatorio aplica solo a pagarés firmados, con vencimiento, dentro de la ventana. */
    canSendReminder = computed(() => {
        const from = this.reminderAvailableFrom();
        return this.isSigned() && from !== null && Date.now() >= from.getTime();
    });

    /** Explica por qué el botón está deshabilitado; vacío cuando está habilitado. */
    reminderTooltip = computed(() => {
        const note = this.note();
        if (!note || this.canSendReminder()) return '';
        if (!this.isSigned()) return 'Solo se puede enviar el recordatorio de pago de pagarés firmados.';
        if (!note.dueDate) return 'El pagaré no tiene fecha de vencimiento registrada.';
        const from = this.reminderAvailableFrom();
        return `Disponible desde el ${formatShortDate(from!.toISOString())} (una semana antes del vencimiento).`;
    });

    // ── Secciones de información ────────────────────────────────────────────
    noteFields = computed<InfoField[]>(() => {
        const n = this.note();
        if (!n) return [];
        const createdBy = [n.createdByUser?.name, n.createdByUser?.lastName].filter(Boolean).join(' ');
        return [
            { label: 'Número de pagaré', value: `${n.noteNumber}`, icon: 'pi pi-hashtag' },
            { label: 'Monto', value: formatCurrency(n.amount), icon: 'pi pi-dollar' },
            { label: 'Plazo', value: n.termDays != null ? `${n.termDays} días` : null, icon: 'pi pi-calendar' },
            { label: 'Fecha de vencimiento', value: formatShortDate(n.dueDate), icon: 'pi pi-calendar-clock' },
            { label: 'Ciudad de firma', value: n.signCity, icon: 'pi pi-map-marker' },
            { label: 'Fecha de creación', value: formatShortDate(n.createdAt), icon: 'pi pi-clock' },
            { label: 'Creado por', value: createdBy || n.createdByUser?.email, icon: 'pi pi-user' },
            { label: 'Monto en letras', value: n.amountInWords, icon: 'pi pi-align-left', span: true }
        ];
    });

    creditorFields = computed<InfoField[]>(() => {
        const n = this.note();
        if (!n) return [];
        return [
            { label: 'Empresa', value: n.company?.name, icon: 'pi pi-building' },
            { label: 'NIT', value: n.company?.nit, icon: 'pi pi-id-card' },
            { label: 'Dirección', value: n.creditorAddress ?? n.company?.address, icon: 'pi pi-home' },
            { label: 'Banco', value: n.creditorBank, icon: 'pi pi-building-columns' },
            { label: 'Tipo de cuenta', value: n.creditorAccountType, icon: 'pi pi-wallet' },
            { label: 'Número de cuenta', value: n.creditorAccountNumber, icon: 'pi pi-hashtag' }
        ];
    });

    customerFields = computed<InfoField[]>(() => {
        const c = this.note()?.customer;
        if (!c) return [];
        const idNumber = c.verificationDigit ? `${c.identificationNumber}-${c.verificationDigit}` : c.identificationNumber;
        const idLabel = c.identificationType?.label ? `${c.identificationType.label} ${idNumber}` : idNumber;
        const fields: InfoField[] = [
            { label: 'Razón social', value: c.businessName, icon: 'pi pi-building' },
            { label: 'Identificación', value: idLabel, icon: 'pi pi-id-card' },
            { label: 'Tipo de persona', value: c.personType?.label, icon: 'pi pi-user' },
            { label: 'Correo electrónico', value: c.email, icon: 'pi pi-envelope' },
            { label: 'Teléfono', value: c.phone, icon: 'pi pi-phone' },
            { label: 'Ciudad', value: c.city, icon: 'pi pi-map-marker' },
            { label: 'Dirección', value: c.address, icon: 'pi pi-home' }
        ];
        if (c.legalRepName || c.legalRepEmail) {
            fields.push(
                { label: 'Representante legal', value: c.legalRepName, icon: 'pi pi-user-edit' },
                { label: 'Correo del representante', value: c.legalRepEmail, icon: 'pi pi-envelope' }
            );
        }
        return fields;
    });

    signatureFields = computed<InfoField[]>(() => {
        const n = this.note();
        if (!n) return [];
        const fields: InfoField[] = [
            { label: 'Proveedor de firma', value: n.provider, icon: 'pi pi-verified' },
            { label: 'Enviado a firma', value: formatShortDate(n.sentAt), icon: 'pi pi-send' },
            { label: 'Firmado', value: formatShortDate(n.signedAt), icon: 'pi pi-check-circle' }
        ];
        if (n.declinedAt) {
            fields.push({ label: 'Rechazado', value: formatShortDate(n.declinedAt), icon: 'pi pi-times-circle' });
        }
        if (n.refusedReason) {
            fields.push({ label: 'Motivo del rechazo', value: n.refusedReason, icon: 'pi pi-comment', span: true });
        }
        return fields;
    });

    studyFields = computed<InfoField[]>(() => {
        const s = this.note()?.creditStudy;
        if (!s) return [];
        const viability = s.viabilityStatus ? (VIABILITY_LABELS[s.viabilityStatus] ?? s.viabilityStatus) : null;
        return [
            { label: 'Fecha del estudio', value: formatShortDate(s.studyDate), icon: 'pi pi-calendar' },
            { label: 'Fecha de resolución', value: formatShortDate(s.resolutionDate), icon: 'pi pi-calendar-plus' },
            { label: 'Cupo solicitado', value: formatCurrency(s.requestedCreditLine), icon: 'pi pi-dollar' },
            { label: 'Cupo recomendado', value: formatCurrency(s.recommendedCreditLine), icon: 'pi pi-dollar' },
            { label: 'Plazo solicitado', value: s.requestedTerm != null ? `${s.requestedTerm} días` : null, icon: 'pi pi-calendar' },
            { label: 'Score de viabilidad', value: s.viabilityScore != null ? `${s.viabilityScore} / 100` : null, icon: 'pi pi-chart-line' },
            { label: 'Viabilidad', value: viability, icon: 'pi pi-check-square' },
            { label: 'Estado del estudio', value: s.status?.label, icon: 'pi pi-flag' }
        ];
    });

    constructor() {
        effect(() => {
            const id = this.noteId();
            if (id) this.loadNote(Number(id));
        });
    }

    confirmSendReminder(): void {
        const note = this.note();
        if (!note || !this.canSendReminder()) return;
        const email = note.customer?.email || note.customer?.legalRepEmail;
        this.confirmService.confirm({
            title: 'Enviar recordatorio de pago',
            message: `Se enviará un correo al deudor${email ? ` (${email})` : ''} recordando que el pagaré vence el ${formatShortDate(note.dueDate)}.`,
            kind: 'info',
            icon: 'pi pi-bell',
            acceptLabel: 'Sí, enviar',
            onAccept: () => this.sendReminder(note.id)
        });
    }

    onBack(): void {
        this.router.navigate(['/app/pagares']);
    }

    onViewStudy(): void {
        const studyId = this.note()?.creditStudy?.id ?? this.note()?.creditStudyId;
        if (studyId) {
            this.router.navigate(['/app/estudio-credito/detalle-estudio', studyId]);
        }
    }

    openUrl(url: string | null): void {
        if (url) window.open(url, '_blank', 'noopener');
    }

    private sendReminder(id: number): void {
        this.sendingReminder.set(true);
        this.promissoryNotesService.sendPaymentReminder(id).pipe(
            finalize(() => this.sendingReminder.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            // Los errores (400/404/500) ya los notifica el interceptor con el mensaje del backend.
            next: (response) => this.notificationService.success(`Recordatorio de pago enviado a ${response.sentTo}.`)
        });
    }

    private loadNote(id: number): void {
        this.loading.set(true);
        this.promissoryNotesService.getPromissoryNoteById(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(note => this.note.set(note));
    }
}
