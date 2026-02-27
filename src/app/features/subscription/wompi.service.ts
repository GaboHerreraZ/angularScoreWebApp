import { Injectable } from '@angular/core';
import { WOMPI_CONFIG } from '@/app/core/constants/payment.constants';
import { CompanySubscription } from '@/app/types/subscription';
import { environment } from '@/environments/environment';

declare class WidgetCheckout {
    constructor(config: {
        currency: string;
        amountInCents: number;
        reference: string;
        publicKey: string;
        redirectUrl?: string;
        signature?: { integrity: string };
    });
    open(callback: (result: { transaction: { id: string } }) => void): void;
}

@Injectable({ providedIn: 'root' })
export class WompiService {
    private scriptLoaded = false;
    private scriptLoading: Promise<void> | null = null;

    loadScript(): Promise<void> {
        if (this.scriptLoaded) return Promise.resolve();
        if (this.scriptLoading) return this.scriptLoading;

        this.scriptLoading = new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = WOMPI_CONFIG.SCRIPT_URL;
            script.type = 'text/javascript';
            script.onload = () => {
                this.scriptLoaded = true;
                this.scriptLoading = null;
                resolve();
            };
            script.onerror = () => {
                this.scriptLoading = null;
                reject(new Error('No se pudo cargar el widget de Wompi'));
            };
            document.head.appendChild(script);
        });

        return this.scriptLoading;
    }

    async openCheckout(transaction: CompanySubscription, onComplete?: () => void): Promise<void> {
        await this.loadScript();

        const checkout = new WidgetCheckout({
            currency: WOMPI_CONFIG.CURRENCY,
            amountInCents: transaction.amountInCents,
            reference: transaction.paymentId,
            publicKey: environment.wompiPublicKey,
            signature: { integrity: transaction.integrityHash },
        });

        checkout.open((result) => {
            if (result?.transaction?.id) {
                onComplete?.();
            }
        });
    }
}
