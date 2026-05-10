import { FormControl, FormGroup, Validators } from '@angular/forms';
import { cardExpiryValidator, cardNumberValidator, cvcValidator, CardType } from '@/app/shared/validators/card.validators';

export function buildCardForm(getCardType: () => CardType): FormGroup {
    return new FormGroup({
        cardNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, cardNumberValidator] }),
        cardName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        cvc: new FormControl('', { nonNullable: true, validators: [Validators.required, cvcValidator(getCardType)] }),
        expMonth: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        expYear: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    }, { validators: [cardExpiryValidator] });
}
