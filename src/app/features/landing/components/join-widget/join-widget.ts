import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'join-widget',
    imports: [ButtonModule, Ripple, ScrollAnimateDirective, RouterModule],
    templateUrl: './join-widget.html'
})
export class JoinWidget {}
