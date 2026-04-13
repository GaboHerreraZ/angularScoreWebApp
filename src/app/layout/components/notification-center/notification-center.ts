import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { Ripple } from 'primeng/ripple';
import { LayoutService } from '@/app/layout/service/layout.service';
import { NotificationCenterService } from '@/app/core/services/notification-center.service';
import { AppNotification } from '@/app/types/notification';
import { TimeAgoPipe } from './time-ago.pipe';

@Component({
    selector: 'app-notification-center',
    standalone: true,
    imports: [CommonModule, DrawerModule, ButtonModule, BadgeModule, SkeletonModule, TooltipModule, Ripple, TimeAgoPipe],
    templateUrl: './notification-center.html'
})
export class NotificationCenter implements OnInit {
    layoutService = inject(LayoutService);
    notificationService = inject(NotificationCenterService);

    get panelVisible(): boolean {
        return this.layoutService.layoutState().notificationPanelVisible;
    }

    set panelVisible(val: boolean) {
        this.layoutService.layoutState.update((state) => ({ ...state, notificationPanelVisible: val }));
    }

    ngOnInit(): void {
        this.notificationService.loadUnreadCount();
    }

    onBellClick(): void {
        this.layoutService.toggleNotificationPanel();
        if (this.layoutService.layoutState().notificationPanelVisible) {
            this.notificationService.loadNotifications();
        }
    }

    onNotificationClick(notification: AppNotification): void {
        this.notificationService.navigateToNotification(notification);
    }

    markAsRead(event: Event, notification: AppNotification): void {
        event.stopPropagation();
        this.notificationService.markAsRead(notification.id);
    }

    deleteNotification(event: Event, notification: AppNotification): void {
        event.stopPropagation();
        this.notificationService.deleteNotification(notification.id);
    }

    markAllAsRead(): void {
        this.notificationService.markAllAsRead();
    }

    loadMore(): void {
        this.notificationService.loadMore();
    }

    getTypeIcon(notification: AppNotification): string {
        const code = notification.type?.code;
        switch (code) {
            case 'credit_study': return 'pi pi-file';
            case 'customer': return 'pi pi-users';
            case 'payment': return 'pi pi-wallet';
            default: return 'pi pi-info-circle';
        }
    }
}
