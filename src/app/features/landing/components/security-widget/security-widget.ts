import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'security-widget',
    imports: [ScrollAnimateDirective],
    templateUrl: './security-widget.html'
})
export class SecurityWidget {}
