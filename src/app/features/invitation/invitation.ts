import { Component, computed, DestroyRef, inject, resource, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { Configurator } from '@/app/layout/components/configurator/configurator';
import { CompanyService } from '@/app/features/administration/components/company/company.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { Notification } from '@/app/shared/components/notification/notification';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { Invitation } from '@/app/types/invitation';

@Component({
    selector: 'app-invitation',
    standalone: true,
    imports: [
        ButtonModule,
        CardModule,
        MessageModule,
        SkeletonModule,
        Configurator,
        Notification
    ],
    templateUrl: './invitation.html'
})
export class InvitationComponent {
    private route = inject(ActivatedRoute);
    router = inject(Router);
    private destroyRef = inject(DestroyRef);
    private companyService = inject(CompanyService);
    private notificationService = inject(NotificationService);
    private supabaseService = inject(SupabaseService);

    invitationId = this.route.snapshot.queryParamMap.get('invitationId');
    email = this.route.snapshot.queryParamMap.get('email');
    token = this.route.snapshot.queryParamMap.get('token');

    rejecting = signal(false);
    rejected = signal(false);
    googleLoading = signal(false);
    errorMessage = signal<string | null>(null);
    actionsDisabled = computed(() => this.rejecting() || this.googleLoading() || this.rejected());

    invitationResource = resource<Invitation, string>({
        params: () => this.invitationId as string,
        loader: ({ params: id }) => firstValueFrom(this.companyService.getInvitationById(id))
    });

    registerWithEmail(): void {
        this.router.navigate(['/auth/registro'], {
            queryParams: { invitation: this.invitationId, email: this.email, token: this.token }
        });
    }

    async joinWithGoogle(): Promise<void> {
        this.googleLoading.set(true);
        this.errorMessage.set(null);

        const { error } = await this.supabaseService.signInWithGoogle(this.invitationId!, this.token!);

        if (error) {
            this.googleLoading.set(false);
            this.errorMessage.set('Error al iniciar sesión con Google. Intenta de nuevo.');
        }
    }

    rejectInvitation(): void {
        if (!this.invitationId || !this.token) return;

        this.rejecting.set(true);
        this.companyService.rejectInvitation(this.invitationId, this.token).pipe(
            finalize(() => this.rejecting.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.notificationService.info('Invitación rechazada. Se notificará al administrador de la empresa.');
                setTimeout(() => this.router.navigate(['/']), 2000);
            },
            error: () => {
                this.errorMessage.set('Error al rechazar la invitación. Intenta de nuevo.');
            }
        });
    }
}
