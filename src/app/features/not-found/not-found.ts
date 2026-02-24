import { Configurator } from '@/app/layout/components/configurator/configurator';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-notfound',
    standalone: true,
    imports: [RouterModule, ButtonModule, Configurator],
    templateUrl: './not-found.html'
})
export class NotFound {}
