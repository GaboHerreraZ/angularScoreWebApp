import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'testimonials-widget',
    imports: [ScrollAnimateDirective],
    templateUrl: './testimonials-widget.html'
})
export class TestimonialsWidget {}
