import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'methodology-widget',
    imports: [ScrollAnimateDirective],
    templateUrl: './methodology-widget.html'
})
export class MethodologyWidget {}
