import { FormGroup } from '@angular/forms';
import { buildBillingForm, isBusinessDocType, syncBillingNameValidators } from './billing-form.builder';
import { Parameter } from '@/app/types/parameter';

const docType = (id: number, code: string, label: string): Parameter => ({
    id,
    code,
    label,
    type: 'identification_type',
    isActive: true
});

// Códigos reales del parámetro identification_type.
const CC = docType(104, 'cc', 'Cédula de Ciudadanía');
const NIT = docType(106, 'nit', 'NIT');
const CE = docType(105, 'ce', 'Cédula de Extranjería');

/** Simula que el usuario elige un tipo de documento en el select. */
function selectDocType(form: FormGroup, next: Parameter): void {
    const previous = isBusinessDocType(form.get('billingDocType')!.value);
    form.get('billingDocType')!.setValue(next);
    syncBillingNameValidators(form, isBusinessDocType(next) !== previous);
}

describe('billing-form: razón social vs persona natural', () => {
    let form: FormGroup;

    beforeEach(() => {
        form = buildBillingForm();
        syncBillingNameValidators(form, false);
    });

    it('reconoce NIT como persona jurídica y el resto como natural', () => {
        expect(isBusinessDocType(NIT)).toBe(true);
        expect(isBusinessDocType(CC)).toBe(false);
        expect(isBusinessDocType(CE)).toBe(false);
        expect(isBusinessDocType(null)).toBe(false);
    });

    it('sin tipo de documento pide nombres y apellidos, no razón social', () => {
        expect(form.get('billingName')!.valid).toBe(false);
        expect(form.get('billingLastName')!.valid).toBe(false);
        expect(form.get('billingBusinessName')!.valid).toBe(true);
    });

    it('con NIT pide razón social y deja de exigir nombres y apellidos', () => {
        selectDocType(form, NIT);

        expect(form.get('billingBusinessName')!.valid).toBe(false);
        expect(form.get('billingName')!.valid).toBe(true);
        expect(form.get('billingLastName')!.valid).toBe(true);
    });

    it('limpia nombres y apellidos al cambiar a NIT', () => {
        form.get('billingName')!.setValue('Gabriel');
        form.get('billingLastName')!.setValue('Herrera');

        selectDocType(form, NIT);

        expect(form.get('billingName')!.value).toBe('');
        expect(form.get('billingLastName')!.value).toBe('');
    });

    it('limpia la razón social al salir de NIT', () => {
        selectDocType(form, NIT);
        form.get('billingBusinessName')!.setValue('Ruser Consultores S.A.S');

        selectDocType(form, CC);

        expect(form.get('billingBusinessName')!.value).toBe('');
        expect(form.get('billingName')!.valid).toBe(false);
    });

    it('no borra nada al cambiar entre dos documentos de persona natural', () => {
        selectDocType(form, CC);
        form.get('billingName')!.setValue('Gabriel');
        form.get('billingLastName')!.setValue('Herrera');

        selectDocType(form, CE);

        expect(form.get('billingName')!.value).toBe('Gabriel');
        expect(form.get('billingLastName')!.value).toBe('Herrera');
    });

    it('no borra los datos ya cargados al aplicar el tipo de documento existente', () => {
        // Lo que hace la pantalla de empresa: primero el tipo, luego los valores.
        form.get('billingDocType')!.setValue(NIT);
        syncBillingNameValidators(form, false);
        form.get('billingBusinessName')!.setValue('Ruser Consultores S.A.S');

        syncBillingNameValidators(form, false);

        expect(form.get('billingBusinessName')!.value).toBe('Ruser Consultores S.A.S');
    });

    it('deja el formulario válido con razón social y sin nombres', () => {
        selectDocType(form, NIT);
        form.patchValue({
            billingBusinessName: 'Ruser Consultores S.A.S',
            billingDocNumber: '901691260',
            billingEmail: 'facturacion@ruser.co',
            billingAddress: 'Calle 1 # 2-3',
            billingState: { id: 1, name: 'Antioquia' },
            billingCity: { id: 1, name: 'Medellín' },
            billingPhone: '3116786056'
        });

        expect(form.valid).toBe(true);
    });
});
