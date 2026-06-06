import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Password } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SkeletonModule } from 'primeng/skeleton';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const password = group.get('newPassword')?.value;
    const confirm = group.get('confirm')?.value;
    return password === confirm ? null : { mismatch: true };
}

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [ReactiveFormsModule, ButtonModule, CardModule, Password, FloatLabelModule, SkeletonModule],
    template: `
        <p-card>
            <ng-template pTemplate="title">Cambiar contraseña</ng-template>
            <ng-template pTemplate="subtitle">Confirma tu contraseña actual antes de definir una nueva.</ng-template>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-6 mt-4 max-w-md">
                @if (saving()) {
                    <p-skeleton height="2.75rem" borderRadius="6px" />
                    <p-skeleton height="2.75rem" borderRadius="6px" />
                    <p-skeleton height="2.75rem" borderRadius="6px" />
                } @else {
                    <p-float-label variant="on">
                        <p-password inputId="current" formControlName="currentPassword" styleClass="w-full" inputStyleClass="w-full" [toggleMask]="true" [feedback]="false" />
                        <label for="current">Contraseña actual</label>
                    </p-float-label>

                    <p-float-label variant="on">
                        <p-password inputId="new" formControlName="newPassword" styleClass="w-full" inputStyleClass="w-full" [toggleMask]="true" />
                        <label for="new">Nueva contraseña</label>
                    </p-float-label>

                    <div>
                        <p-float-label variant="on">
                            <p-password inputId="confirm" formControlName="confirm" styleClass="w-full" inputStyleClass="w-full" [toggleMask]="true" [feedback]="false" />
                            <label for="confirm">Confirmar nueva contraseña</label>
                        </p-float-label>
                        @if (form.errors?.['mismatch'] && form.controls.confirm.touched) {
                            <small class="text-red-500 block mt-1">Las contraseñas no coinciden.</small>
                        }
                    </div>
                }

                <div>
                    <p-button type="submit" [loading]="saving()" label="Actualizar contraseña" />
                </div>
            </form>
        </p-card>
    `
})
export class ChangePassword {
    private supabaseService = inject(SupabaseService);
    private notificationService = inject(NotificationService);

    saving = signal(false);

    form = new FormGroup({
        currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
        confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    }, { validators: passwordsMatch });

    async onSubmit(): Promise<void> {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const email = this.supabaseService.currentUser()?.email;
        if (!email) {
            this.notificationService.error('No se pudo identificar tu sesión. Vuelve a iniciar sesión.');
            return;
        }

        this.saving.set(true);
        const { currentPassword, newPassword } = this.form.getRawValue();

        // 1. Re-verificar la contraseña actual.
        const { error: verifyError } = await this.supabaseService.signInWithPassword(email, currentPassword);
        if (verifyError) {
            this.saving.set(false);
            this.notificationService.error('La contraseña actual es incorrecta.');
            return;
        }

        // 2. Actualizar a la nueva contraseña.
        const { error } = await this.supabaseService.updatePassword(newPassword);
        this.saving.set(false);

        if (error) {
            this.notificationService.error('No se pudo actualizar la contraseña. Intenta de nuevo.');
            return;
        }

        this.form.reset();
        this.notificationService.success('Contraseña actualizada correctamente.');
    }
}
