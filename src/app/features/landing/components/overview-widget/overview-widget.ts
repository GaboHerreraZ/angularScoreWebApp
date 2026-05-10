import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'overview-widget',
    imports: [ScrollAnimateDirective],
    templateUrl: './overview-widget.html'
})
export class OverviewWidget {}
