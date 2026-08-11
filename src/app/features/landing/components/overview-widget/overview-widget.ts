import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'overview-widget',
    imports: [ScrollAnimateDirective],
    templateUrl: './overview-widget.html'
})
export class OverviewWidget {
    readonly forYou = [
        { icon: 'pi-calendar', text: 'Vendes con plazos de pago' },
        { icon: 'pi-users', text: 'Evalúas el crédito de tus clientes' },
        { icon: 'pi-chart-line', text: 'Quieres reducir la cartera vencida' }
    ];

    readonly notForYou = [
        'Un préstamo para tu empresa',
        'Reportar a centrales de riesgo',
        'Consultar tu propio score'
    ];
}
