import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '@/app/core/services/auth.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';

@Component({
    selector: 'app-help-support-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, TextareaModule, SelectModule, ButtonModule],
    templateUrl: './support-form.html'
})
export class HelpSupportForm {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private notification = inject(NotificationService);

    formSubmitted = output<void>();

    submitting = signal(false);

    profile = this.authService.currentProfile();

    categoryOptions = [
        { label: 'Problema técnico (bug)', value: 'bug' },
        { label: 'Consulta general', value: 'consulta' },
        { label: 'Facturación y planes', value: 'facturacion' },
        { label: 'Otro', value: 'otro' }
    ];

    form = this.fb.group({
        category: [null as string | null, Validators.required],
        subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
        description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]]
    });

    get descriptionLength(): number {
        return this.form.get('description')?.value?.length ?? 0;
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);

        // Simula envío — aquí se conectará la Edge Function de Resend en el futuro
        setTimeout(() => {
            this.submitting.set(false);
            this.form.reset();
            this.notification.success('Tu solicitud fue enviada. Te responderemos pronto.', 'Soporte enviado');
            this.formSubmitted.emit();
        }, 800);
    }

    isInvalid(field: string): boolean {
        const control = this.form.get(field);
        return !!(control?.invalid && control?.touched);
    }
}
