import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-service-unavailable',
    standalone: true,
    imports: [ButtonModule],
    templateUrl: './service-unavailable.html'
})
export class ServiceUnavailable {
    onReload(): void {
        window.location.href = '/app';
    }
}
