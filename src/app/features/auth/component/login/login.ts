import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthLayout } from '@/app/shared/components/auth-layout/auth-layout';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { AuthService } from '@/app/core/services/auth.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { Notification } from '@/app/shared/components/notification/notification';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        MessageModule,
        AuthLayout,
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
            const code = (error as any)?.code ?? '';
            this.errorMessage.set(
                code === 'email_not_confirmed'
                    ? 'Tu correo electrónico aún no ha sido confirmado. Revisa tu bandeja de entrada.'
                    : 'Correo o contraseña incorrectos.'
            );
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
}
