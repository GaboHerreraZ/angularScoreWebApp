import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'stats-widget',
    imports: [ScrollAnimateDirective],
    templateUrl: './stats-widget.html'
})
export class StatsWidget {}
