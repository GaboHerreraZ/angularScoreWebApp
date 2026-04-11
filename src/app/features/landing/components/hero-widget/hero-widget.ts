import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { Ripple } from 'primeng/ripple';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'hero-widget',
    imports: [ButtonModule, RouterModule, Ripple, ScrollAnimateDirective],
    templateUrl: './hero-widget.html'
})
export class HeroWidget {
    scrollTo(id: string) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
