import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CardType, detectCardType, formatCardNumber, getCardBrand } from '@/app/shared/validators/card.validators';

@Component({
    selector: 'app-card-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, SelectModule, FloatLabelModule],
    templateUrl: './card-form.html'
})
export class CardForm {
    private destroyRef = inject(DestroyRef);

    formGroup = input.required<FormGroup>();

    cardType = signal<CardType>('unknown');
    cardBrand = computed(() => getCardBrand(this.cardType()));

    expiryMonths = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    expiryYears = Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i));

    constructor() {
        effect((onCleanup) => {
            const form = this.formGroup();
            const numberCtrl = form.get('cardNumber');
            if (!numberCtrl) return;

            this.cardType.set(detectCardType(numberCtrl.value ?? ''));

            const sub = numberCtrl.valueChanges.pipe(
                takeUntilDestroyed(this.destroyRef)
            ).subscribe(value => {
                this.cardType.set(detectCardType(value ?? ''));
            });

            onCleanup(() => sub.unsubscribe());
        });
    }

    onCardNumberInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = formatCardNumber(input.value);
        this.formGroup().get('cardNumber')?.setValue(formatted, { emitEvent: true });
    }

    isInvalid(controlName: string): boolean {
        const control = this.formGroup().get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(controlName: string): string {
        const control = this.formGroup().get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['luhn'] || control.errors['cardNumber']) return 'Número de tarjeta inválido';
        if (control.errors['cvc']) return 'CVC inválido';
        return '';
    }

    getExpiryError(): string {
        const form = this.formGroup();
        if (form.errors?.['cardExpiry'] && (form.get('expMonth')?.touched || form.get('expYear')?.touched)) {
            return 'Fecha de expiración inválida';
        }
        return '';
    }
}
