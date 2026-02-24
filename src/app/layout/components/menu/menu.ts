import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from './menu-item';

@Component({
    selector: '[app-menu]',
    standalone: true,
    imports: [CommonModule, MenuItem, RouterModule],
    templateUrl: './menu.html'
})
export class Menu {
    model: any[] = [
        {
            label: 'Dashboard',
            icon: 'pi pi-home',
            path: '/panel',
            items: [
                {
                    label: 'Dashboard',
                    icon: 'pi pi-desktop',
                    routerLink: ['/panel']
                }
            ]
        },
          {
            label: 'Clientes',
            icon: 'pi pi-building-columns',
            path: '/clientes',
            items: [
                {
                    label: 'Gestión de Clientes',
                    icon: 'pi pi-building-columns',
                    routerLink: ['/clientes']
                }
            ]
        },
        {
            label: 'Créditos',
            icon: 'pi pi-credit-card',
            path: '/estudio-credito',
            items: [
                {
                    label: 'Estudios de Crédito',
                    icon: 'pi pi-credit-card',
                    routerLink: ['/estudio-credito']
                }
            ]
        }
    ];
}
