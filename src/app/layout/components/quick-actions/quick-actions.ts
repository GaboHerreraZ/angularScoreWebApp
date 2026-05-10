import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpeedDialModule } from 'primeng/speeddial';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { AuthService } from '@/app/core/services/auth.service';

@Component({
    selector: 'app-quick-actions',
    standalone: true,
    imports: [CommonModule, SpeedDialModule, TooltipModule],
    templateUrl: './quick-actions.html',
    styleUrls: ['./quick-actions.scss']
})
export class QuickActions {
    private router = inject(Router);
    private authService = inject(AuthService);

    private permissions = computed(() => this.authService.currentProfile()?.permissions);

    items = computed<MenuItem[]>(() => {
        const perms = this.permissions();
        const list: MenuItem[] = [];

        if (perms?.canAddCustomer) {
            list.push({
                label: 'Nuevo cliente',
                icon: 'pi pi-user-plus',
                command: () => this.router.navigate(['/app/clientes/detalle-cliente'])
            });
        }

        if (perms?.canAddCreditStudy) {
            list.push({
                label: 'Nuevo estudio',
                icon: 'pi pi-credit-card',
                command: () => this.router.navigate(['/app/estudio-credito/detalle-estudio'])
            });
        }

        if (perms?.canAddUser) {
            list.push({
                label: 'Invitar usuario',
                icon: 'pi pi-send',
                command: () => this.router.navigate(['/app/administracion/empresa'], { queryParams: { invite: 'true' } })
            });
        }

        return list;
    });

    visible = computed(() => this.items().length > 0);
}
