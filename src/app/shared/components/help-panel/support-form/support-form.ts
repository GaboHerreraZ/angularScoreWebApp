import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '@/app/core/services/auth.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { SupportTicketService } from './support-ticket.service';
import {
    CreateSupportTicketRequest,
    RelatedEntityOption,
    SupportTicketArea,
    SupportTicketRelatedEntityType
} from '@/app/types/support-ticket';

/** Áreas que permiten vincular un registro concreto. */
const AREA_ENTITY_MAP: Partial<Record<SupportTicketArea, SupportTicketRelatedEntityType>> = {
    credit_study: 'credit_study',
    customer: 'customer',
    payment: 'payment'
};

@Component({
    selector: 'app-help-support-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, TextareaModule, SelectModule, ButtonModule, MessageModule, SkeletonModule],
    templateUrl: './support-form.html'
})
export class HelpSupportForm {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private parameterService = inject(ParameterService);
    private notification = inject(NotificationService);
    private supportService = inject(SupportTicketService);
    private router = inject(Router);

    formSubmitted = output<void>();

    submitting = signal(false);

    profile = this.authService.currentProfile();

    // Catálogos por parámetro; se envía el `code`.
    areaOptions = toSignal(this.parameterService.getByType('support_area'), { initialValue: [] });
    typeOptions = toSignal(this.parameterService.getByType('support_type'), { initialValue: [] });
    priorityOptions = toSignal(this.parameterService.getByType('support_priority'), { initialValue: [] });

    relatedOptions = signal<RelatedEntityOption[]>([]);
    loadingRelated = signal(false);

    form = this.fb.group({
        area: [null as SupportTicketArea | null, Validators.required],
        type: ['bug' as string, Validators.required],
        priority: ['medium' as string, Validators.required],
        relatedEntityId: [null as string | null],
        subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(120)]],
        description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]]
    });

    selectedArea = signal<SupportTicketArea | null>(null);

    relatedEntityType = computed<SupportTicketRelatedEntityType | null>(() => {
        const area = this.selectedArea();
        return area ? AREA_ENTITY_MAP[area] ?? null : null;
    });

    relatedLabel = computed(() => {
        switch (this.relatedEntityType()) {
            case 'credit_study':
                return '¿Sobre qué estudio de crédito? (opcional)';
            case 'customer':
                return '¿Sobre qué cliente? (opcional)';
            case 'payment':
                return '¿Sobre qué pago o paquete? (opcional)';
            default:
                return '';
        }
    });

    showRelatedSelect = computed(() => {
        const t = this.relatedEntityType();
        return t === 'credit_study' || t === 'customer';
    });

    get descriptionLength(): number {
        return this.form.get('description')?.value?.length ?? 0;
    }

    onAreaChange(area: SupportTicketArea | null): void {
        this.selectedArea.set(area);
        this.form.get('relatedEntityId')?.setValue(null);
        this.relatedOptions.set([]);

        const entityType = area ? AREA_ENTITY_MAP[area] : null;
        if (entityType === 'credit_study' || entityType === 'customer') {
            this.loadRelatedOptions(entityType);
        }
    }

    private async loadRelatedOptions(entityType: SupportTicketRelatedEntityType): Promise<void> {
        this.loadingRelated.set(true);
        try {
            const options = await this.supportService.getRelatedEntityOptions(entityType);
            this.relatedOptions.set(options);
        } finally {
            this.loadingRelated.set(false);
        }
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);

        const value = this.form.getRawValue();
        const relatedEntityId = value.relatedEntityId || null;

        const payload: CreateSupportTicketRequest = {
            area: value.area as SupportTicketArea,
            type: value.type as CreateSupportTicketRequest['type'],
            priority: value.priority as CreateSupportTicketRequest['priority'],
            subject: value.subject!.trim(),
            description: value.description!.trim(),
            relatedEntityType: relatedEntityId ? this.relatedEntityType() : null,
            relatedEntityId,
            context: this.captureContext()
        };

        this.supportService.createTicket(payload).subscribe({
            next: (res) => {
                this.submitting.set(false);
                this.form.reset({ type: 'bug', priority: 'medium' });
                this.selectedArea.set(null);
                this.relatedOptions.set([]);
                this.notification.success(
                    `Tu solicitud fue registrada (${res.reference}). Te responderemos pronto.`,
                    'Soporte enviado'
                );
                this.formSubmitted.emit();
            },
            error: () => {
                this.submitting.set(false);
                this.notification.error('No pudimos enviar tu solicitud. Inténtalo de nuevo.', 'Error');
            }
        });
    }

    private captureContext(): CreateSupportTicketRequest['context'] {
        return {
            appRoute: this.router.url,
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        };
    }

    isInvalid(field: string): boolean {
        const control = this.form.get(field);
        return !!(control?.invalid && control?.touched);
    }
}
