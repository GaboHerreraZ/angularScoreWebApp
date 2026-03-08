import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Ripple } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { take } from 'rxjs';
import { SubscriptionService } from '@/app/features/subscription/subscription.service';
import { PlanItem, Campaign } from '@/app/types/subscription';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

interface PlanFeature {
    label: string;
    included: boolean;
}

interface PlanView {
    name: string;
    description: string;
    originalPrice: number;
    price: number;
    hasDiscount: boolean;
    popular: boolean;
    limits: string[];
    features: PlanFeature[];
    ctaLabel: string;
    ctaLink: string;
}

@Component({
    standalone: true,
    selector: 'pricing-widget',
    imports: [ButtonModule, CommonModule, RouterModule, Ripple, SkeletonModule, ScrollAnimateDirective],
    template: `
        <section id="pricing" class="px-6 sm:px-12 lg:px-20 py-16 lg:py-24 bg-surface-50 dark:bg-surface-900">
            <div class="max-w-screen-2xl mx-auto">
                <div class="text-center mb-12" appScrollAnimate="fade-up">
                    <span class="bg-primary/10 text-primary font-bold text-sm uppercase tracking-widest px-4 py-1.5 rounded-full">Precios y Planes</span>
                    <h2 class="font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-5 mb-4 text-color">Software de <span class="text-primary">análisis crediticio</span> para tu empresa</h2>
                    <p class="text-lg text-muted-color max-w-2xl mx-auto mb-4">Automatiza la evaluación de riesgo financiero y gestión de crédito. Elige el plan ideal para tu operación.</p>
                    <span class="inline-flex items-center gap-2 bg-surface-100 dark:bg-surface-800 text-muted-color text-sm font-semibold px-5 py-2.5 rounded-full">
                        <i class="pi pi-calendar text-primary"></i>
                        Todos los planes son de facturación anual
                    </span>
                </div>

                <!-- Campaign banner -->
                @if (campaign()) {
                <div class="mb-8 mx-auto max-w-3xl bg-primary/10 border border-primary/30 rounded-2xl p-5 text-center" appScrollAnimate="fade-up">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <i class="pi pi-tag text-primary text-xl"></i>
                        <span class="text-primary font-bold text-lg">{{ campaign()!.name }}</span>
                    </div>
                    <p class="text-color text-sm m-0 mb-1">{{ campaign()!.description }}</p>
                    <span class="text-muted-color text-xs">
                        Válido hasta el {{ formatDate(campaign()!.endDate) }}
                    </span>
                </div>
                }

                <!-- Skeleton loading -->
                @if (loading()) {
                <div class="flex flex-wrap justify-center gap-8">
                    @for (i of [1, 2, 3]; track i) {
                    <div class="flex flex-col bg-surface-0 dark:bg-surface-950 rounded-2xl p-8 border-2 border-surface w-full lg:w-[calc(33.333%-1.5rem)] max-w-md">
                        <p-skeleton width="40%" height="1.75rem" styleClass="mb-2" />
                        <p-skeleton width="70%" height="1rem" styleClass="mb-6" />
                        <p-skeleton width="60%" height="2.5rem" styleClass="mb-2" />
                        <p-skeleton width="30%" height="0.875rem" styleClass="mb-6" />
                        <p-skeleton width="100%" height="2.75rem" borderRadius="2rem" styleClass="mb-6" />
                        <div class="border-t border-surface mb-6"></div>
                        <p-skeleton width="25%" height="0.75rem" styleClass="mb-3" />
                        @for (j of [1, 2, 3, 4]; track j) {
                        <div class="flex items-center gap-3 mb-3">
                            <p-skeleton shape="circle" size="1.25rem" />
                            <p-skeleton width="70%" height="0.875rem" />
                        </div>
                        }
                        <p-skeleton width="30%" height="0.75rem" styleClass="mb-3 mt-4" />
                        @for (j of [1, 2, 3, 4, 5]; track j) {
                        <div class="flex items-center gap-3 mb-3">
                            <p-skeleton shape="circle" size="1.25rem" />
                            <p-skeleton width="65%" height="0.875rem" />
                        </div>
                        }
                    </div>
                    }
                </div>
                } @else {
                <div class="flex flex-wrap justify-center gap-8">
                    @for (plan of plans(); track plan.name) {
                    <div
                        class="relative flex flex-col bg-surface-0 dark:bg-surface-950 rounded-2xl p-8 border-2 transition-all duration-300 w-full lg:w-[calc(33.333%-1.5rem)] max-w-md"
                        [ngClass]="{
                            'border-primary shadow-xl scale-105': plan.popular,
                            'border-surface hover:border-primary/30 hover:shadow-lg': !plan.popular
                        }"
                    >
                        <!-- Popular badge -->
                        @if (plan.popular) {
                        <div class="absolute -top-3.5 left-1/2 -translate-x-1/2">
                            <span class="bg-primary text-primary-contrast text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">Más Popular</span>
                        </div>
                        }

                        <div class="mb-6" [class.mt-2]="plan.popular">
                            <h3 class="text-2xl font-bold m-0 text-color">{{ plan.name }}</h3>
                            <p class="text-muted-color text-sm mt-1 mb-0">{{ plan.description }}</p>
                        </div>

                        <!-- Price -->
                        <div class="mb-6">
                            @if (plan.hasDiscount && plan.originalPrice > 0) {
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-lg text-muted-color line-through">{{ formatPrice(plan.originalPrice) }}</span>
                                <span class="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{{ campaign()!.discount }}%</span>
                            </div>
                            }
                            <div class="flex items-baseline gap-2">
                                <span class="text-4xl font-extrabold text-color">{{ formatPrice(plan.price) }}</span>
                                @if (plan.price > 0) {
                                <span class="text-muted-color text-sm">COP / año</span>
                                }
                            </div>
                        </div>

                        <!-- CTA Button -->
                        <div class="mb-6">
                            <a [routerLink]="[plan.ctaLink]" class="w-full">
                                <button
                                    pButton
                                    pRipple
                                    [label]="plan.ctaLabel"
                                    rounded
                                    class="w-full"
                                    [outlined]="!plan.popular"
                                ></button>
                            </a>
                        </div>

                        <!-- Divider -->
                        <div class="border-t border-surface mb-6"></div>

                        <!-- Limits -->
                        <div class="flex flex-col gap-3 mb-6">
                            <span class="text-xs font-semibold text-muted-color uppercase tracking-wide">Límites</span>
                            @for (limit of plan.limits; track limit) {
                            <div class="flex items-center gap-3">
                                <i class="pi pi-check-circle text-primary text-sm"></i>
                                <span class="text-sm text-color">{{ limit }}</span>
                            </div>
                            }
                        </div>

                        <!-- Features -->
                        <div class="flex flex-col gap-3 mt-auto">
                            <span class="text-xs font-semibold text-muted-color uppercase tracking-wide">Características</span>
                            @for (feature of plan.features; track feature.label) {
                            <div class="flex items-center gap-3">
                                <i class="pi text-sm" [ngClass]="feature.included ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-400'"></i>
                                <span class="text-sm" [ngClass]="feature.included ? 'text-color' : 'text-muted-color'">{{ feature.label }}</span>
                            </div>
                            }
                        </div>
                    </div>
                    }
                </div>
                }
            </div>
        </section>
    `
})
export class PricingWidget {
    private subscriptionService = inject(SubscriptionService);

