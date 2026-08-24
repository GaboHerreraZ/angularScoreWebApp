import { Component, computed, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '@/app/core/services/auth.service';
import { WelcomeService } from './welcome.service';

/**
 * Saludo de bienvenida que ve el cliente la primera vez que entra a la app con
 * su compra ya confirmada. No bloquea nada: es presentación, se cierra y no
 * vuelve a salir (ver WelcomeService).
 */
@Component({
    selector: 'app-welcome-dialog',
    standalone: true,
    imports: [DialogModule, ButtonModule],
    templateUrl: './welcome-dialog.html'
})
export class WelcomeDialog {
    private authService = inject(AuthService);
    private welcomeService = inject(WelcomeService);

    readonly logo = '/logo/logo-creditia-horizontal.svg';

    visible = this.welcomeService.visible;

    /** Solo el nombre de pila: el saludo con nombre y apellido suena a carta. */
    firstName = computed(() => this.authService.currentProfile()?.name?.trim().split(' ')[0] ?? '');

    companyName = computed(() => this.authService.currentProfile()?.companyName ?? '');

    availableCredits = computed(() => this.authService.currentProfile()?.permissions?.availableCredits ?? 0);

    close(): void {
        this.welcomeService.dismiss();
    }
}
