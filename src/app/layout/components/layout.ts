import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Footer } from './footer/footer';
import { LayoutService } from '@/app/layout/service/layout.service';
import { Configurator } from './configurator/configurator';
import { Breadcrumb } from './breadcrumb/breadcrumb';
import { Sidebar } from './sidebar/sidebar';
import { Topbar } from './topbar/topbar';
import { Notification } from '@/app/shared/components/notification/notification';
import { HelpPanel } from '@/app/shared/components/help-panel/help-panel';
import { NotificationCenter } from './notification-center/notification-center';
import { SearchPalette } from '@/app/shared/components/search-palette/search-palette';
import { QuickActions } from './quick-actions/quick-actions';
import { TourFab } from './tour-fab/tour-fab';
import { WelcomeDialog } from '@/app/shared/components/welcome-dialog/welcome-dialog';
import { WelcomeService } from '@/app/shared/components/welcome-dialog/welcome.service';
import { SetupChecklist } from './setup-checklist/setup-checklist';
import { CompanyDataDialog } from '@/app/shared/components/company-data-dialog/company-data-dialog';
import { AuthService } from '@/app/core/services/auth.service';
import { TourService } from '@/app/shared/services/tour.service';

/**
 * Margen para que topbar, sidebar y FAB estén montados antes de resaltar sus
 * anclas. Sin él, el primer paso del tour apunta a nodos que aún no existen.
 */
const WELCOME_TOUR_DELAY_MS = 800;

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, Topbar, Sidebar, RouterModule, Footer, Configurator, Breadcrumb, Notification, HelpPanel, NotificationCenter, SearchPalette, QuickActions, TourFab, WelcomeDialog, SetupChecklist, CompanyDataDialog],
    templateUrl: './layout.html'
})
export class Layout {
    layoutService = inject(LayoutService);
    private authService = inject(AuthService);
    private tourService = inject(TourService);
    private welcomeService = inject(WelcomeService);

    /** El recorrido de bienvenida se ofrece una sola vez por sesión de app. */
    private welcomeTourTriggered = false;

    constructor() {
        effect(() => {
            const state = this.layoutService.layoutState();
            if (state.mobileMenuActive || state.overlayMenuActive) {
                document.body.classList.add('blocked-scroll');
            } else {
                document.body.classList.remove('blocked-scroll');
            }
        });

        effect(() => this.maybeStartWelcomeTour());
    }

    /**
     * Único tour con auto-inicio: solo tras completar el onboarding y solo si el
     * usuario nunca lo ha visto. Los demás se ofrecen desde el FAB, nunca solos.
     * Espera a que se cierre el modal de bienvenida para no montarse encima.
     */
    private maybeStartWelcomeTour(): void {
        const profile = this.authService.currentProfile();
        if (this.welcomeTourTriggered || profile?.onboardingStatus !== 'ready') return;
        if (this.welcomeService.visible()) return;

        const welcome = this.tourService.welcomeTour();
        if (!welcome || this.tourService.isDiscovered(welcome)) return;

        this.welcomeTourTriggered = true;
        setTimeout(() => this.tourService.start(welcome.id), WELCOME_TOUR_DELAY_MS);
    }

    containerClass = computed(() => {
        const layoutConfig = this.layoutService.layoutConfig();
        const layoutState = this.layoutService.layoutState();

        return {
            'layout-slim': layoutConfig.menuMode === 'slim',
            'layout-slim-plus': layoutConfig.menuMode === 'slim-plus',
            'layout-static': layoutConfig.menuMode === 'static',
            'layout-overlay': layoutConfig.menuMode === 'overlay',
            'layout-overlay-active': layoutState.overlayMenuActive,
            'layout-mobile-active': layoutState.mobileMenuActive,
            'layout-static-inactive': layoutState.staticMenuInactive && layoutConfig.menuMode === 'static',
            'layout-light': layoutConfig.layoutTheme === 'colorScheme' && !layoutConfig.darkTheme,
            'layout-dark': layoutConfig.layoutTheme === 'colorScheme' && layoutConfig.darkTheme,
            'layout-primary': !layoutConfig.darkTheme && layoutConfig.layoutTheme === 'primaryColor'
        };
    });
}
