import { Component, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { StudyTypeCode } from '@/app/types/payment-capacity';

interface StudyTypeOption {
    code: StudyTypeCode;
    title: string;
    subtitle: string;
    icon: string;
    iconClasses: string;
    bullets: string[];
}

/**
 * Diálogo de elección del tipo de estudio, previo a crear uno nuevo. Existen
 * dos productos con flujos distintos: el empresarial (estados financieros,
 * PN o PJ) y el de capacidad de pago (persona natural, sobre extractos y
 * soportes de ingreso). Emite el code elegido; el contenedor rutea.
 */
@Component({
    selector: 'app-study-type-selector',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule],
    templateUrl: './study-type-selector.html'
})
export class StudyTypeSelector {
    visible = model<boolean>(false);
    selected = output<StudyTypeCode>();

    readonly options: StudyTypeOption[] = [
        {
            code: 'financialStatements',
            title: 'Estudio empresarial',
            subtitle: 'Con estados financieros',
            icon: 'pi pi-building',
            iconClasses: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400',
            bullets: [
                'Persona natural o jurídica',
                'Balance y estado de resultados (PDF o centrales)',
                'Indicadores financieros y cupo por capacidad de pago'
            ]
        },
        {
            code: 'paymentCapacity',
            title: 'Estudio de capacidad de pago',
            subtitle: 'Sin estados financieros',
            icon: 'pi pi-wallet',
            iconClasses: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400',
            bullets: [
                'Solo persona natural (asalariado o independiente)',
                'Extractos bancarios y soportes de ingreso',
                'Cuota máxima y endeudamiento sobre flujo de caja real'
            ]
        }
    ];

    onSelect(code: StudyTypeCode): void {
        this.visible.set(false);
        this.selected.emit(code);
    }
}
