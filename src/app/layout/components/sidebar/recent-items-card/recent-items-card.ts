import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { RecentItemsService } from '@/app/shared/services/recent-items.service';

@Component({
    selector: 'app-recent-items-card',
    standalone: true,
    imports: [CommonModule, RouterModule, TooltipModule],
    templateUrl: './recent-items-card.html',
    styleUrls: ['./recent-items-card.scss']
})
export class RecentItemsCard {
    private recentItemsService = inject(RecentItemsService);

    customer = computed(() => this.recentItemsService.customer());
    creditStudy = computed(() => this.recentItemsService.creditStudy());
    hasAny = computed(() => !!(this.customer() || this.creditStudy()));
}
