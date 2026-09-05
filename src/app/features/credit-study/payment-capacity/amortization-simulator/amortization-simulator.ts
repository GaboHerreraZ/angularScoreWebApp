import { Component, computed, input, linkedSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';

export interface AmortizationRow {
    installment: number;
    payment: number;
    interest: number;
    principal: number;
    balance: number;
}

/**
 * Simulador de plan de pagos. NO hace parte del estudio ni se persiste: el
 * estudio mide la capacidad mensual del titular y quien otorga el crédito
 * decide monto, plazo y tasa. Esto solo traduce esa capacidad a cuotas.
 *
 * Sistema francés (cuota fija), que es como amortiza la banca:
 *   cuota = P·i / (1 − (1+i)^−n)
 * Aquí se usa al revés: se conoce la cuota máxima, se despeja el número de
 * cuotas y se recalcula la cuota exacta de ese plazo (queda ≤ la capacidad y
 * el saldo cierra en cero, sin cuota residual rara).
 */
@Component({
    selector: 'app-amortization-simulator',
    standalone: true,
    imports: [CommonModule, FormsModule, InputNumberModule, FloatLabelModule, MessageModule],
    templateUrl: './amortization-simulator.html'
})
export class AmortizationSimulator {
    /** Cuota máxima sostenible del titular, según el estudio. */
    maxInstallment = input.required<number>();
    /** Monto solicitado en el estudio; el usuario puede cambiarlo aquí. */
    requestedAmount = input<number | null>(null);

    /** Tope de cuotas de la simulación: más allá deja de ser un crédito real. */
    private readonly MAX_INSTALLMENTS = 120;

    /** Arranca en el monto solicitado y desde ahí el usuario simula. */
    amount = linkedSignal<number | null>(() => this.requestedAmount() ?? null);
    /** Tasa efectiva anual en porcentaje (así la cotiza el mercado colombiano). */
    annualRate = signal<number>(24);

    /** E.A. → mensual. No es dividir entre 12: (1+EA)^(1/12) − 1. */
    monthlyRate = computed(() => Math.pow(1 + this.annualRate() / 100, 1 / 12) - 1);

    /** Interés del primer mes: el piso que la cuota debe superar para amortizar. */
    firstMonthInterest = computed(() => (this.amount() ?? 0) * this.monthlyRate());

    /** Con una cuota ≤ al interés la deuda nunca se paga, dure lo que dure. */
    neverAmortizes = computed(() => {
        const amount = this.amount() ?? 0;
        return amount > 0 && this.maxInstallment() <= this.firstMonthInterest();
    });

    /** Cuotas necesarias: n = −ln(1 − P·i/cuota) / ln(1+i). */
    installments = computed(() => {
        const amount = this.amount() ?? 0;
        const cuota = this.maxInstallment();
        if (amount <= 0 || cuota <= 0 || this.neverAmortizes()) return null;

        const i = this.monthlyRate();
        // Sin intereses la cuenta es directa; con tasa, la fórmula.
        const exact = i <= 0
            ? amount / cuota
            : -Math.log(1 - (amount * i) / cuota) / Math.log(1 + i);
        return Math.min(Math.ceil(exact), this.MAX_INSTALLMENTS);
    });

    exceedsMaxTerm = computed(() => {
        const amount = this.amount() ?? 0;
        const cuota = this.maxInstallment();
        if (amount <= 0 || cuota <= 0 || this.neverAmortizes()) return false;
        const i = this.monthlyRate();
        const exact = i <= 0
            ? amount / cuota
            : -Math.log(1 - (amount * i) / cuota) / Math.log(1 + i);
        return Math.ceil(exact) > this.MAX_INSTALLMENTS;
    });

    /** Cuota exacta del plazo resultante: P·i / (1 − (1+i)^−n). */
    levelPayment = computed(() => {
        const amount = this.amount() ?? 0;
        const n = this.installments();
        if (!n || amount <= 0) return 0;
        const i = this.monthlyRate();
        if (i <= 0) return amount / n;
        return (amount * i) / (1 - Math.pow(1 + i, -n));
    });

    schedule = computed<AmortizationRow[]>(() => {
        const n = this.installments();
        const amount = this.amount() ?? 0;
        if (!n || amount <= 0) return [];

        const i = this.monthlyRate();
        const payment = this.levelPayment();
        const rows: AmortizationRow[] = [];
        let balance = amount;

        for (let k = 1; k <= n; k++) {
            const interest = balance * i;
            // La última cuota se ajusta al centavo para cerrar el saldo en cero.
            const principal = k === n ? balance : payment - interest;
            balance = Math.max(balance - principal, 0);
            rows.push({
                installment: k,
                payment: principal + interest,
                interest,
                principal,
                balance
            });
        }
        return rows;
    });

    totalPaid = computed(() => this.schedule().reduce((acc, r) => acc + r.payment, 0));
    totalInterest = computed(() => this.schedule().reduce((acc, r) => acc + r.interest, 0));

    /** Holgura de la cuota resultante frente a la capacidad verificada. */
    headroomPct = computed(() => {
        const cuota = this.maxInstallment();
        if (cuota <= 0 || !this.installments()) return null;
        return 1 - this.levelPayment() / cuota;
    });
}
