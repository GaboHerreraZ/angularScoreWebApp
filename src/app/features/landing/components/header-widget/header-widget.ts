import { Component, computed, inject } from '@angular/core';
import { StyleClass } from 'primeng/styleclass';
import { Ripple } from 'primeng/ripple';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, take } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'header-widget',
    standalone: true,
    imports: [StyleClass, Ripple, CommonModule, RouterModule, ButtonModule],
    templateUrl: './header-widget.html'
})
export class HeaderWidget {
    private layoutService = inject(LayoutService);
    private router = inject(Router);

    goToRegister() {
        this.router.navigateByUrl('/onboarding/registro');
    }

    isDark = computed(() => this.layoutService.isDarkTheme());

    logo = computed(() =>
        this.isDark() ? '/logo/creditia-logo-dark.svg' : '/logo/creditia-logo.svg'
    );

    toggleDarkMode() {
        this.layoutService.layoutConfig.update(prev => ({
            ...prev,
            darkTheme: !prev.darkTheme
        }));
    }

    scrollTo(id: string) {
        // Si ya estamos en el home, la sección existe en el DOM: scrolleamos directo.
        if (this.router.url.split('#')[0].split('?')[0] === '/') {
            this.scrollToElement(id);
            return;
        }

        // Desde otra página, navegamos al home y esperamos a que termine la
        // navegación (el landing debe renderizar) antes de scrollear a la sección.
        this.router.events.pipe(
            filter((e) => e instanceof NavigationEnd),
            take(1)
        ).subscribe(() => this.scrollToElement(id));
        this.router.navigateByUrl('/');
    }

    private scrollToElement(id: string) {
        // Pequeño defer para asegurar que la sección esté en el DOM tras renderizar.
        setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }, 200);
    }
}
