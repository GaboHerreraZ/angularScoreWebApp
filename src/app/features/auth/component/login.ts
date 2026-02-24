import { Component, inject, signal, OnDestroy, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { CardModule } from 'primeng/card';
import { Configurator } from '@/app/layout/components/configurator/configurator';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { AuthService } from '@/app/core/services/auth.service';
import { OtpInput } from './otp-input';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        MessageModule,
        InputGroupModule,
        InputGroupAddonModule,
        CardModule,
        Configurator,
        OtpInput,
        FloatLabelModule,
        PhoneInput
    ],
    templateUrl: './login.html'
})
export class Login implements OnDestroy {
    private router = inject(Router);
    private supabaseService = inject(SupabaseService);
    private authService = inject(AuthService);

    otpInputRef = viewChild(OtpInput);

    step = signal<'phone' | 'otp'>('phone');
    sending = signal(false);
    verifying = signal(false);
    errorMessage = signal<string | null>(null);
    resendTimer = signal(0);
    otpCode = signal('');
    private timerInterval: ReturnType<typeof setInterval> | null = null;

    phoneForm = new FormGroup({
        phone: new FormControl('', {
            nonNullable: true,
            validators: [
                Validators.required,
                Validators.pattern(/^\d{7,15}$/)
            ]
        })
    });

    get fullPhoneNumber(): string {
        return `+57${this.phoneForm.controls.phone.value}`;
    }

    async sendOtp(): Promise<void> {
        if (this.phoneForm.invalid) return;

        this.sending.set(true);
        this.errorMessage.set(null);

        const { error } = await this.supabaseService.signInWithOtp(this.fullPhoneNumber);

        this.sending.set(false);

        if (error) {
            this.errorMessage.set('Error al enviar el codigo. Intenta de nuevo.');
            return;
        }

        this.step.set('otp');
        this.startResendTimer();
    }

    onOtpComplete(code: string): void {
        this.otpCode.set(code);
        this.submitOtp();
    }

    async submitOtp(): Promise<void> {
        const code = this.otpCode();
        if (code.length !== 6) return;

        this.verifying.set(true);
        this.errorMessage.set(null);

        const { error } = await this.supabaseService.verifyOtp(this.fullPhoneNumber, code);

        if (error) {
            this.verifying.set(false);
            this.errorMessage.set('Codigo incorrecto o expirado. Intenta de nuevo.');
            this.otpCode.set('');
            this.otpInputRef()?.reset();
            return;
        }

        // Cargar el perfil del usuario después de verificar el OTP
        const user = this.supabaseService.currentUser();
        if (user?.id) {
            await this.authService.loadProfile(user.id);
        }

        this.verifying.set(false);
        this.router.navigate(['/']);
    }

    async resendOtp(): Promise<void> {
        this.sending.set(true);
        this.errorMessage.set(null);

        const { error } = await this.supabaseService.signInWithOtp(this.fullPhoneNumber);

        this.sending.set(false);

        if (error) {
            this.errorMessage.set('Error al reenviar el codigo.');
            return;
        }

        this.otpCode.set('');
        this.otpInputRef()?.reset();
        this.startResendTimer();
    }

    goBackToPhone(): void {
        this.step.set('phone');
        this.errorMessage.set(null);
        this.otpCode.set('');
        this.stopResendTimer();
    }

    private startResendTimer(): void {
        this.stopResendTimer();
        this.resendTimer.set(60);
        this.timerInterval = setInterval(() => {
            const current = this.resendTimer();
            if (current <= 1) {
                this.resendTimer.set(0);
                this.stopResendTimer();
            } else {
                this.resendTimer.set(current - 1);
            }
        }, 1000);
    }

    private stopResendTimer(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    ngOnDestroy(): void {
        this.stopResendTimer();
    }
}
