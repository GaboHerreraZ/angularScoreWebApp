import { Injectable, inject, Provider } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

export type ConfirmKind = 'danger' | 'warn' | 'info';

export interface ConfirmOptions {
    title: string;
    message: string;
    kind?: ConfirmKind;
    acceptLabel?: string;
    rejectLabel?: string;
    icon?: string;
    onAccept: () => void;
    onReject?: () => void;
}

const KIND_DEFAULTS: Record<ConfirmKind, { icon: string; acceptLabel: string; severity: 'danger' | 'warn' | 'info' }> = {
    danger: { icon: 'pi pi-trash', acceptLabel: 'Eliminar', severity: 'danger' },
    warn: { icon: 'pi pi-exclamation-triangle', acceptLabel: 'Continuar', severity: 'warn' },
    info: { icon: 'pi pi-info-circle', acceptLabel: 'Aceptar', severity: 'info' }
};

export const provideConfirm = (): Provider[] => [ConfirmationService, ConfirmService];

@Injectable()
export class ConfirmService {
    private confirmation = inject(ConfirmationService);

    confirm(options: ConfirmOptions): void {
        const kind = options.kind ?? 'danger';
        const defaults = KIND_DEFAULTS[kind];

        this.confirmation.confirm({
            header: options.title,
            message: options.message,
            icon: options.icon ?? defaults.icon,
            acceptLabel: options.acceptLabel ?? defaults.acceptLabel,
            rejectLabel: options.rejectLabel ?? 'Cancelar',
            acceptButtonStyleClass: `p-button-${defaults.severity}`,
            rejectButtonStyleClass: 'p-button-text p-button-secondary',
            accept: () => options.onAccept(),
            reject: () => options.onReject?.()
        });
    }

    delete(itemName: string, onAccept: () => void, customMessage?: string): void {
        this.confirm({
            title: 'Eliminar',
            message: customMessage ?? `¿Estás seguro de que deseas eliminar ${itemName}? Esta acción no se puede deshacer.`,
            kind: 'danger',
            onAccept
        });
    }
}
