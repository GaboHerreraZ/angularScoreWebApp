import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { AuthService } from '@/app/core/services/auth.service';
import { CompanyService } from '@/app/features/administration/components/company/company.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-callback',
    standalone: true,
    template: `
        <div class="h-screen w-screen flex items-center justify-center bg-surface-100 dark:bg-surface-950">
            <div class="text-center">
                <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4"></i>
                <p class="text-muted-color">Verificando autenticación...</p>
            </div>
        </div>
    `
})
export class Callback implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private supabaseService = inject(SupabaseService);
    private authService = inject(AuthService);
    private companyService = inject(CompanyService);

    async ngOnInit(): Promise<void> {
        const invitationId = this.route.snapshot.queryParamMap.get('invitation');
        const token = this.route.snapshot.queryParamMap.get('token');

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

                this.router.navigate(['/app']);
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 250));
        }

        this.router.navigate(['/auth/iniciar-sesion']);
    }
}
