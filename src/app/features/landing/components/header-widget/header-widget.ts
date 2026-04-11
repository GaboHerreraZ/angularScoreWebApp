import { Component, computed, inject } from '@angular/core';
import { StyleClass } from 'primeng/styleclass';
import { Ripple } from 'primeng/ripple';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

    isDark = computed(() => this.layoutService.isDarkTheme());

    logo = computed(() => {
        const path = '/layout/images/logo-';
        const suffix = this.isDark() ? 'light.png' : 'dark.png';
        return path + suffix;
    });

    toggleDarkMode() {
        this.layoutService.layoutConfig.update(prev => ({
            ...prev,
            darkTheme: !prev.darkTheme
        }));
    }

    scrollTo(id: string) {
        setTimeout(() => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }
        }, 200);
    }
}
