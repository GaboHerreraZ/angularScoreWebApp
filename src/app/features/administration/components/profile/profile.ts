import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';
import { ParameterService } from '@/app/core/services/parameter.service';
import { ProfileService } from './profile.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { AuthService } from '@/app/core/services/auth.service';
import { Parameter } from '@/app/types/parameter';
import { NotificationService } from '@/app/shared/components/notification/notification.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        CardModule,
        InputTextModule,
        SelectModule,
        FloatLabelModule,
        FluidModule,
        AvatarModule,
        SkeletonModule,
        PhoneInput
    ],
    templateUrl: './profile.html'
})
export class Profile {
    private destroyRef = inject(DestroyRef);
    private profileService = inject(ProfileService);
    private supabaseService = inject(SupabaseService);
    private authService = inject(AuthService);
    private notificationService = inject(NotificationService);

    user = this.supabaseService.currentUser();
    profile = this.authService.currentProfile;

    saving = signal(false);
    isEditing = signal(false);

    constructor() {
        effect(() => {
            const profile = this.profile();
            if (profile) {
                this.isEditing.set(true);
                this.form.patchValue({
                    email: profile.email,
                    name: profile.name,
                    lastName: profile.lastName,
                    roleName: (profile as any).role?.label || '',
                    position: profile.position
                });
            }
        });
    }

    form = new FormGroup({
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        phone: new FormControl({ value: this.user?.phoneFormatted, disabled: true }, { nonNullable: true, validators: [Validators.required] }),
        roleName: new FormControl({ value: '', disabled: true }),
        roleId: new FormControl('', { nonNullable: true }),
        position: new FormControl<string | null>(null)
    });

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.saving.set(true);

        if (this.isEditing()) {
            this.updateProfile();
        } else {
            this.createProfile();
        }
    }

    private updateProfile(): void {
        const formData = this.form.getRawValue();
        const payload = {
            name: formData.name,
            lastName: formData.lastName,
            phone: this.user.phone,
            roleId: (formData.roleId as any as Parameter).id,
            position: formData.position
        };

        this.profileService.updateProfile(this.user!.id as string, payload as any).pipe(
            finalize(() => this.saving.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (updatedProfile) => {
                this.authService.updateCurrentProfile(updatedProfile);
                this.notificationService.success('Perfil Actualizado Correctamente', 'Ok');
            }
        });
    }

    private createProfile(): void {
        const formData = this.form.getRawValue();
        const { roleId, ...rest } = formData;
        const payload = {
            ...rest,
            id: this.user?.id,
            phone: this.user.phone,
            roleId: (roleId as any as Parameter).id
        };

        this.profileService.createProfile(payload as any).pipe(
            finalize(() => this.saving.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (createdProfile) => {
                this.authService.currentProfile.set(createdProfile);
                this.isEditing.set(true);
                this.notificationService.success('Perfil Guardado Correctamente', 'Ok');
            }
        });
    }

    isInvalid(controlName: string): boolean {
        const control = this.form.get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(controlName: string): string {
        const control = this.form.get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['email']) return 'Ingrese un email válido';
        return '';
    }
}
