import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { StudyDocument } from '@/app/types/payment-capacity';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { formatMonth } from '@/app/shared/utils/format.util';

/** Tamaño máximo del PDF, alineado con el límite del backend. */
const MAX_PDF_SIZE_MB = 10;

/**
 * Tarjeta de carga para UN tipo de documento del estudio de capacidad
 * (extractos, desprendibles o facturas): explica qué se espera, lista lo ya
 * cargado con su estado de lectura y permite subir, ver o eliminar. La
 * selección del archivo y sus validaciones de forma viven aquí; las llamadas
 * al API las hace el contenedor.
 */
@Component({
    selector: 'app-document-upload-card',
    standalone: true,
    imports: [CommonModule, ButtonModule, TooltipModule],
    templateUrl: './document-upload-card.html'
})
export class DocumentUploadCard {
    private notificationService = inject(NotificationService);

    title = input.required<string>();
    description = input.required<string>();
    icon = input<string>('pi pi-file-pdf');
    /** Documentos ya cargados de este tipo (incluye los que fallaron). */
    documents = input.required<StudyDocument[]>();
    maxDocuments = input.required<number>();
    /** Texto de la exigencia mínima ("3 meses", "al menos 1"). */
    requirementHint = input<string | null>(null);
    uploading = input<boolean>(false);
    readOnly = input<boolean>(false);
    /** Marca la tarjeta como cubierta (medidor en verde). */
    satisfied = input<boolean>(false);

    fileSelected = output<File>();
    removeDocument = output<string>();
    viewDocument = output<string>();

    /** Los que fallaron no ocupan cupo: el backend tampoco los cuenta. */
    private activeCount = computed(() => this.documents().filter(d => d.extractionStatus !== 'error').length);

    canUpload = computed(() => !this.readOnly() && this.activeCount() < this.maxDocuments());

    openFileSelector(): void {
        if (!this.canUpload() || this.uploading()) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;

            if (file.type !== 'application/pdf') {
                this.notificationService.error('Solo se permiten archivos PDF', 'Formato inválido');
                return;
            }
            if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
                this.notificationService.error(
                    `El archivo excede el tamaño máximo permitido de ${MAX_PDF_SIZE_MB} MB`,
                    'Archivo muy grande'
                );
                return;
            }
            this.fileSelected.emit(file);
        };
        input.click();
    }

    /** Estado de la lectura del documento, con su color. */
    statusConfig(document: StudyDocument): { label: string; icon: string; classes: string } {
        switch (document.extractionStatus) {
            case 'success':
                return {
                    label: 'Procesado',
                    icon: 'pi pi-check-circle',
                    classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                };
            case 'error':
                return {
                    label: 'No se pudo leer',
                    icon: 'pi pi-times-circle',
                    classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                };
            default:
                return {
                    label: 'Procesando',
                    icon: 'pi pi-spin pi-spinner',
                    classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                };
        }
    }

    /** Línea de detalle bajo el nombre del archivo (periodo, cuenta, tamaño). */
    documentDetail(document: StudyDocument): string {
        const parts: string[] = [];
        if (document.periodFrom && document.periodTo) {
            parts.push(`${formatMonth(document.periodFrom, 'short')} — ${formatMonth(document.periodTo, 'short')}`);
        }
        if (document.accountLast4) {
            parts.push(`Cuenta ****${document.accountLast4}`);
        }
        parts.push(`${(document.fileSizeBytes / 1024 / 1024).toFixed(1)} MB`);
        return parts.join(' · ');
    }

    /** Validaciones fallidas del documento: lo que el analista debe mirar. */
    failedValidations(document: StudyDocument) {
        return (document.validationResults ?? []).filter(v => v.passed === false);
    }

}
