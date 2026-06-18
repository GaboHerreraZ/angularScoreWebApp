import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { AuthService } from '@/app/core/services/auth.service';
import { CompanyService } from '@/app/features/administration/components/company/company.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-callback',
    standalone: true,
    templateUrl: './callback.html'
})
export class Callback implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private supabaseService = inject(SupabaseService);
    private authService = inject(AuthService);
    private companyService = inject(CompanyService);

    async ngOnInit(): Promise<void> {
        // invitation/token viajan por sessionStorage (el redirectTo de OAuth debe ir sin query params),
        // con fallback a los query params por compatibilidad.
        const pending = this.readPendingInvitation();
        const invitationId = pending?.invitationId ?? this.route.snapshot.queryParamMap.get('invitation');
        const token = pending?.token ?? this.route.snapshot.queryParamMap.get('token');

        // Esperamos a que la sesión se establezca
        const maxAttempts = 20;
        for (let i = 0; i < maxAttempts; i++) {
            if (this.supabaseService.isAuthenticated()) {
                const user = this.supabaseService.currentUser();

                // Si viene de una invitación, asociar al usuario con la empresa
                if (invitationId && token && user?.id) {
                    try {
                        await firstValueFrom(
                            this.companyService.acceptInvitationRegister(invitationId, user.id as string, token)
                        );
                    } catch {
                        await this.supabaseService.signOut();
                        this.router.navigate(['/auth/iniciar-sesion'], {
                            queryParams: { error: 'No se pudo asociar tu cuenta a la empresa. Contacta al administrador que te invitó.' }
                        });
                        return;
                    }
                }

                if (user?.id) {
                    await this.authService.loadProfile(user.id);
                }

                // Si el usuario venía del registro de onboarding, lo llevamos al asistente.
                if (this.consumePendingOnboarding()) {
                    this.router.navigate(['/onboarding/registrar-empresa']);
                    return;
                }

                this.router.navigate(['/app']);
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 250));
        }

        this.router.navigate(['/auth/iniciar-sesion']);
    }

    /** Lee (y consume) la bandera que marca que el usuario venía del registro de onboarding. */
    private consumePendingOnboarding(): boolean {
        const pending = sessionStorage.getItem('pending_onboarding') === 'true';
        if (pending) sessionStorage.removeItem('pending_onboarding');
        return pending;
    }

    /** Lee (y consume) la invitación pendiente guardada antes del redirect de OAuth. */
    private readPendingInvitation(): { invitationId: string; token: string } | null {
        const raw = sessionStorage.getItem('pending_invitation');
        if (!raw) return null;
        sessionStorage.removeItem('pending_invitation');
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
}
