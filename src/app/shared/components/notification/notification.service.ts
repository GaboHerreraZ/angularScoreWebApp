import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {

    constructor(private messageService: MessageService) {}

    success(detail: string, summary = 'Éxito'): void {
        this.messageService.add({ severity: 'success', summary, detail });
    }

    info(detail: string, summary = 'Información'): void {
        this.messageService.add({ severity: 'info', summary, detail });
    }

    warn(detail: string, summary = 'Advertencia'): void {
        this.messageService.add({ severity: 'warn', summary, detail });
    }

    error(detail: string, summary = 'Error'): void {
        this.messageService.add({ severity: 'error', summary, detail });
    }

    clear(): void {
        this.messageService.clear();
    }
}
