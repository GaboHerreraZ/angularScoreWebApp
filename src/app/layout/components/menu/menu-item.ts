import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: '[app-menuitem]',
    imports: [CommonModule, RouterModule, RippleModule, TooltipModule],
    templateUrl: './menu-item.html',
    host: {
        '[class.active-menuitem]': 'isActive()',
        '[class.layout-root-menuitem]': 'root()'
    },
    styleUrls: ['./menu-item.scss']
})
export class MenuItem {
    layoutService = inject(LayoutService);

    router = inject(Router);

    item = input<any>(null);

    root = input<boolean>(true);

    parentPath = input<string | null>(null);

    isDisabled = computed(() => this.item()?.disabled ?? false);

    isVisible = computed(() => this.item()?.visible !== false);

    hasChildren = computed(() => this.item()?.items && this.item()?.items.length > 0);

    hasCommand = computed(() => typeof this.item()?.command === 'function');

    hasRouterLink = computed(() => !!this.item()?.routerLink);

    fullPath = computed(() => {
        const itemPath = this.item()?.path;
        if (!itemPath) return this.parentPath();
        const parent = this.parentPath();
        if (parent && !itemPath.startsWith(parent)) {
            return parent + itemPath;
        }
        return itemPath;
    });

    menuHoverActive = computed(() => this.layoutService.layoutState().menuHoverActive);

    isActive = computed(() => {
        const activePath = this.layoutService.layoutState().activePath;
        if (this.item()?.path) {
            return activePath?.startsWith(this.fullPath() ?? '') ?? false;
        }
        return false;
    });

    isTooltipDisabled = computed(() => !(this.layoutService.isSlim() && this.root() && !this.isActive()));

    initialized = signal<boolean>(false);

    constructor() {
        effect(() => {
            this.updateActivePath();
        });
    }

    updateActivePath() {
        if (this.layoutService.hasOverlaySubmenu() && this.layoutService.isDesktop()) {
            return;
        }

        const item = this.item();
        const parentPath = this.parentPath();

        if (item?.routerLink && !item?.items) {
            const isRouteActive = this.router.isActive(item.routerLink[0], {
                paths: 'exact',
                queryParams: 'ignored',
                matrixParams: 'ignored',
                fragment: 'ignored'
            });

            if (isRouteActive && parentPath) {
                this.layoutService.layoutState.update((val) => ({
                    ...val,
                    activePath: parentPath
                }));
            }
        }
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.initialized.set(true);
        });
    }

    itemClick(event: Event) {
        const mouseEvent = event as MouseEvent;

        if (this.isDisabled()) {
            event.preventDefault();
            return;
        }

        // Handle cmd/ctrl + click for opening tabs
        if ((mouseEvent.metaKey || mouseEvent.ctrlKey) && this.hasRouterLink() && !this.hasChildren()) {
            event.preventDefault();
            this.layoutService.openTab({
                label: this.item().label,
                icon: this.item().icon,
                routerLink: this.item().routerLink,
                routerLinkActiveOptions: this.item().routerLinkActiveOptions,
                fragment: this.item().fragment,
                queryParamsHandling: this.item().queryParamsHandling,
                preserveFragment: this.item().preserveFragment,
                skipLocationChange: this.item().skipLocationChange,
                replaceUrl: this.item().replaceUrl,
                state: this.item().state,
                queryParams: this.item().queryParams
            });
            return;
        }

        if (this.hasCommand()) {
            this.item().command({ originalEvent: event, item: this.item() });
        }

        if (this.hasChildren()) {
            if (this.isActive()) {
                const deactivateHover = this.root() && this.layoutService.hasOverlaySubmenu() && this.layoutService.isDesktop();
                this.layoutService.layoutState.update((val) => ({
                    ...val,
                    activePath: this.parentPath(),
                    menuHoverActive: deactivateHover ? false : val.menuHoverActive
                }));
            } else {
                this.layoutService.layoutState.update((val) => ({
                    ...val,
                    activePath: this.fullPath(),
                    menuHoverActive: true
                }));
            }
        } else {
            this.layoutService.layoutState.update((val) => ({
                ...val,
                overlayMenuActive: false,
                mobileMenuActive: false,
                menuHoverActive: false
            }));

            if (this.layoutService.hasOverlaySubmenu() && this.layoutService.isDesktop()) {
                this.layoutService.layoutState.update((val) => ({
                    ...val,
                    activePath: null
                }));
            }
        }
    }

    onMouseEnter() {
        if (this.layoutService.isDesktop() && this.root() && this.hasChildren() && this.menuHoverActive() && !this.isActive()) {
            this.layoutService.layoutState.update((val) => ({
                ...val,
                activePath: this.fullPath(),
                menuHoverActive: true
            }));
        }
    }
}
