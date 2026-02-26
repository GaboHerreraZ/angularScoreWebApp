import { Component, computed, inject } from '@angular/core';
import { StyleClass } from 'primeng/styleclass';
import { Ripple } from 'primeng/ripple';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: 'header-widget',
    imports: [StyleClass, Ripple, CommonModule, RouterModule, ButtonModule],
    template: `
        <nav aria-label="Navegación principal" class="sticky top-0 z-50 backdrop-blur-md bg-surface-0/80 dark:bg-surface-950/80 border-b border-surface">
            <div class="flex items-center justify-between px-6 sm:px-12 lg:px-20 py-4 max-w-screen-2xl mx-auto">
                <a [routerLink]="['/']" class="cursor-pointer flex items-center gap-2">
                    <img [src]="logo()" alt="Verona logo" class="w-8 h-8" />
                    <span class="text-2xl font-bold text-color">VERONA</span>
                </a>
                <div class="relative flex items-center gap-2">
                    <!-- Dark mode toggle -->
                    <button
                        pButton
                        pRipple
                        rounded
                        text
                        severity="secondary"
                        class="cursor-pointer select-none w-10 h-10"
                        (click)="toggleDarkMode()"
                        [attr.aria-label]="isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
                    >
                        <i [class]="isDark() ? 'pi pi-sun text-lg' : 'pi pi-moon text-lg'"></i>
                    </button>
                    <button
                        pButton
                        pRipple
                        rounded
                        text
                        class="cursor-pointer lg:hidden! select-none w-10 h-10"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveActiveClass="animate-fadeout"
                        leaveToClass="hidden"
                        [hideOnOutsideClick]="true"
                        aria-label="Abrir menú de navegación"
                    >
                        <i class="pi pi-bars text-2xl"></i>
                    </button>
                    <div
                        id="landing-menu"
                        class="hidden lg:flex absolute right-0 top-14 lg:static z-10 shadow-lg lg:shadow-none w-64 lg:w-auto bg-surface-0 dark:bg-surface-900 lg:bg-transparent dark:lg:bg-transparent origin-top rounded-xl lg:rounded-none p-4 lg:p-0 flex-col lg:flex-row items-start lg:items-center gap-1 lg:gap-2"
                    >
                        <ul class="flex flex-col lg:flex-row m-0 p-0 list-none text-base w-full lg:w-auto">
                            <li>
                                <a
                                    class="block px-4 py-3 lg:py-2 cursor-pointer font-semibold text-muted-color hover:text-primary transition-colors duration-300 rounded-lg hover:bg-primary/5"
                                    (click)="scrollTo('features')"
                                    pStyleClass="#landing-menu"
                                    leaveActiveClass="animate-fadeout"
                                    leaveToClass="hidden"
                                >Características</a>
                            </li>
                            <li>
                                <a
                                    class="block px-4 py-3 lg:py-2 cursor-pointer font-semibold text-muted-color hover:text-primary transition-colors duration-300 rounded-lg hover:bg-primary/5"
                                    (click)="scrollTo('how-it-works')"
                                    pStyleClass="#landing-menu"
                                    leaveActiveClass="animate-fadeout"
                                    leaveToClass="hidden"
                                >Cómo Funciona</a>
                            </li>
                            <li>
                                <a
                                    class="block px-4 py-3 lg:py-2 cursor-pointer font-semibold text-muted-color hover:text-primary transition-colors duration-300 rounded-lg hover:bg-primary/5"
                                    (click)="scrollTo('security')"
                                    pStyleClass="#landing-menu"
                                    leaveActiveClass="animate-fadeout"
                                    leaveToClass="hidden"
                                >Seguridad</a>
                            </li>
                            <li>
                                <a
                                    class="block px-4 py-3 lg:py-2 cursor-pointer font-semibold text-muted-color hover:text-primary transition-colors duration-300 rounded-lg hover:bg-primary/5"
                                    (click)="scrollTo('pricing')"
                                    pStyleClass="#landing-menu"
                                    leaveActiveClass="animate-fadeout"
                                    leaveToClass="hidden"
                                >Planes</a>
                            </li>
                            <li>
                                <a
                                    class="block px-4 py-3 lg:py-2 cursor-pointer font-semibold text-muted-color hover:text-primary transition-colors duration-300 rounded-lg hover:bg-primary/5"
                                    (click)="scrollTo('faq')"
                                    pStyleClass="#landing-menu"
                                    leaveActiveClass="animate-fadeout"
                                    leaveToClass="hidden"
                                >FAQ</a>
                            </li>
                        </ul>
                        <div class="flex flex-col lg:flex-row gap-2 lg:ml-4 w-full lg:w-auto">
                            <a
                                [routerLink]="['/auth/iniciar-sesion']"
                                class="w-full lg:w-auto"
                            >
                                <button pButton pRipple label="Iniciar Sesión" icon="pi pi-sign-in" rounded outlined class="w-full lg:w-auto"></button>
                            </a>
                            <a
                                [routerLink]="['/auth/iniciar-sesion']"
                                class="w-full lg:w-auto"
                            >
                                <button pButton pRipple label="Registrarse" icon="pi pi-user-plus" rounded class="w-full lg:w-auto"></button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    `
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
