import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { Ripple } from 'primeng/ripple';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'join-widget',
    imports: [ButtonModule, RouterModule, Ripple, ScrollAnimateDirective],
    templateUrl: './join-widget.html'
})
export class JoinWidget {}
