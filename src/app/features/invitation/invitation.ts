import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { firstValueFrom, finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { AuthLayout } from '@/app/shared/components/auth-layout/auth-layout';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CompanyService } from '@/app/features/administration/components/company/company.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { Notification } from '@/app/shared/components/notification/notification';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { AuthService } from '@/app/core/services/auth.service';
import { Invitation } from '@/app/types/invitation';

type LoadState = 'loading' | 'ready' | 'accepted' | 'expired' | 'invalid';

@Component({
    selector: 'app-invitation',
    standalone: true,
    imports: [
        RouterModule,
        ReactiveFormsModule,
        ButtonModule,
        AuthLayout,
        MessageModule,
        SkeletonModule,
        InputTextModule,
        PasswordModule,
        FloatLabelModule,
        Notification
    ],
    templateUrl: './invitation.html',
    styles: [
        `
            i.pi.text-5xl {
                font-size: 3rem;
            }

            i.pi.text-4xl {
                font-size: 2.25rem;
            }

            i.pi.text-3xl {
                font-size: 1.875rem;
            }

            i.pi.text-xl {
                font-size: 1.25rem;
            }

            i.pi.text-lg {
                font-size: 1.125rem;
            }
        `
    ]
})
export class InvitationComponent {
    private route = inject(ActivatedRoute);
    router = inject(Router);
    private destroyRef = inject(DestroyRef);
    private companyService = inject(CompanyService);
    private notificationService = inject(NotificationService);
    private supabaseService = inject(SupabaseService);
    private authService = inject(AuthService);

    invitationId = this.route.snapshot.queryParamMap.get('invitationId');
    email = this.route.snapshot.queryParamMap.get('email');
    token = this.route.snapshot.queryParamMap.get('token');

    loadState = signal<LoadState>('loading');
    invitation = signal<Invitation | null>(null);

    /** account_onboarding = owner/admin de Credit-ia · collaboration = colaborador invitado a una empresa. */
    isOnboarding = computed(() => this.invitation()?.type === 'account_onboarding');

    /** true = el invitado ya tiene cuenta y prefiere iniciar sesión en vez de crear una nueva. */
    loginMode = signal(false);
    submitting = signal(false);
    rejecting = signal(false);
    rejected = signal(false);
    googleLoading = signal(false);
    errorMessage = signal<string | null>(null);

    actionsDisabled = computed(() =>
        this.submitting() || this.rejecting() || this.googleLoading() || this.rejected()
    );

