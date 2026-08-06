import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Password } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthLayout } from '@/app/shared/components/auth-layout/auth-layout';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { Notification } from '@/app/shared/components/notification/notification';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    return password === confirm ? null : { mismatch: true };
}

@Component({
    selector: 'app-new-password',
    standalone: true,
    imports: [ReactiveFormsModule, Password, ButtonModule, AuthLayout, FloatLabelModule, RouterModule, Notification],
    templateUrl: './newpassword.html'
})
export class NewPassword {
    private supabaseService = inject(SupabaseService);
    private notificationService = inject(NotificationService);
    private router = inject(Router);

    loading = signal(false);

    form = new FormGroup({
        password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
        confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    }, { validators: passwordsMatch });

    async submit(): Promise<void> {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const { error } = await this.supabaseService.updatePassword(this.form.controls.password.value);
        this.loading.set(false);

        if (error) {
            this.notificationService.error('No se pudo actualizar la contraseña. El enlace puede haber expirado, solicita uno nuevo.');
            return;
        }

        this.notificationService.success('Contraseña actualizada correctamente.');
        this.router.navigate(['/auth/iniciar-sesion']);
    }
}
