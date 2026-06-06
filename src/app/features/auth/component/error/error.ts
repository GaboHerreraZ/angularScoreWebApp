import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { Configurator } from '@/app/layout/components/configurator/configurator';

@Component({
    selector: 'app-error',
    imports: [ButtonModule, RippleModule, RouterModule, ButtonModule, Configurator],
    standalone: true,
    templateUrl: './error.html'
})
export class Error {}
