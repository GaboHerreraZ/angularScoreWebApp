import { Configurator } from '@/app/layout/components/configurator/configurator';
import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-notfound',
    standalone: true,
    imports: [RouterModule, ButtonModule, Configurator],
    templateUrl: './not-found.html'
})
export class NotFound {
    private location = inject(Location);

    goBack(): void {
        this.location.back();
    }
}
