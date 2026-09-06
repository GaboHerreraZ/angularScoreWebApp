import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, finalize, map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { CustomersService } from '../customers.service';
import { CustomerDetail } from '@/app/types/customer';
import { formatShortDate } from '@/app/shared/utils/format.util';
import { RecentItemsService } from '@/app/shared/services/recent-items.service';
import { SupportFab } from '@/app/shared/components/support-fab/support-fab';

@Component({
    selector: 'app-customer-view',
    standalone: true,
    imports: [CommonModule, DatePipe, RouterOutlet, ButtonModule, CardModule, TabsModule, SkeletonModule, TagModule, SupportFab],
    templateUrl: './customer-view.html'
})
export class CustomerView {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);
    private customersService = inject(CustomersService);
    private recentItemsService = inject(RecentItemsService);

    customerId = toSignal(
        this.route.params.pipe(map(params => params['id']))
    );

    private returnUrl = toSignal(
        this.route.queryParams.pipe(map(qp => qp['returnUrl']))
    );

    customer = signal<CustomerDetail | null>(null);
    loading = signal(false);

    private url = toSignal(
        this.router.events.pipe(
            filter((e) => e instanceof NavigationEnd),
            map((e) => (e as NavigationEnd).urlAfterRedirects)
        ),
        { initialValue: this.router.url }
    );

    activeTab = computed(() => {
        const url = this.url();
        const segments = url.split('/');
        return segments[segments.length - 1] || 'informacion';
    });

    // ── Autorización de habeas data (resumen en el header) ─────────────────
    authorization = computed(() => this.customer()?.authorization ?? null);

    /** Mismo criterio que la pestaña de información: revocada gana sobre firmada. */
    authorizationTag = computed<{ label: string; severity: 'success' | 'warn' | 'danger' | 'secondary'; icon: string }>(() => {
        const a = this.authorization();
        if (!a) return { label: 'No solicitada', severity: 'secondary', icon: 'pi pi-shield' };
        if (a.revokedAt) return { label: 'Revocada', severity: 'danger', icon: 'pi pi-ban' };
        if (a.isSigned) return { label: 'Firmada', severity: 'success', icon: 'pi pi-verified' };
        if (a.refusedAt) return { label: 'Rechazada', severity: 'danger', icon: 'pi pi-times-circle' };
        return { label: 'Pendiente de firma', severity: 'warn', icon: 'pi pi-clock' };
    });

    /** Línea de apoyo bajo el tag: la fecha (o el motivo) que explica el estado actual. */
    authorizationDetail = computed<string | null>(() => {
        const a = this.authorization();
        if (!a) return null;
        if (a.revokedAt) return `Revocada el ${formatShortDate(a.revokedAt)}`;
        if (a.isSigned) return a.signedAt ? `Firmada el ${formatShortDate(a.signedAt)}` : null;
        if (a.refusedAt) return a.refusedReason ? `Motivo: ${a.refusedReason}` : `Rechazada el ${formatShortDate(a.refusedAt)}`;
        return a.sentAt ? `Enviada el ${formatShortDate(a.sentAt)}` : null;
    });

    /** Solo mientras sigue viva la firma: rechazada o revocada ya no se pueden firmar. */
    canSign = computed(() => {
        const a = this.authorization();
        return !!a && !a.isSigned && !a.refusedAt && !a.revokedAt && !!a.signUrl;
    });

    constructor() {
        effect(() => {
            const id = this.customerId();
            if (id) {
                this.loadCustomer(id);
            }
        });

        // Mantiene el header sincronizado cuando la pestaña de información guarda cambios (PATCH).
        effect(() => {
            const updated = this.customersService.customerUpdated();
            if (updated && updated.id === this.customerId()) {
                this.customer.set(updated);
            }
        });
    }

    loadCustomer(id: string): void {
        this.loading.set(true);
        this.customersService.getCustomerById(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(customer => {
            this.customer.set(customer);
            if (customer?.id && customer.businessName) {
                this.recentItemsService.setCustomer(customer.id, customer.businessName);
            }
        });
    }

    onTabChange(value: string | number | undefined): void {
        if (value == null) return;
        this.router.navigate([value], { relativeTo: this.route });
    }

    openUrl(url: string | null): void {
        if (url) window.open(url, '_blank', 'noopener');
    }

    onBack(): void {
        const returnUrl = this.returnUrl();
        if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
        } else {
            this.router.navigate(['/app/clientes']);
        }
    }
}
