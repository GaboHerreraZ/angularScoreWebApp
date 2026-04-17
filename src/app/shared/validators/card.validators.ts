import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export type CardType = 'visa' | 'mastercard' | 'amex' | 'diners' | 'discover' | 'unknown';

export interface CardBrand {
    type: CardType;
    label: string;
    icon: string;
    lengths: number[];
    cvcLength: number;
    pattern: RegExp;
}

const CARD_BRANDS: CardBrand[] = [
    { type: 'visa', label: 'Visa', icon: 'icons/cards/visa.svg', lengths: [16, 19], cvcLength: 3, pattern: /^4/ },
    { type: 'mastercard', label: 'Mastercard', icon: 'icons/cards/mastercard.svg', lengths: [16], cvcLength: 3, pattern: /^(5[1-5]|2[2-7])/ },
    { type: 'amex', label: 'American Express', icon: 'icons/cards/amex.svg', lengths: [15], cvcLength: 4, pattern: /^3[47]/ },
    { type: 'diners', label: 'Diners Club', icon: 'icons/cards/diners.svg', lengths: [14, 16], cvcLength: 3, pattern: /^(30[0-5]|36|38)/ },
    { type: 'discover', label: 'Discover', icon: 'icons/cards/discover.svg', lengths: [16], cvcLength: 3, pattern: /^(6011|65|64[4-9])/ },
];

export function detectCardType(number: string): CardType {
    const cleaned = number.replace(/\s/g, '');
    for (const brand of CARD_BRANDS) {
        if (brand.pattern.test(cleaned)) return brand.type;
    }
    return 'unknown';
}

export function getCardBrand(type: CardType): CardBrand | null {
    return CARD_BRANDS.find(b => b.type === type) ?? null;
}

export const luhnValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.replace(/\s/g, '') ?? '';
    if (!value) return null;
    if (!/^\d+$/.test(value)) return { luhn: true };

    let sum = 0;
    let alternate = false;
    for (let i = value.length - 1; i >= 0; i--) {
        let n = parseInt(value[i], 10);
        if (alternate) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alternate = !alternate;
    }
    return sum % 10 === 0 ? null : { luhn: true };
};

export const cardNumberValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.replace(/\s/g, '') ?? '';
    if (!value) return null;

    const type = detectCardType(value);
    const brand = getCardBrand(type);
    const validLength = brand ? brand.lengths.includes(value.length) : value.length >= 13 && value.length <= 19;

    if (!validLength) return { cardNumber: true };
    return luhnValidator(control);
};

export const cardExpiryValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const month = control.get('expMonth')?.value;
    const year = control.get('expYear')?.value;

    if (!month || !year) return null;

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (m < 1 || m > 12) return { cardExpiry: true };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (y < currentYear || (y === currentYear && m < currentMonth)) {
        return { cardExpiry: true };
    }

    return null;
};

export function cvcValidator(cardType: () => CardType): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value ?? '';
        if (!value) return null;
        if (!/^\d+$/.test(value)) return { cvc: true };

        const brand = getCardBrand(cardType());
        const expectedLength = brand?.cvcLength ?? 3;
        return value.length === expectedLength ? null : { cvc: true };
    };
}

export function formatCardNumber(value: string): string {
    const cleaned = value.replace(/\D/g, '');
    const type = detectCardType(cleaned);

    if (type === 'amex') {
        return cleaned.replace(/(\d{4})(\d{6})(\d{0,5})/, '$1 $2 $3').trim();
    }
    if (type === 'diners') {
        return cleaned.replace(/(\d{4})(\d{6})(\d{0,4})/, '$1 $2 $3').trim();
    }
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
