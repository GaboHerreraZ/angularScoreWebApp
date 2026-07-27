import { Component, computed, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { LayoutService } from '@/app/layout/service/layout.service';
import { SupportTicketPrefill } from '@/app/types/support-ticket';

/**
 * Botón flotante para reportar un problema sobre el registro que se está viendo.
 * Es la única vía para crear tickets de las áreas que exigen id (estudio de
 * crédito y cliente): abre el Centro de Ayuda en Soporte con el id ya resuelto.
 *
 * Se ubica sobre el SpeedDial global de acciones rápidas para no solaparlo.
 */
@Component({
    selector: 'app-support-fab',
    standalone: true,
    imports: [ButtonModule, TooltipModule],
    styleUrls: ['./support-fab.scss'],
    template: `
        <div class="support-fab">
            <p-button
                icon="pi pi-headphones"
                severity="primary"
                [rounded]="true"
                [raised]="true"
                [pTooltip]="tooltip()"
                tooltipPosition="left"
                [ariaLabel]="tooltip()"
                (onClick)="openSupport()"
            />
        </div>
    `
})
export class SupportFab {
    private layoutService = inject(LayoutService);

    area = input.required<SupportTicketPrefill['area']>();
    /** Id del estudio (área credit_study) o del cliente (área customer). */
    recordId = input.required<string | null | undefined>();
    /** Nombre legible del registro, para mostrarlo dentro del formulario. */
    label = input<string | null>(null);

    tooltip = computed(() =>
        this.area() === 'credit_study'
            ? 'Reportar un problema con este estudio'
            : 'Reportar un problema con este cliente'
    );

    openSupport(): void {
        const id = this.recordId();
        if (!id) return;

        this.layoutService.openSupportWith({
            area: this.area(),
            creditStudyId: this.area() === 'credit_study' ? id : null,
            customerId: this.area() === 'customer' ? id : null,
            label: this.label()
        });
    }
}
