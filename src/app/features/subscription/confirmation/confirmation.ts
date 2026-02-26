import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Configurator } from '@/app/layout/components/configurator/configurator';
import { SubscriptionService } from '../subscription.service';
import { AuthService } from '@/app/core/services/auth.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { CompanySubscription } from '@/app/types/subscription';

type ConfirmationState = 'loading' | 'approved' | 'declined' | 'pending' | 'error';

@Component({
    selector: 'app-confirmation',
    standalone: true,
    imports: [CardModule, ButtonModule, ProgressSpinnerModule, Configurator],
    templateUrl: './confirmation.html'
})
export class Confirmation implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private subscriptionService = inject(SubscriptionService);
    private authService = inject(AuthService);
    private supabaseService = inject(SupabaseService);

    state = signal<ConfirmationState>('loading');
    transaction = signal<CompanySubscription | null>(null);

    private pollInterval: ReturnType<typeof setInterval> | null = null;
    private pollCount = 0;
    private readonly MAX_POLLS = 20;
    private readonly POLL_DELAY_MS = 3000;

    ngOnInit(): void {
        const ref = this.route.snapshot.queryParamMap.get('ref')
            ?? this.route.snapshot.queryParamMap.get('id');

        if (!ref) {
            this.state.set('error');
            return;
        }

        this.checkTransactionStatus(ref);
    }

    private getCompanyId(): string | null {
        return this.authService.currentProfile()?.userCompanies?.[0]?.companyId ?? null;
    }

    private mapStatusCode(code: string): ConfirmationState {
        switch (code) {
            case 'activa':
                return 'approved';
            case 'pendiente':
                return 'pending';
            case 'rechazada':
                return 'declined';
            default:
                return 'declined';
        }
    }

    private async checkTransactionStatus(paymentId: string): Promise<void> {
        try {
            const companyId = this.getCompanyId();
            if (!companyId) {
                this.state.set('error');
                return;
            }

            const result = await firstValueFrom(
                this.subscriptionService.checkTransaction(companyId, paymentId)
            );
            this.transaction.set(result);

            const mapped = this.mapStatusCode(result.status.code);
            this.state.set(mapped);

            if (mapped === 'approved') {
                await this.reloadProfile();
            } else if (mapped === 'pending') {
                this.startPolling(companyId, paymentId);
            }
        } catch {
            this.state.set('error');
        }
    }

    private startPolling(companyId: string, paymentId: string): void {
        this.pollInterval = setInterval(async () => {
            this.pollCount++;
            if (this.pollCount >= this.MAX_POLLS) {
                this.stopPolling();
                return;
            }

            try {
                const result = await firstValueFrom(
                    this.subscriptionService.checkTransaction(companyId, paymentId)
                );
                this.transaction.set(result);

                const mapped = this.mapStatusCode(result.status.code);
                if (mapped !== 'pending') {
                    this.stopPolling();
                    this.state.set(mapped);
                    if (mapped === 'approved') {
                        await this.reloadProfile();
                    }
                }
            } catch {
                // Continuar polling en caso de error de red
            }
        }, this.POLL_DELAY_MS);
    }

    private stopPolling(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    private async reloadProfile(): Promise<void> {
        const user = this.supabaseService.currentUser();
        if (user?.id) {
            await this.authService.loadProfile(user.id);
        }
    }

    goToDashboard(): void {
        this.router.navigate(['/app']);
    }

    retryPayment(): void {
        this.router.navigate(['/suscripcion/elegir-plan']);
    }

    ngOnDestroy(): void {
        this.stopPolling();
    }
}
