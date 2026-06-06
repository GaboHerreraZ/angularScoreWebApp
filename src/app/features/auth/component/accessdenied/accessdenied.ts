import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Configurator } from '@/app/layout/components/configurator/configurator';

@Component({
    selector: 'app-access',
    standalone: true,
    imports: [ButtonModule, RouterModule, RippleModule, Configurator, ButtonModule],
    templateUrl: './accessdenied.html'
})
export class AccessDenied {}