    // El email viene de la invitación: precargado y bloqueado.
    form = new FormGroup({
        email: new FormControl(
            { value: this.email ?? '', disabled: true },
            { nonNullable: true, validators: [Validators.required, Validators.email] }
        ),
        password: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(6)]
        }),
        confirmPassword: new FormControl('', { nonNullable: true })
    }, { validators: (control) => this.passwordMatchValidator(control) });

    constructor() {
        this.validate();
    }

    // Paso A — Validar la invitación al cargar la ruta.
    private async validate(): Promise<void> {
        if (!this.invitationId || !this.token) {
            this.loadState.set('invalid');
            return;
        }

        try {
            const invitation = await firstValueFrom(
                this.companyService.validateInvitation(this.invitationId, this.token)
            );
            this.invitation.set(invitation);
            this.loadState.set('ready');
        } catch (error) {
            const status = (error as HttpErrorResponse)?.status;
            // 400 → expirada · 404/otro → no encontrada o token inválido.
            this.loadState.set(status === 400 ? 'expired' : 'invalid');
        }
    }

    toggleLoginMode(): void {
        this.loginMode.update((v) => !v);
        this.errorMessage.set(null);
        const confirm = this.form.controls.confirmPassword;
        if (this.loginMode()) {
            confirm.reset();
            confirm.clearValidators();
        }
        confirm.updateValueAndValidity();
    }

    private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        if (this.loginMode?.()) return null;
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    // Paso B (email+password) + Paso C (accept-register) + Paso D (redirigir).
    async submitWithEmail(): Promise<void> {
        if (this.form.invalid || !this.invitationId || !this.token) return;

        this.submitting.set(true);
        this.errorMessage.set(null);

        const { password } = this.form.getRawValue();
        const email = this.email!;

        // Paso B — autenticación en Supabase.
        if (this.loginMode()) {
            const userId = await this.signIn(email, password);
            if (userId) await this.acceptAndRedirect(userId);
            this.submitting.set(false);
            return;
        }

        // Signup: aceptamos la invitación; si el correo aún no está confirmado, no redirigimos.
        const signed = await this.signUp(email, password);
        if (!signed) {
            this.submitting.set(false);
            return;
        }

        if (signed.emailConfirmed) {
            await this.acceptAndRedirect(signed.id);
        } else {
            // Asociamos el perfil a la empresa (Paso C) pero NO entramos: falta confirmar el correo.
            await this.acceptWithoutRedirect(signed.id);
        }
        this.submitting.set(false);
    }

    private async signUp(email: string, password: string): Promise<{ id: string; emailConfirmed: boolean } | null> {
        const { data, error } = await this.supabaseService.signUp(email, password);
        if (error) {
            const msg = error.message?.toLowerCase() ?? '';
            if (msg.includes('already registered') || msg.includes('already exists')) {
                this.errorMessage.set('Este correo ya tiene una cuenta. Usa "Ya tengo cuenta" para iniciar sesión.');
            } else if (msg.includes('password')) {
                this.errorMessage.set('La contraseña no cumple con los requisitos mínimos.');
            } else {
                this.errorMessage.set('Error al crear la cuenta. Intenta de nuevo.');
            }
            return null;
        }
        return data ? { id: data.id, emailConfirmed: data.emailConfirmed } : null;
    }

    private async signIn(email: string, password: string): Promise<string | null> {
        const { error } = await this.supabaseService.signInWithPassword(email, password);
        if (error) {
            this.errorMessage.set('Correo o contraseña incorrectos.');
            return null;
        }
        return this.supabaseService.currentUser()?.id as string ?? null;
    }

    // Paso B con Google — el callback (/auth/callback) se encarga del Paso C y D.
    async joinWithGoogle(): Promise<void> {
        if (!this.invitationId || !this.token) return;

        this.googleLoading.set(true);
        this.errorMessage.set(null);

        const { error } = await this.supabaseService.signInWithGoogle(this.invitationId, this.token);
        if (error) {
            this.googleLoading.set(false);
            this.errorMessage.set('Error al iniciar sesión con Google. Intenta de nuevo.');
        }
    }

    // Paso C — aceptar y registrar; Paso D — redirigir al dashboard.
    private async acceptAndRedirect(userId: string): Promise<void> {
        try {
            await firstValueFrom(
                this.companyService.acceptInvitationRegister(this.invitationId!, userId, this.token!, true)
            );
        } catch (error) {
            const status = (error as HttpErrorResponse)?.status;
            if (status === 403) {
                this.errorMessage.set('El correo de tu cuenta no coincide con el de la invitación.');
                await this.supabaseService.signOut();
                return;
            }
            // 409 (ya existe perfil) o 400 (ya respondida): la cuenta ya está lista → entrar.
            if (status === 409 || status === 400) {
                await this.goToApp(userId);
                return;
            }
            this.errorMessage.set('No se pudo completar el registro. Intenta de nuevo.');
            return;
        }

        await this.goToApp(userId);
    }

    // Paso C sin Paso D — acepta la invitación pero no entra: el correo aún no está confirmado.
    private async acceptWithoutRedirect(userId: string): Promise<void> {
        try {
            await firstValueFrom(
                this.companyService.acceptInvitationRegister(this.invitationId!, userId, this.token!, true)
            );
        } catch (error) {
            const status = (error as HttpErrorResponse)?.status;
            // 409/400 = ya aceptada/perfil existente → igual mostramos la pantalla de confirmación.
            if (status !== 409 && status !== 400) {
                this.errorMessage.set('No se pudo completar el registro. Intenta de nuevo.');
                return;
            }
        }

        // El signup deja una sesión parcial aunque el correo no esté confirmado.
        // La cerramos para que el usuario quede deslogueado hasta confirmar (si no, el guard lo dejaría entrar).
        await this.supabaseService.signOut();
        this.loadState.set('accepted');
    }

    private async goToApp(userId: string): Promise<void> {
        try {
            await this.authService.loadProfile(userId);
        } catch {
            // Si no carga el perfil, el guard lo resolverá tras navegar.
        }
        this.router.navigate(['/app']);
    }

    rejectInvitation(): void {
        if (!this.invitationId || !this.token) return;

        this.rejecting.set(true);
        this.companyService.rejectInvitation(this.invitationId, this.token).pipe(
            finalize(() => this.rejecting.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.rejected.set(true);
                this.notificationService.info('Invitación rechazada. Se notificará al administrador de la empresa.');
                setTimeout(() => this.router.navigate(['/']), 2000);
            },
            error: () => {
                this.errorMessage.set('Error al rechazar la invitación. Intenta de nuevo.');
            }
        });
    }
}
