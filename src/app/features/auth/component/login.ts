import { Component, inject, signal /*, OnDestroy, viewChild */ } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { Configurator } from '@/app/layout/components/configurator/configurator';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { AuthService } from '@/app/core/services/auth.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { Notification } from '@/app/shared/components/notification/notification';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
// SMS OTP imports (comentados para uso futuro)
// import { OtpInput } from './otp-input';
// import { InputGroupModule } from 'primeng/inputgroup';
// import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
// import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        MessageModule,
        CardModule,
        Configurator,
        FloatLabelModule,
        PasswordModule,
        Notification
    ],
    templateUrl: './login.html'
})
export class Login {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private supabaseService = inject(SupabaseService);
    private authService = inject(AuthService);
    private notificationService = inject(NotificationService);

    loading = signal(false);
    googleLoading = signal(false);
    errorMessage = signal<string | null>(null);

    constructor() {
        const error = this.route.snapshot.queryParamMap.get('error');
        if (error) {
            setTimeout(() => this.notificationService.error(error));
        }
    }

    loginForm = new FormGroup({
        email: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.email]
        }),
        password: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(6)]
        })
    });

    async signIn(): Promise<void> {
        if (this.loginForm.invalid) return;

        this.loading.set(true);
        this.errorMessage.set(null);

        const { email, password } = this.loginForm.getRawValue();
        const { error } = await this.supabaseService.signInWithPassword(email, password);

        if (error) {
            this.loading.set(false);
            this.errorMessage.set('Correo o contraseña incorrectos.');
            return;
        }

        const user = this.supabaseService.currentUser();
        if (user?.id) {
            await this.authService.loadProfile(user.id);
        }

        this.loading.set(false);
        this.router.navigate(['/app']);
    }

    async signInWithGoogle(): Promise<void> {
        this.googleLoading.set(true);
        this.errorMessage.set(null);

        const { error } = await this.supabaseService.signInWithGoogle();

        if (error) {
            this.googleLoading.set(false);
            this.errorMessage.set('Error al iniciar sesión con Google. Intenta de nuevo.');
        }
    }

    // =========================================================================
    // SMS OTP (comentado para uso futuro)
    // =========================================================================
    /*
    otpInputRef = viewChild(OtpInput);
    step = signal<'phone' | 'otp'>('phone');
    sending = signal(false);
    verifying = signal(false);
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

        const user = this.supabaseService.currentUser();
        if (user?.id) {
            await this.authService.loadProfile(user.id);
        }

        this.verifying.set(false);
        this.router.navigate(['/app']);
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
    */
}
