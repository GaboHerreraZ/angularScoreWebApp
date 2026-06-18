import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { Notification } from '@/app/shared/components/notification/notification';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { LayoutService } from '@/app/layout/service/layout.service';
import { CardForm } from '@/app/shared/components/card-form/card-form';
import { buildCardForm } from '@/app/shared/components/card-form/card-form.builder';
import { detectCardType } from '@/app/shared/validators/card.validators';
import { OnboardingPaymentService } from './onboarding-payment.service';
import { OnboardingPaymentSummary, PayOnboardingRequest } from '@/app/types/onboarding-payment';

type PageState = 'loading' | 'ready' | 'invalid' | 'alreadyPaid' | 'success';

@Component({
    selector: 'app-onboarding-payment',
    standalone: true,
    imports: [
        RouterModule,
        ButtonModule,
        MessageModule,
        SkeletonModule,
        DividerModule,
        Notification,
        CardForm
    ],
    templateUrl: './onboarding-payment.html'
})
export class OnboardingPayment {
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);
    private paymentService = inject(OnboardingPaymentService);
    private notificationService = inject(NotificationService);
    private layoutService = inject(LayoutService);

    // Branding
    isDark = computed(() => this.layoutService.isDarkTheme());
    logo = computed(() => this.isDark() ? '/logo/creditia-logo-dark.svg' : '/logo/creditia-logo.svg');
    readonly year = new Date().getFullYear();

    // Parámetros del enlace: ?cs=<companySubscriptionId>&token=<paymentToken>
    private companySubscriptionId = this.route.snapshot.queryParamMap.get('cs') ?? '';
    private token = this.route.snapshot.queryParamMap.get('token') ?? '';

    pageState = signal<PageState>('loading');
    summary = signal<OnboardingPaymentSummary | null>(null);
    paying = signal(false);

    // Formulario de tarjeta. La facturación viene precargada del resumen (solo lectura).
    cardForm = buildCardForm(() => detectCardType(this.cardForm.get('cardNumber')?.value ?? ''));

    constructor() {
        this.loadSummary();
    }

    private loadSummary(): void {
        if (!this.companySubscriptionId || !this.token) {
            this.pageState.set('invalid');
            return;
        }

        this.paymentService.getSummary(this.companySubscriptionId, this.token)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (summary) => {
                    this.summary.set(summary);
                    this.pageState.set(summary.alreadyPaid ? 'alreadyPaid' : 'ready');
                },
                error: (error: HttpErrorResponse) => {
                    // 404 = enlace inválido o token incorrecto.
                    this.pageState.set('invalid');
                }
            });
    }

    onPay(): void {
        this.cardForm.markAllAsTouched();

        if (this.cardForm.invalid) {
            this.notificationService.warn('Revisa los datos de tu tarjeta: todos los campos son obligatorios.');
            return;
        }

        const card = this.cardForm.getRawValue();

        const payload: PayOnboardingRequest = {
            companySubscriptionId: this.companySubscriptionId,
            token: this.token,
            card: {
                cardNumber: (card.cardNumber as string).replace(/\s/g, ''),
                cardName: card.cardName as string,
                cvc: card.cvc as string,
                expMonth: card.expMonth as string,
                expYear: card.expYear as string
            }
        };

        this.paying.set(true);
        this.paymentService.pay(payload)
            .pipe(
                finalize(() => this.paying.set(false)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: () => {
                    this.pageState.set('success');
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 409) {
                        // Ya pagada o pago en curso (doble clic).
                        this.notificationService.error('Este pago ya está siendo procesado o la suscripción ya fue pagada.');
                        this.pageState.set('alreadyPaid');
                    } else if (error.status === 404) {
                        this.notificationService.error('Enlace de pago inválido o expirado.');
                        this.pageState.set('invalid');
                    } else {
                        // 400 = tarjeta rechazada / error ePayco. El token se restaura: puede reintentar.
                        const message = error.error?.message || 'No se pudo procesar el pago. Verifica los datos de tu tarjeta e inténtalo de nuevo.';
                        this.notificationService.error(message);
                    }
                }
            });
    }

    formatCurrency(value: number, currency = 'COP'): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
            maximumFractionDigits: 0
        }).format(value);
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    frequencyLabel = computed(() => {
        const s = this.summary();
        if (!s) return '';
        return s.isMonthly ? 'Cobro mensual' : 'Cobro anual';
    });
}
