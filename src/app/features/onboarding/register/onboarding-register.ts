import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AuthLayout } from '@/app/shared/components/auth-layout/auth-layout';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { Notification } from '@/app/shared/components/notification/notification';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { AuthService } from '@/app/core/services/auth.service';

/** Ruta a la que continúa el usuario una vez autenticado. */
const ONBOARDING_NEXT = '/onboarding/registrar-empresa';

/**
 * Registro de onboarding: el usuario crea su cuenta (Google o
 * correo/contraseña) y continúa al asistente para registrar su empresa
 * y comprar un pack. Es distinto del registro por invitación.
 */
@Component({
    selector: 'app-onboarding-register',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        AuthLayout,
        InputTextModule,
        PasswordModule,
        FloatLabelModule,
        MessageModule,
        Notification
    ],
    templateUrl: './onboarding-register.html'
})
export class OnboardingRegister {
    private router = inject(Router);
    private supabaseService = inject(SupabaseService);
    private authService = inject(AuthService);

    /** Beneficios clave que se muestran en el panel de marca (sin cifras, para no afirmar datos falsos). */
    readonly trustPoints = [
        { icon: 'pi-bolt', text: 'Reportes de Datacrédito en tiempo real' },
        { icon: 'pi-clock', text: 'Estudios de crédito en minutos' },
        { icon: 'pi-desktop', text: '100% en línea, sin instalar nada' }
    ];

    loading = signal(false);
    googleLoading = signal(false);
    errorMessage = signal<string | null>(null);
    infoMessage = signal<string | null>(null);

    form = new FormGroup({
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
        confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    }, { validators: this.passwordMatchValidator });

    private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    async registerWithEmail(): Promise<void> {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);
        this.infoMessage.set(null);

        const { email, password } = this.form.getRawValue();
        this.form.disable();

        const { data, error } = await this.supabaseService.signUp(email, password);

        if (error) {
            this.loading.set(false);
            this.form.enable();
            this.errorMessage.set(this.mapError(error));
            return;
        }

        // Si el proyecto exige confirmar el correo, no hay sesión todavía.
        if (!data?.hasSession) {
            this.loading.set(false);
            this.form.reset();
            this.form.enable();
            this.infoMessage.set(
                'Te enviamos un correo para confirmar tu cuenta. Confírmalo e inicia sesión para continuar con el registro de tu empresa.'
            );
            return;
        }

        if (data.id) {
            await this.authService.loadProfile(data.id);
        }
        this.loading.set(false);
        this.router.navigateByUrl(ONBOARDING_NEXT);
    }

    async registerWithGoogle(): Promise<void> {
        this.googleLoading.set(true);
        this.errorMessage.set(null);
        // El callback de OAuth lee esta bandera para redirigir al onboarding.
        sessionStorage.setItem('pending_onboarding', 'true');
        const { error } = await this.supabaseService.signInWithGoogle();
        if (error) {
            sessionStorage.removeItem('pending_onboarding');
            this.googleLoading.set(false);
            this.errorMessage.set('No se pudo iniciar el registro con Google. Intenta de nuevo.');
        }
        // En éxito, el navegador se redirige a Google; no hace falta hacer nada más.
    }

    private mapError(error: Error): string {
        const msg = error.message?.toLowerCase() ?? '';
        if (msg.includes('already registered')) return 'Este correo electrónico ya está registrado.';
        if (msg.includes('password')) return 'La contraseña no cumple con los requisitos mínimos.';
        return 'No se pudo crear la cuenta. Intenta de nuevo.';
    }
}
