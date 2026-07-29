import { Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TourService } from '@/app/shared/services/tour.service';


@Component({
    selector: 'app-tour-fab',
    standalone: true,
    imports: [ButtonModule, TooltipModule, DialogModule],
    templateUrl: './tour-fab.html',
    styleUrls: ['./tour-fab.scss']
})
export class TourFab {
    private tourService = inject(TourService);

    tours = this.tourService.availableTours;

    visible = computed(() => this.tours().length > 0);


    showHint = this.tourService.hasUndiscoveredTours;

    tooltip = computed(() => (this.tours().length === 1 ? 'Ver guía de esta pantalla' : 'Guías de esta pantalla'));

    guidesVisible = signal(false);

    private pendingTourId: string | null = null;

    open(): void {
        const tours = this.tours();
        this.tourService.acknowledgeCurrentRoute();

        if (tours.length === 1) {
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

        this.tourService.start(tourId);
    }

    onDialogHide(): void {
        const pending = this.pendingTourId;
        this.pendingTourId = null;
        if (pending) this.tourService.start(pending);
    }

    isCompleted(tourId: string): boolean {
        const tour = this.tours().find((t) => t.id === tourId);
        return !!tour && this.tourService.isCompleted(tour);
    }
}