    loading = signal(true);
    plans = signal<PlanView[]>([]);
    campaign = signal<Campaign | null>(null);

    constructor() {
        this.subscriptionService.getPublicPlans().pipe(take(1)).subscribe({
            next: (response) => {
                this.campaign.set(response.campaign);
                this.plans.set(this.mapPlans(response.data, response.campaign));
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    private mapPlans(items: PlanItem[], campaign: Campaign | null): PlanView[] {
        const sorted = [...items].sort((a, b) => a.price - b.price);
        const hasMostExpensive = sorted.length > 2;
        const discount = campaign?.discount ?? 0;

        return sorted.map((item, index) => {
            const isMiddle = sorted.length > 1 && index === Math.floor(sorted.length / 2);
            const isFree = item.price === 0;
            const hasDiscount = discount > 0 && !isFree;
            const discountedPrice = hasDiscount ? Math.round(item.price * (1 - discount / 100)) : item.price;

            return {
                name: item.name,
                description: item.description || this.getDefaultDescription(index, sorted.length),
                originalPrice: item.price,
                price: discountedPrice,
                hasDiscount,
                popular: isMiddle,
                limits: this.buildLimits(item),
                features: this.buildFeatures(item),
                ctaLabel: isFree ? 'Comenzar Gratis' : (hasMostExpensive && index === sorted.length - 1 ? 'Contactar Ventas' : 'Empezar Ahora'),
                ctaLink: '/auth/iniciar-sesion'
            };
        });
    }

    private getDefaultDescription(index: number, total: number): string {
        if (index === 0) return 'Ideal para empezar con el análisis crediticio';
        if (index === total - 1) return 'Para empresas con operaciones a gran escala';
        return 'Para equipos que necesitan más capacidad';
    }

    private buildLimits(item: PlanItem): string[] {
        const limits: string[] = [];
        limits.push(item.maxUsers === -1 ? 'Usuarios ilimitados' : `Hasta ${item.maxUsers} usuario${item.maxUsers > 1 ? 's' : ''}`);
        limits.push(item.maxCompanies === -1 ? 'Empresas ilimitadas' : `${item.maxCompanies} empresa${item.maxCompanies > 1 ? 's' : ''}`);
        limits.push(
            item.maxCustomers === null || item.maxCustomers === -1
                ? 'Clientes ilimitados'
                : `Hasta ${item.maxCustomers} cliente${item.maxCustomers > 1 ? 's' : ''}`
        );
        limits.push(
            item.maxStudiesPerMonth === null || item.maxStudiesPerMonth === -1
                ? 'Estudios ilimitados / mes'
                : `${item.maxStudiesPerMonth} estudio${item.maxStudiesPerMonth > 1 ? 's' : ''} / mes`
        );
        return limits;
    }

    private buildFeatures(item: PlanItem): PlanFeature[] {
        return [
            { label: `Dashboard ${item.dashboardLevel?.label?.toLowerCase() ?? 'básico'}`, included: true },
            { label: `Soporte por ${item.supportLevel?.label?.toLowerCase() ?? 'correo'}`, included: true },
            { label: 'Reportes Excel', included: item.excelReports },
            { label: 'Notificaciones por correo', included: item.emailNotifications },
            { label: 'Personalización de tema', included: item.themeCustomization }
        ];
    }

    formatPrice(value: number): string {
        if (value === 0) return 'Gratis';
        return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value);
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    }
}
