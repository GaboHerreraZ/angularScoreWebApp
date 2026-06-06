import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { Notification } from '@/app/shared/components/notification/notification';

@Component({
    standalone: true,
    selector: 'app-forgot-password',
    imports: [ReactiveFormsModule, InputTextModule, ButtonModule, MessageModule, CardModule, FloatLabelModule, RouterModule, Notification],
    templateUrl: './forgotpassword.html'
})
export class ForgotPassword {
    private supabaseService = inject(SupabaseService);
    private notificationService = inject(NotificationService);

    loading = signal(false);
    sent = signal(false);

    form = new FormGroup({
        email: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.email]
        })
    });

    async sendRecovery(): Promise<void> {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const { error } = await this.supabaseService.resetPasswordForEmail(this.form.controls.email.value);
        this.loading.set(false);

        if (error) {
            this.notificationService.error('No se pudo enviar el correo. Intenta de nuevo.');
            return;
        }

        // No revelamos si el correo existe o no (buena práctica de seguridad).
        this.sent.set(true);
    }
}
