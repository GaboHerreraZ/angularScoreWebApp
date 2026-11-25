import { Component, DestroyRef, effect, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CustomerAuthorizationsService } from '@/app/shared/services/customer-authorizations.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { CustomerAuthorization } from '@/app/types/customer-authorization';

/** Tamaño máximo del PDF, alineado con el límite del backend. */
const MAX_PDF_SIZE_MB = 10;

/** Paso visible del modal. `finalizing` lo manda el host y gana sobre todos. */
type AuthorizationMode = 'choose' | 'wait' | 'upload';

/**
 * Modal del gate de habeas data, compartido por los TRES productos (estudio con
 * EEFF, estudio de capacidad de pago y consulta de riesgo): se abre cuando la
 * creación responde `authorization_pending` porque el titular no ha firmado.
 *
 * Ofrece los dos caminos para desbloquear la creación:
 *  1. Esperar la firma en línea del titular (el correo ya salió al intentar crear)
 *     y verificarla.
 *  2. Adjuntar la autorización que la empresa ya tenía firmada, en PDF.
 *
 * En ambos casos emite `authorized` y el host relanza su propia creación. El host
 * conserva su loader (mensajes rotativos), su toast de éxito y su navegación;
 * aquí solo se resuelve la autorización.
 */
@Component({
    selector: 'app-authorization-dialog',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule],
    templateUrl: './authorization-dialog.html'
})
export class AuthorizationDialog {
    private destroyRef = inject(DestroyRef);
    private authorizationsService = inject(CustomerAuthorizationsService);
    private notificationService = inject(NotificationService);

    visible = model(false);
    /** Se refresca al verificar la firma o al cargar el documento. */
    authInfo = model<CustomerAuthorization | null>(null);
    /** Correo al que se envió el documento a firmar. */
    titularEmail = input<string>('');
    /** Identificación del titular: con ella se consulta y se carga la autorización. */
    identificationNumber = input<string>('');

    /** El host sigue dueño del loader de creación (ya tiene sus mensajes rotativos). */
    finalizing = input(false);
    loaderMessage = input('');
    /** Título del loader: cambia por producto. */
    finalizingTitle = input('Creando el estudio de crédito...');
    /**
     * Sujeto del aviso de firma pendiente: 'El estudio' en los dos estudios y
     * 'La consulta' en la consulta de riesgo, para que la frase concuerde.
     */
    subjectLabel = input('El estudio');

    /** La autorización quedó firmada (verificada o cargada): el host ya puede crear. */
    authorized = output<void>();

    mode = signal<AuthorizationMode>('choose');
    checking = signal(false);
    uploading = signal(false);
    selectedFile = signal<File | null>(null);

    readonly maxPdfSizeMb = MAX_PDF_SIZE_MB;

    constructor() {
        // Cada apertura arranca limpia: el modal se reusa entre intentos.
        effect(() => {
            if (this.visible()) {
                this.mode.set('choose');
                this.selectedFile.set(null);
            }
        });
    }

    /** Mientras haya algo en vuelo no se puede cerrar ni volver atrás. */
    busy(): boolean {
        return this.checking() || this.uploading() || this.finalizing();
    }

    onClose(): void {
        if (this.busy()) return;
        this.visible.set(false);
    }

    back(): void {
        if (this.busy()) return;
        this.mode.set('choose');
        this.selectedFile.set(null);
    }

    // ─── Opción 1: esperar la firma en línea ─────────────────────────────────

    onCheckAuthorization(): void {
        const identificationNumber = this.identificationNumber();
        if (!identificationNumber) return;

        this.checking.set(true);
        this.authorizationsService.getStatus(identificationNumber).pipe(
            finalize(() => this.checking.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (auth) => {
                this.authInfo.set(auth);
                if (auth.isSigned) {
                    this.authorized.emit();
                } else {
                    this.notificationService.info(
                        'El titular aún no ha firmado la autorización. Inténtelo de nuevo en unos minutos.',
                        'Firma pendiente'
                    );
                }
            },
            // El interceptor ya muestra el error del backend.
            error: () => {}
        });
    }

    // ─── Opción 2: adjuntar la autorización ya firmada ───────────────────────

    openFileSelector(): void {
        if (this.busy()) return;

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
            this.selectedFile.set(file);
        };
        input.click();
    }

    clearFile(): void {
        if (this.busy()) return;
        this.selectedFile.set(null);
    }

    /** Tamaño del archivo elegido, para la fila de confirmación. */
    fileSizeMb(file: File): string {
        return `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    }

    onUploadSignedDocument(): void {
        const file = this.selectedFile();
        const identificationNumber = this.identificationNumber();
        if (!file || !identificationNumber || this.uploading()) return;

        this.uploading.set(true);
        this.authorizationsService.uploadSignedDocument(identificationNumber, file).pipe(
            finalize(() => this.uploading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (auth) => {
                this.authInfo.set(auth);
                this.notificationService.success('Autorización cargada correctamente');
                this.authorized.emit();
            },
            // El interceptor ya muestra el error del backend; el archivo se deja
            // elegido para que el usuario pueda reintentar sin volver a buscarlo.
            error: () => {}
        });
    }
}
