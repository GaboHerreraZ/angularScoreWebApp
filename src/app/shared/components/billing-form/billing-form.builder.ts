import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Parameter } from '@/app/types/parameter';
import { LocationOption } from '@/app/core/services/locations.service';

/** Código del parámetro `identification_type` que identifica a una persona jurídica. */
export const NIT_CODE = 'nit';

/** True si el tipo de documento seleccionado factura a nombre de una razón social. */
export function isBusinessDocType(docType: Parameter | null | undefined): boolean {
    return docType?.code?.toLowerCase() === NIT_CODE;
}

/**
 * Formulario de facturación.
 *
 * `billingName`/`billingLastName` y `billingBusinessName` son excluyentes: los
 * primeros aplican a personas naturales y el último cuando el documento es NIT.
 * Aquí se declara el estado inicial (persona natural, que es lo que se muestra
 * mientras no hay tipo de documento elegido); a partir de ahí quién es
 * obligatorio lo decide {@link syncBillingNameValidators}.
 */
export function buildBillingForm(): FormGroup {
    return new FormGroup({
        billingName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingLastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingBusinessName: new FormControl('', { nonNullable: true }),
        billingDocType: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        billingDocNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        billingAddress: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        billingState: new FormControl<LocationOption | null>(null, { validators: [Validators.required] }),
        billingCity: new FormControl<LocationOption | null>(null, { validators: [Validators.required] }),
        billingPhone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        // Perfil fiscal: la DIAN lo exige para emitir la factura y no se puede
        // derivar del tipo de documento (una persona natural puede ser
        // responsable de IVA, y una jurídica estar en el régimen simple).
        billingRegimeType: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        billingFiscalResponsibilities: new FormControl<Parameter[]>([], {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(1)]
        })
    });
}

/**
 * Deja `required` solo en los campos de nombre que corresponden al tipo de
 * documento elegido, y lo quita de los otros para que no bloqueen el envío
 * estando ocultos.
 *
 * @param clearOpposite Vacía los campos que quedan ocultos. Va en `true` cuando
 * el usuario cambia el tipo de documento —si escribió nombres y pasa a NIT, esos
 * datos ya no aplican— y en `false` al cargar datos existentes, porque ahí el
 * cambio lo dispara el propio `patchValue` y borraría lo que se acaba de cargar.
 */
export function syncBillingNameValidators(form: FormGroup, clearOpposite: boolean): void {
    const business = form.get('billingBusinessName');
    const name = form.get('billingName');
    const lastName = form.get('billingLastName');
    if (!business || !name || !lastName) return;

    const forBusiness = isBusinessDocType(form.get('billingDocType')?.value);
    const required = forBusiness ? [business] : [name, lastName];
    const hidden = forBusiness ? [name, lastName] : [business];

    for (const control of required) {
        control.setValidators([Validators.required]);
        control.updateValueAndValidity({ emitEvent: false });
    }

    for (const control of hidden) {
        control.clearValidators();
        if (clearOpposite) {
            control.setValue('', { emitEvent: false });
            control.markAsUntouched();
        }
        control.updateValueAndValidity({ emitEvent: false });
    }
}
