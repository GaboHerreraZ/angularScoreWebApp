import { Component, DestroyRef, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CreditStudyService } from '../../credit-study.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { PromissoryNote, PromissoryNotePreviewResponse } from '@/app/types/promissory-note';

@Component({
    selector: 'app-promissory-note-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputNumberModule, FloatLabelModule],
    templateUrl: './promissory-note-modal.html'
})
export class PromissoryNoteModal {
    private destroyRef = inject(DestroyRef);
    private creditStudyService = inject(CreditStudyService);
    private notificationService = inject(NotificationService);
    private sanitizer = inject(DomSanitizer);

    visible = model(false);
    creditStudyId = input<string>();
    /** Cupo viable del resultado del estudio (valor inicial editable). */
    defaultAmount = input<number | null>(null);
    /** Plazo solicitado en días (valor inicial editable). */
    defaultTermDays = input<number | null>(null);
    /** Se emite al cerrar el modal cuando el pagaré quedó generado. */
    generated = output<PromissoryNote>();

    amount = signal<number | null>(null);
    termDays = signal<number | null>(null);

    previewing = signal(false);
    generating = signal(false);
    preview = signal<PromissoryNotePreviewResponse | null>(null);
    note = signal<PromissoryNote | null>(null);

    canPreview = computed(() => (this.amount() ?? 0) > 0 && (this.termDays() ?? 0) > 0);

    /** HTML completo del pagaré para el iframe de vista previa. */
    previewHtml = computed<SafeHtml | null>(() => {
        const preview = this.preview();
        return preview ? this.sanitizer.bypassSecurityTrustHtml(preview.html) : null;
    });

    constructor() {
        // Al abrir el modal: estado limpio con los valores que trae el estudio.
        effect(() => {
            if (this.visible()) {
                this.preview.set(null);
                this.note.set(null);
                this.amount.set(this.defaultAmount());
                this.termDays.set(this.defaultTermDays());
            }
        });
    }

    /** Cualquier cambio en los valores invalida la vista previa ya generada. */
    onAmountChange(value: number | null): void {
        this.amount.set(value);
        this.preview.set(null);
    }

    onTermChange(value: number | null): void {
        this.termDays.set(value);
        this.preview.set(null);
    }

    onPreview(): void {
        const creditStudyId = this.creditStudyId();
        if (!creditStudyId || !this.canPreview()) return;

        this.previewing.set(true);
        this.creditStudyService.previewPromissoryNote({
            creditStudyId,
            amount: this.amount()!,
            termDays: this.termDays()!
        }).pipe(
            finalize(() => this.previewing.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((response) => this.preview.set(response));
    }

    onGenerate(): void {
        const creditStudyId = this.creditStudyId();
        if (!creditStudyId || !this.preview()) return;

        this.generating.set(true);
        this.creditStudyService.createPromissoryNote({
            creditStudyId,
            amount: this.amount()!,
            termDays: this.termDays()!
        }).pipe(
            finalize(() => this.generating.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((note) => {
            this.note.set(note);
            this.notificationService.success('Pagaré generado y enviado a firma');
        });
    }

    close(): void {
        this.visible.set(false);
    }

    /** Cubre también el cierre con la X o Escape: notifica si hubo pagaré generado. */
    onHide(): void {
        const note = this.note();
        if (note) {
            this.generated.emit(note);
        }
    }
}
