import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

const DEFAULT_LIFE = {
    success: 3500,
    info: 4000,
    warn: 5000,
    error: 6000
} as const;

@Injectable({ providedIn: 'root' })
export class NotificationService {

    constructor(private messageService: MessageService) {}

    success(detail: string, summary = 'Éxito'): void {
        this.messageService.add({ severity: 'success', summary, detail, life: DEFAULT_LIFE.success });
    }

    info(detail: string, summary = 'Información'): void {
        this.messageService.add({ severity: 'info', summary, detail, life: DEFAULT_LIFE.info });
    }

    warn(detail: string, summary = 'Atención'): void {
        this.messageService.add({ severity: 'warn', summary, detail, life: DEFAULT_LIFE.warn });
    }

    error(detail: string, summary = 'Error'): void {
        this.messageService.add({ severity: 'error', summary, detail, life: DEFAULT_LIFE.error });
    }

    clear(): void {
        this.messageService.clear();
    }
}
