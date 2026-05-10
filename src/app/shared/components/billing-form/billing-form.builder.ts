import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Parameter } from '@/app/types/parameter';

export function buildBillingForm(): FormGroup {
    return new FormGroup({
        billingName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingLastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingDocType: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        billingDocNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        billingAddress: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingState: new FormControl<{ id: number; name: string } | null>(null, { validators: [Validators.required] }),
        billingCity: new FormControl<{ id: number; name: string } | null>(null, { validators: [Validators.required] }),
        billingPhone: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    });
}
