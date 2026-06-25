import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SkeletonModule } from 'primeng/skeleton';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';
import { Notification } from '@/app/shared/components/notification/notification';
import { ContactSalesService } from '@/app/shared/services/contact-sales.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { ContactSalesRequest, ContactSalesSubject } from '@/app/types/contact-sales';

@Component({
    standalone: true,
    selector: 'contact-sales-widget',
    imports: [
        NgClass,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        FloatLabelModule,
        SkeletonModule,
        ScrollAnimateDirective,
        PhoneInput,
        Notification
    ],
    templateUrl: './contact-sales-widget.html'
})
export class ContactSalesWidget {
    private destroyRef = inject(DestroyRef);
    private contactSalesService = inject(ContactSalesService);
    private notification = inject(NotificationService);

    /** Correo del área comercial, también visible como alternativa al form. */
    readonly salesEmail = 'ventas@creditia.co';

    sending = signal(false);
    sent = signal(false);

    /** Opciones de asunto del formulario de contacto. */
    readonly subjectOptions: { label: string; value: ContactSalesSubject }[] = [
        { label: 'Quiero ver una demostración', value: 'demo' },
        { label: 'Consultar precios y paquetes', value: 'pricing' },
        { label: 'Alto consumo de análisis crediticios', value: 'volume' },
        { label: 'Soporte o ayuda con mi cuenta', value: 'support' },
        { label: 'Otro', value: 'other' }
    ];

    // Límites alineados con la validación del backend (POST /api/contact-sales).
    form = new FormGroup({
        subject: new FormControl<ContactSalesSubject | null>(null, { validators: [Validators.required] }),
        companyName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
        fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(255)] }),
        phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5), Validators.maxLength(50)] }),
        message: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(1000)] })
    });

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.getRawValue();
        const payload: ContactSalesRequest = {
            subject: value.subject!,
            companyName: value.companyName.trim(),
            fullName: value.fullName.trim(),
            email: value.email.trim(),
            phone: value.phone,
            message: value.message.trim()
        };

        this.sending.set(true);
        this.contactSalesService.sendContact(payload).pipe(
            finalize(() => this.sending.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.sent.set(true);
                this.form.reset();
                this.notification.success('Tu mensaje fue enviado. El área comercial te contactará pronto.');
            },
            error: (error: HttpErrorResponse) => {
                if (error.status === 429) {
                    this.notification.error('Has enviado demasiados mensajes. Espera unos minutos antes de volver a intentarlo.');
                } else {
                    this.notification.error('No se pudo enviar tu mensaje. Inténtalo de nuevo o escríbenos al correo.');
                }
            }
        });
    }

    /** Permite enviar otro mensaje tras un envío exitoso. */
    resetForm(): void {
        this.sent.set(false);
    }

    isInvalid(controlName: string): boolean {
        const control = this.form.get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(controlName: string): string {
        const control = this.form.get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['email']) return 'Ingrese un correo válido';
        if (control.errors['minlength']) return 'El valor es demasiado corto';
        if (control.errors['maxlength']) return 'El valor es demasiado largo';
        return '';
    }
}
