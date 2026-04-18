import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AppNotification, NotificationRead, NotificationResponse } from '@/app/types/notification';

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
    private api = inject(ApiService);
    private authService = inject(AuthService);
    private layoutService = inject(LayoutService);
    private router = inject(Router);

    notifications = signal<AppNotification[]>([]);
    unreadCount = signal<number>(0);
    loading = signal<boolean>(false);

    page = signal<number>(1);
    totalPages = signal<number>(1);
    total = signal<number>(0);

    hasUnread = computed(() => this.unreadCount() > 0);

    private get companyId(): string {
        const profile = this.authService.currentProfile();
        return profile ? profile.companyId : '';
    }

    private get basePath(): string {
        return `companies/${this.companyId}/notifications`;
    }

    async loadNotifications(page = 1, limit = 10): Promise<void> {
        if (!this.companyId) return;
        this.loading.set(true);
        try {
            const result = await firstValueFrom(
                this.api.get<NotificationResponse>(this.basePath, {
                    params: { page, limit }
                })
            );
            if (page === 1) {
                this.notifications.set(result.data);
            } else {
                this.notifications.update((prev) => [...prev, ...result.data]);
            }
            this.page.set(result.meta.page);
            this.totalPages.set(result.meta.totalPages);
            this.total.set(result.meta.total);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            this.loading.set(false);
        }
    }

    async loadUnreadCount(): Promise<void> {
        if (!this.companyId) return;
        try {
            const result = await firstValueFrom(
                this.api.get<{ unreadCount: number }>(`${this.basePath}/unread-count`)
            );
            this.unreadCount.set(result.unreadCount);
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    }

    async markAsRead(id: string): Promise<void> {
        if (!this.companyId) return;
        try {
            await firstValueFrom(
                this.api.patch<NotificationRead>(`${this.basePath}/${id}/read`, {})
            );
            this.notifications.update((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            this.unreadCount.update((count) => Math.max(0, count - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async deleteNotification(id: string): Promise<void> {
        if (!this.companyId) return;
        try {
            const notification = this.notifications().find((n) => n.id === id);
            await firstValueFrom(
                this.api.delete<void>(`${this.basePath}/${id}`)
            );
            this.notifications.update((prev) => prev.filter((n) => n.id !== id));
            this.total.update((t) => Math.max(0, t - 1));
            if (notification && !notification.read) {
                this.unreadCount.update((count) => Math.max(0, count - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    async markAllAsRead(): Promise<void> {
        if (!this.companyId) return;
        try {
            await firstValueFrom(
                this.api.patch<{ count: number }>(`${this.basePath}/read-all`, {})
            );
            this.notifications.update((prev) =>
                prev.map((n) => ({ ...n, read: true }))
            );
            this.unreadCount.set(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    navigateToNotification(notification: AppNotification): void {
        if (!notification.read) {
            this.markAsRead(notification.id);
        }
        this.layoutService.layoutState.update((state) => ({
            ...state,
            notificationPanelVisible: false
        }));
        this.router.navigateByUrl(this.mapRoute(notification.route));
    }

    private mapRoute(route: string): string {
        return route
            .replace('/app/credit-study/detail/', '/app/estudio-credito/detalle-estudio/')
            .replace('/app/customers/detail/', '/app/clientes/detalle-cliente/');
    }

    loadMore(): void {
        if (this.page() < this.totalPages() && !this.loading()) {
            this.loadNotifications(this.page() + 1);
        }
    }
}
