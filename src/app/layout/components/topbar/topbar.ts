import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '@/app/layout/service/layout.service';
import { Ripple } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@/app/core/services/auth.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { NotificationCenterService } from '@/app/core/services/notification-center.service';

@Component({
    selector: '[app-topbar]',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, FormsModule, Ripple, ButtonModule, AvatarModule, TooltipModule, BadgeModule],
    templateUrl: './topbar.html',
    host: {
        class: 'layout-topbar'
    }
})
export class Topbar {
    layoutService = inject(LayoutService);

    authService = inject(AuthService);

    searchInput = viewChild<ElementRef>('searchinput');

    menuButton = viewChild<ElementRef>('menubutton');

    searchActive = signal<boolean>(false);

    tabs = computed(() => this.layoutService.tabs());

    notificationCenterService = inject(NotificationCenterService);

    user = this.authService.currentProfile();

    logo = computed(() => {
        const path = '/layout/images/logo-';
        const logo = this.layoutService.isDarkTheme() || this.layoutService.layoutConfig().layoutTheme === 'primaryColor' ? 'light.png' : 'dark.png';
        return path + logo;
    });

    onMenuButtonClick() {
        this.layoutService.toggleMenu();
    }

    activateSearch() {
        this.searchActive.set(true);
        setTimeout(() => {
            this.searchInput()?.nativeElement.focus();
        }, 100);
    }

    deactivateSearch() {
        this.searchActive.set(false);
    }

    onConfigButtonClick() {
        this.layoutService.toggleConfigSidebar();
    }

    onHelpButtonClick() {
        this.layoutService.toggleHelpPanel();
    }

    onNotificationButtonClick() {
        this.layoutService.toggleNotificationPanel();
        if (this.layoutService.layoutState().notificationPanelVisible) {
            this.notificationCenterService.loadNotifications();
        }
    }

    removeTab(event: Event, index: number) {
        event.preventDefault();
        event.stopPropagation();
        this.layoutService.closeTab(index);
    }

    private supabaseService = inject(SupabaseService);
    private router = inject(Router);

    async logout() {
        await this.supabaseService.signOut();
        this.router.navigate(['/']);
    }
}
