import { Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TourService } from '@/app/shared/services/tour.service';
import { GuidedFlowService } from '@/app/shared/services/guided-flow.service';


@Component({
    selector: 'app-tour-fab',
    standalone: true,
    imports: [ButtonModule, TooltipModule, DialogModule],
    templateUrl: './tour-fab.html',
    styleUrls: ['./tour-fab.scss']
})
export class TourFab {
    private tourService = inject(TourService);
    private flowService = inject(GuidedFlowService);

    tours = this.tourService.availableTours;
    flows = this.flowService.flows;

    visible = computed(() => this.tours().length > 0 || this.flows.length > 0);


    showHint = this.tourService.hasUndiscoveredTours;

    tooltip = computed(() => (this.flows.length > 0 ? 'Guías y tareas guiadas' : this.tours().length === 1 ? 'Ver guía de esta pantalla' : 'Guías de esta pantalla'));

    guidesVisible = signal(false);

    private pendingTourId: string | null = null;
    private pendingFlowId: string | null = null;

    open(): void {
        const tours = this.tours();
        this.tourService.acknowledgeCurrentRoute();

        if (this.flows.length === 0 && tours.length === 1) {
            this.startTour(tours[0].id);
            return;
        }

        this.guidesVisible.set(true);
    }

    startTour(tourId: string): void {
        if (this.guidesVisible()) {
            this.pendingTourId = tourId;
            this.guidesVisible.set(false);
            return;
        }

        this.flowService.cancel(false);
        this.tourService.start(tourId);
    }

    startFlow(flowId: string): void {
        if (this.guidesVisible()) {
            this.pendingFlowId = flowId;
            this.guidesVisible.set(false);
            return;
        }

        this.flowService.start(flowId);
    }

    onDialogHide(): void {
        const pendingFlow = this.pendingFlowId;
        const pendingTour = this.pendingTourId;
        this.pendingFlowId = null;
        this.pendingTourId = null;

        if (pendingFlow) {
            this.flowService.start(pendingFlow);
            return;
        }
        if (pendingTour) {
            this.flowService.cancel(false);
            this.tourService.start(pendingTour);
        }
    }

    isCompleted(tourId: string): boolean {
        const tour = this.tours().find((t) => t.id === tourId);
        return !!tour && this.tourService.isCompleted(tour);
    }

    isFlowCompleted(flowId: string): boolean {
        const flow = this.flows.find((f) => f.id === flowId);
        return !!flow && this.flowService.isCompleted(flow);
    }
}
