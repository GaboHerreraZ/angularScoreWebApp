import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaymentCapacityService } from '../payment-capacity.service';
import { DocumentUploadCard } from '../document-upload-card/document-upload-card';
import {
    CreditStudyDocumentsStep,
    DocumentCoverage,
    EmploymentTypeCode,
    StudyDocument,
    StudyDocumentTypeCode
} from '@/app/types/payment-capacity';
import { formatMonth } from '@/app/shared/utils/format.util';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { ConfirmService, provideConfirm } from '@/app/shared/services/confirm.service';

/** Cardinalidad máxima por tipo, alineada con las constantes del backend. */
const MAX_BY_TYPE: Record<StudyDocumentTypeCode, number> = {
    bankStatement: 12,
    payrollStub: 2,
    contractorInvoice: 2
};

/**
 * Paso 2 del estudio de capacidad: carga de los soportes de ingreso. El perfil
 * laboral define qué tarjetas se muestran (un asalariado acredita con
 * desprendibles; un independiente con extractos ampliados y facturas) y cuántos
 * meses de extractos exige la ventana. Cada carga se procesa en línea en el
 * backend, así que tras subir se recarga el estudio completo.
 */
@Component({
    selector: 'app-payment-capacity-documents',
    standalone: true,
    imports: [CommonModule, ButtonModule, MessageModule, ConfirmDialogModule, DocumentUploadCard],
    providers: [provideConfirm()],
    templateUrl: './payment-capacity-documents.html'
})
export class PaymentCapacityDocuments {
    private destroyRef = inject(DestroyRef);
    private paymentCapacityService = inject(PaymentCapacityService);
    private notificationService = inject(NotificationService);
    private confirmService = inject(ConfirmService);

    creditStudyId = input.required<string>();
    /** Step 2 del GET /steps; null mientras no se haya cargado ningún documento. */
    step2 = input<CreditStudyDocumentsStep | null>(null);
    employmentType = input<EmploymentTypeCode>('salaried');
    readOnly = input<boolean>(false);

    /** El padre recarga los steps: la cobertura y el estado cambian con cada carga. */
    changed = output<void>();

    /** Tipo que se está subiendo en este momento (para el loader de esa tarjeta). */
    uploadingType = signal<StudyDocumentTypeCode | null>(null);

    readonly maxByType = MAX_BY_TYPE;

    isIndependent = computed(() => this.employmentType() === 'independent');

    documents = computed<StudyDocument[]>(() => this.step2()?.documents ?? []);

    coverage = computed<DocumentCoverage | null>(() => this.step2()?.coverage ?? null);

    statements = computed(() => this.byType('bankStatement'));
    payrollStubs = computed(() => this.byType('payrollStub'));
    contractorInvoices = computed(() => this.byType('contractorInvoice'));

    /** Meses cubiertos vs requeridos, como porcentaje para la barra. */
    coveragePercent = computed(() => {
        const coverage = this.coverage();
        if (!coverage || coverage.requiredMonths === 0) return 0;
        return Math.min(100, Math.round((coverage.coveredMonths / coverage.requiredMonths) * 100));
    });

    coverageComplete = computed(() => this.coverage()?.complete ?? false);

    /** Meses de extractos exigidos según el perfil (3 asalariado / 6 independiente). */
    requiredMonths = computed(() => this.coverage()?.requiredMonths ?? (this.isIndependent() ? 6 : 3));

    /** El extracto más reciente quedó fuera de la ventana de frescura del backend. */
    staleStatements = computed(() => this.coverage()?.recencyOk === false);

    /** Recomendación (no bloqueante) de un segundo desprendible. */
    singleStubWarning = computed(() =>
        !this.isIndependent() && this.payrollStubs().filter(d => d.extractionStatus === 'success').length === 1
    );

    /** Meses cubiertos en formato legible ("abr 2026, may 2026…"). */
    coveredMonthLabels = computed(() =>
        (this.coverage()?.months ?? []).map(month => formatMonth(month, 'short'))
    );

    onFileSelected(file: File, documentTypeCode: StudyDocumentTypeCode): void {
        const id = this.creditStudyId();
        if (!id || this.uploadingType()) return;

        this.uploadingType.set(documentTypeCode);
        this.paymentCapacityService.uploadDocument(id, file, documentTypeCode).pipe(
            finalize(() => this.uploadingType.set(null)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                if (response.document.extractionStatus === 'error') {
                    this.notificationService.warn(
                        'El documento se guardó pero no se pudo leer. Revíselo y cárguelo de nuevo.',
                        'Lectura fallida'
                    );
                } else {
                    this.notificationService.success('Documento procesado correctamente');
                }
                this.changed.emit();
            },
            // El interceptor ya muestra el error del backend; aquí solo hay que
            // refrescar, porque una carga fallida sí dejó la fila en el estudio.
            error: () => this.changed.emit()
        });
    }

    onRemoveDocument(documentId: string): void {
        const id = this.creditStudyId();
        if (!id) return;

        this.confirmService.confirm({
            title: 'Eliminar documento',
            message: 'Se eliminará el documento y la información extraída de él. La cobertura del estudio se recalculará.',
            kind: 'danger',
            icon: 'pi pi-trash',
            acceptLabel: 'Sí, eliminar',
            onAccept: () => {
                this.paymentCapacityService.deleteDocument(id, documentId).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe(() => {
                    this.notificationService.success('Documento eliminado');
                    this.changed.emit();
                });
            }
        });
    }

    /** Abre el PDF original en otra pestaña con una URL temporal del storage. */
    onViewDocument(documentId: string): void {
        const id = this.creditStudyId();
        if (!id) return;

        this.paymentCapacityService.getDocumentFileUrl(id, documentId).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((response) => {
            if (response.url) {
                window.open(response.url, '_blank', 'noopener');
            }
        });
    }

    private byType(code: StudyDocumentTypeCode): StudyDocument[] {
        return this.documents().filter(d => d.documentType.code === code);
    }

}
