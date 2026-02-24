import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, finalize, map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { CustomersService } from '../customers.service';
import { Customer } from '@/app/types/customer';

@Component({
    selector: 'app-customer-view',
    standalone: true,
    imports: [CommonModule, RouterOutlet, ButtonModule, CardModule, TabsModule, SkeletonModule],
    templateUrl: './customer-view.html'
})
export class CustomerView {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);
    private customersService = inject(CustomersService);

    customerId = toSignal(
        this.route.params.pipe(map(params => params['id']))
    );

    customer = signal<Customer | null>(null);
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

    constructor() {
        effect(() => {
            const id = this.customerId();
            if (id) {
                this.loadCustomer(id);
            }
        });
    }

    loadCustomer(id: number): void {
        this.loading.set(true);
        this.customersService.getCustomerById(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(customer => {
            this.customer.set(customer);
        });
    }

    onTabChange(value: string | number | undefined): void {
        if (value == null) return;
        this.router.navigate([value], { relativeTo: this.route });
    }

    onBack(): void {
        this.router.navigate(['/clientes']);
    }
}
