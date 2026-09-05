import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

/** Los dos productos de análisis: empresarial (EEFF) y capacidad de pago (PN). */
@Component({
    standalone: true,
    selector: 'study-types-widget',
    imports: [ScrollAnimateDirective],
    templateUrl: './study-types-widget.html'
})
export class StudyTypesWidget {
    readonly types = [
        {
            icon: 'pi-building',
            iconClasses: 'bg-blue-500/10 text-blue-500',
            badge: null as string | null,
            title: 'Estudio empresarial',
            subtitle: 'Con estados financieros',
            description:
                'Para clientes con estados financieros. La IA lee el balance y el estado de resultados, los cruza con Datacrédito y te dice cuánto crédito aguanta la empresa.',
            bullets: [
                'Persona natural o jurídica',
                'Indicadores financieros y veracidad del PDF',
                'Cupo sugerido por capacidad de pago'
            ]
        },
        {
            icon: 'pi-wallet',
            iconClasses: 'bg-emerald-500/10 text-emerald-500',
            badge: 'Nuevo',
            title: 'Estudio de capacidad de pago',
            subtitle: 'Sin estados financieros',
            description:
                'Para personas naturales sin estados financieros: independientes, profesionales, empleados. La IA analiza los extractos bancarios y desprendibles de nómina, complementa el análisis con la consulta a las centrales de riesgo y emite el reporte con la cuota máxima sostenible.',
            bullets: [
                'Ingreso verificado contra la cuenta, no declarado',
                'Análisis complementado con Datacrédito Experian',
                'Cuota máxima sostenible y comportamiento financiero'
            ]
        }
    ];
}
