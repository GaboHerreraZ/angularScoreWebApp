import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { Configurator } from '@/app/layout/components/configurator/configurator';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { CompanyService } from '@/app/features/administration/components/company/company.service';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';

@Component({
    selector: 'app-register',
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
        PasswordModule
    ],
    templateUrl: './register.html'
})
export class Register {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private supabaseService = inject(SupabaseService);
    private companyService = inject(CompanyService);

    invitationId = this.route.snapshot.queryParamMap.get('invitation');
    invitationEmail = this.route.snapshot.queryParamMap.get('email');
    invitationToken = this.route.snapshot.queryParamMap.get('token');

    loading = signal(false);
    errorMessage = signal<string | null>(null);
    successMessage = signal<string | null>(null);

    registerForm = new FormGroup({
        email: new FormControl(
            { value: this.invitationEmail ?? '', disabled: !!this.invitationEmail },
            { nonNullable: true, validators: [Validators.required, Validators.email] }
        ),
        password: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(6)]
        }),
        confirmPassword: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required]
        })
    }, { validators: this.passwordMatchValidator });

    private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    async register(): Promise<void> {
        if (this.registerForm.invalid) return;

        this.loading.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        const { email, password } = this.registerForm.getRawValue();
        const { data, error } = await this.supabaseService.signUp(email, password);

        if (error) {
            this.loading.set(false);
            this.errorMessage.set(this.getErrorMessage(error));
            return;
        }

        if (this.invitationId && this.invitationToken && data?.id) {
            try {
                await firstValueFrom(
                    this.companyService.acceptInvitationRegister(this.invitationId, data.id, this.invitationToken)
                );
            } catch {
                this.loading.set(false);
                this.errorMessage.set('Tu cuenta fue creada, pero no se pudo asociar a la empresa. Contacta al administrador que te invitó.');
                this.router.navigate(['/auth/iniciar-sesion'], {
                    queryParams: { error: 'Tu cuenta fue creada, pero no se pudo asociar a la empresa. Contacta al administrador que te invitó.' }
                });
                return;
            }
        }

        this.loading.set(false);
        this.successMessage.set('Cuenta creada exitosamente. Debes confirmar tu correo electrónico antes de iniciar sesión.');

        setTimeout(() => {
            this.router.navigate(['/auth/iniciar-sesion']);
        }, 4000);
    }

    private getErrorMessage(error: Error): string {
        const msg = error.message?.toLowerCase() ?? '';
        if (msg.includes('already registered')) {
            return 'Este correo electrónico ya está registrado.';
        }
        if (msg.includes('password')) {
            return 'La contraseña no cumple con los requisitos mínimos.';
        }
        return 'Error al crear la cuenta. Intenta de nuevo.';
    }
}
