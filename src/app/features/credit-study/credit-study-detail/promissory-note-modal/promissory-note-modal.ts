import { Component, DestroyRef, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { CreditStudyService } from '../../credit-study.service';
import { CustomersService } from '@/app/features/customers/customers.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';
import { CustomerSigner } from '@/app/types/customer';
import { PromissoryNote, PromissoryNotePreviewResponse, PromissoryNoteSigner } from '@/app/types/promissory-note';
import { DateOnlyPipe } from '@/app/shared/pipes/date-only.pipe';

@Component({
    selector: 'app-promissory-note-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, DialogModule, ButtonModule, InputTextModule, FloatLabelModule, SelectModule, MessageModule, SkeletonModule, PhoneInput, DateOnlyPipe],
    templateUrl: './promissory-note-modal.html'
})
export class PromissoryNoteModal {
    private destroyRef = inject(DestroyRef);
    private creditStudyService = inject(CreditStudyService);
    private customersService = inject(CustomersService);
    private parameterService = inject(ParameterService);
    private notificationService = inject(NotificationService);
    private sanitizer = inject(DomSanitizer);

    visible = model(false);
    creditStudyId = input<string>();
    /** Cliente del estudio: de él se traen los datos del firmante del pagaré. */
    customerId = input<string>();
    /** Se emite al cerrar el modal cuando el pagaré quedó generado. */
    generated = output<PromissoryNote>();

    previewing = signal(false);
    generating = signal(false);
    preview = signal<PromissoryNotePreviewResponse | null>(null);
    note = signal<PromissoryNote | null>(null);

    // ─── Firmante del pagaré ─────────────────────────────────────────────────

    /** Respuesta del endpoint de representante legal (define PN o PJ). */
    signer = signal<CustomerSigner | null>(null);
    loadingSigner = signal(false);
    signerError = signal(false);

    identificationTypes = toSignal(this.parameterService.getByType('identification_type'));

    signerForm = new FormGroup({
        legalRepName: new FormControl('', { nonNullable: true }),
        firstName: new FormControl('', { nonNullable: true }),
        secondName: new FormControl('', { nonNullable: true }),
        firstLastName: new FormControl('', { nonNullable: true }),
        secondLastName: new FormControl('', { nonNullable: true }),
        identificationTypeId: new FormControl<number | null>(null),
        identificationNumber: new FormControl('', { nonNullable: true }),
        email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
        phone: new FormControl('', { nonNullable: true })
    });

    /** Valor del formulario del firmante como señal, para recalcular los faltantes al escribir. */
    private signerValue = toSignal(this.signerForm.valueChanges, { initialValue: this.signerForm.value });

    isLegalEntity = computed(() => isLegalEntity(this.signer()));

    /** Campos del firmante que siguen sin diligenciar (dispara el aviso informativo). */
    missingSignerFields = computed<string[]>(() => {
        if (!this.signer()) return [];
        const v = this.signerValue();
        const missing: string[] = [];

        if (this.isLegalEntity()) {
            if (!v.legalRepName?.trim()) missing.push('Nombre del representante legal');
        } else if (!v.firstName?.trim() || !v.firstLastName?.trim()) {
            missing.push('Nombre del titular');
        }

        if (!v.identificationTypeId) missing.push('Tipo de identificación');
        if (!v.identificationNumber?.trim()) missing.push('Número de identificación');
        if (!v.email?.trim()) missing.push('Correo electrónico');
        if (!v.phone?.trim()) missing.push('Teléfono');

        return missing;
    });

    /** El pagaré va en blanco: no hay monto ni plazo que validar, solo el firmante. */
    canPreview = computed(() => !this.loadingSigner());

    /** HTML completo del pagaré para el iframe de vista previa. */
    previewHtml = computed<SafeHtml | null>(() => {
        const preview = this.preview();
        return preview ? this.sanitizer.bypassSecurityTrustHtml(preview.html) : null;
    });

    constructor() {
        // Al abrir el modal: estado limpio.
        effect(() => {
            if (!this.visible()) return;

            this.preview.set(null);
            this.note.set(null);

            const customerId = this.customerId();
            if (customerId) this.loadSigner(customerId);
        });

        // Los datos del firmante viajan en el preview: al editarlos, el documento
        // mostrado deja de corresponder con lo que se enviaría.
        this.signerForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.preview.set(null));
    }

    private loadSigner(customerId: string): void {
        this.signer.set(null);
        this.signerError.set(false);
        this.signerForm.reset();
        this.loadingSigner.set(true);

        this.customersService
            .getLegalRepresentative(customerId)
            .pipe(
                finalize(() => this.loadingSigner.set(false)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (signer) => {
                    this.signer.set(signer);
                    this.patchSigner(signer);
                },
                error: () => this.signerError.set(true)
            });
    }

    /** Vuelca la respuesta en el formulario según el tipo de persona. */
    private patchSigner(signer: CustomerSigner): void {
        const legalEntity = isLegalEntity(signer);

        this.signerForm.reset({
            legalRepName: signer.legalRepName ?? '',
            firstName: signer.firstName ?? '',
            secondName: signer.secondName ?? '',
            firstLastName: signer.firstLastName ?? '',
            secondLastName: signer.secondLastName ?? '',
            identificationTypeId: (legalEntity ? signer.legalRepIdentificationTypeId : signer.identificationTypeId) ?? null,
            identificationNumber: (legalEntity ? signer.legalRepIdentificationNumber : signer.identificationNumber) ?? '',
            email: (legalEntity ? signer.legalRepEmail : signer.email) ?? '',
            phone: (legalEntity ? signer.legalRepPhone : signer.phone) ?? ''
        });
    }

    private signerPayload(): PromissoryNoteSigner | undefined {
        const signer = this.signer();
        if (!signer) return undefined;

        const v = this.signerForm.getRawValue();
        const text = (value: string) => value.trim() || undefined;

        const payload: PromissoryNoteSigner = isLegalEntity(signer)
            ? {
                  legalRepName: text(v.legalRepName),
                  legalRepIdentificationTypeId: v.identificationTypeId ?? undefined,
                  legalRepIdentificationNumber: text(v.identificationNumber),
                  legalRepEmail: text(v.email),
                  legalRepPhone: text(v.phone)
              }
            : {
                  firstName: text(v.firstName),
                  secondName: text(v.secondName),
                  firstLastName: text(v.firstLastName),
                  secondLastName: text(v.secondLastName),
                  identificationTypeId: v.identificationTypeId ?? undefined,
                  identificationNumber: text(v.identificationNumber),
                  email: text(v.email),
                  phone: text(v.phone)
              };

        const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
        return entries.length ? (Object.fromEntries(entries) as PromissoryNoteSigner) : undefined;
    }

    onPreview(): void {
        const creditStudyId = this.creditStudyId();
        if (!creditStudyId || !this.canPreview()) return;

        this.previewing.set(true);
        this.creditStudyService
            .previewPromissoryNote({
                creditStudyId,
                signer: this.signerPayload()
            })
            .pipe(
                finalize(() => this.previewing.set(false)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((response) => this.preview.set(response));
    }

    onGenerate(): void {
        const creditStudyId = this.creditStudyId();
        if (!creditStudyId || !this.preview()) return;

        this.generating.set(true);
        this.creditStudyService
            .createPromissoryNote({
                creditStudyId,
                signer: this.signerPayload()
            })
            .pipe(
                finalize(() => this.generating.set(false)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((note) => {
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

/** El firmante es el representante legal solo en persona jurídica. */
function isLegalEntity(signer: CustomerSigner | null): boolean {
    return signer?.personType?.code === 'legalEntity' || signer?.personType?.label === 'PJ';
}
