import { Component, computed, effect, inject, output, signal } from '@angular/core';
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
import { LayoutService } from '@/app/layout/service/layout.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketRequest, SupportTicketArea } from '@/app/types/support-ticket';

/**
 * Áreas que exigen el id de un registro. Solo se ofrecen cuando el panel se abre
 * desde la pantalla del cliente o del estudio, que es de donde sale ese id.
 */
const AREAS_REQUIRING_ID: SupportTicketArea[] = ['credit_study', 'customer'];

@Component({
    selector: 'app-help-support-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, TextareaModule, SelectModule, ButtonModule, MessageModule, SkeletonModule],
    templateUrl: './support-form.html'
})
export class HelpSupportForm {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private layoutService = inject(LayoutService);
    private parameterService = inject(ParameterService);
    private notification = inject(NotificationService);
    private supportService = inject(SupportTicketService);
    private router = inject(Router);

    formSubmitted = output<void>();

    submitting = signal(false);

    /** Signal, no snapshot: el drawer se construye una vez y el perfil puede llegar después. */
    profile = this.authService.currentProfile;

    /** Registro con el que se abrió el panel; null = consulta general. */
    prefill = this.layoutService.supportPrefill;

    // Catálogos por parámetro; se envía el `code`.
    private allAreaOptions = toSignal(this.parameterService.getByType('support_area'), { initialValue: [] });
    typeOptions = toSignal(this.parameterService.getByType('support_type'), { initialValue: [] });
    priorityOptions = toSignal(this.parameterService.getByType('support_priority'), { initialValue: [] });

    /**
     * Sin registro asociado solo se pueden crear tickets generales: las áreas de
     * estudio y cliente exigen un id que únicamente existe en esas pantallas.
     */
    areaOptions = computed(() => {
        const options = this.allAreaOptions();
        if (this.prefill()) return options;
        return options.filter((o: { code: string }) => !AREAS_REQUIRING_ID.includes(o.code as SupportTicketArea));
    });

    /** Etiqueta del área fijada por el contexto (cuando se abre desde un registro). */
    prefillAreaLabel = computed(() => {
        const area = this.prefill()?.area;
        if (!area) return null;
        const option = this.allAreaOptions().find((o: { code: string }) => o.code === area);
        return option?.label ?? (area === 'credit_study' ? 'Estudio de crédito' : 'Cliente');
    });

    form = this.fb.group({
        area: [null as SupportTicketArea | null, Validators.required],
        type: ['bug' as string, Validators.required],
        priority: ['medium' as string, Validators.required],
        subject: ['', [Validators.required, Validators.maxLength(255)]],
        description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(5000)]]
    });

    constructor() {
        // El drawer se construye una vez, así que el área debe seguir al contexto
        // con el que se abre el panel (o limpiarse al volver a consulta general).
        effect(() => {
            const area = this.prefill()?.area ?? null;
            this.form.get('area')?.setValue(area);
        });
    }

    get descriptionLength(): number {
        return this.form.get('description')?.value?.length ?? 0;
    }

    onSubmit(): void {
        const prefill = this.prefill();

        // Con prefill el área viene del contexto, no del select.
        if (prefill) {
            this.form.get('area')?.setValue(prefill.area);
        }

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);

        const value = this.form.getRawValue();

        const payload: CreateSupportTicketRequest = {
            area: value.area as SupportTicketArea,
            type: value.type as CreateSupportTicketRequest['type'],
            priority: value.priority as CreateSupportTicketRequest['priority'],
            subject: value.subject!.trim(),
            description: value.description!.trim(),
            context: this.captureContext()
        };

        // Los ids solo viajan cuando el ticket nace desde el registro; el backend
        // rechaza ids que no correspondan al área o a la empresa.
        if (prefill?.area === 'credit_study' && prefill.creditStudyId) {
            payload.creditStudyId = prefill.creditStudyId;
        }
        if (prefill?.area === 'customer' && prefill.customerId) {
            payload.customerId = prefill.customerId;
        }

        this.supportService.createTicket(payload).subscribe({
            next: (res) => {
                this.submitting.set(false);
                this.form.reset({ type: 'bug', priority: 'medium', area: prefill?.area ?? null });
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
