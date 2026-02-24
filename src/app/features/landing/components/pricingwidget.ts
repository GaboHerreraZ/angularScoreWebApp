import { Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Ripple } from 'primeng/ripple';

interface PlanFeature {
    label: string;
    included: boolean;
}

interface Plan {
    name: string;
    description: string;
    monthlyPrice: number;
    annualPrice: number;
    popular: boolean;
    limits: string[];
    features: PlanFeature[];
    ctaLabel: string;
    ctaLink: string;
}

@Component({
    standalone: true,
    selector: 'pricing-widget',
    imports: [ButtonModule, CommonModule, RouterModule, Ripple],
    template: `
        <section id="pricing" class="px-6 sm:px-12 lg:px-20 py-16 lg:py-24 bg-surface-50 dark:bg-surface-900">
            <div class="max-w-screen-2xl mx-auto">
                <div class="text-center mb-12">
                    <span class="text-primary font-bold text-sm uppercase tracking-widest">Precios</span>
                    <h2 class="font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-3 mb-4 text-color">Planes que crecen con tu empresa</h2>
                    <p class="text-lg text-muted-color max-w-2xl mx-auto mb-8">Elige el plan que mejor se adapte a tus necesidades. Cambia o cancela en cualquier momento.</p>

                    <!-- Billing toggle -->
                    <div class="inline-flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-full p-1 cursor-pointer select-none">
                        <span
                            class="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
                            [ngClass]="billingCycle() === 'monthly' ? 'bg-primary text-primary-contrast shadow-sm' : 'text-muted-color hover:text-color'"
                            (click)="billingCycle.set('monthly')"
                        >Mensual</span>
                        <span
                            class="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5"
                            [ngClass]="billingCycle() === 'annual' ? 'bg-primary text-primary-contrast shadow-sm' : 'text-muted-color hover:text-color'"
                            (click)="billingCycle.set('annual')"
                        >
                            Anual
                            <span
                                class="text-xs font-bold px-1.5 py-0.5 rounded-full"
                                [ngClass]="billingCycle() === 'annual' ? 'bg-white/20 text-primary-contrast' : 'bg-green-500 text-white'"
                            >-20%</span>
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    @for (plan of plans; track plan.name) {
                    <div
                        class="relative flex flex-col bg-surface-0 dark:bg-surface-950 rounded-2xl p-8 border-2 transition-all duration-300"
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
                            @if (billingCycle() === 'annual' && plan.monthlyPrice > 0) {
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-muted-color text-sm line-through">{{ formatPrice(plan.monthlyPrice * 12) }} COP</span>
                                <span class="bg-green-500/10 text-green-500 text-xs font-bold px-2 py-0.5 rounded-full">-20%</span>
                            </div>
                            }
                            <div class="flex items-baseline gap-2">
                                <span class="text-4xl font-extrabold text-color">{{ formatPrice(getPrice(plan)) }}</span>
                                <span class="text-muted-color text-sm">COP / {{ billingCycle() === 'monthly' ? 'mes' : 'año' }}</span>
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
            </div>
        </section>
    `
})
export class PricingWidget {
    billingCycle = signal<'monthly' | 'annual'>('monthly');

    plans: Plan[] = [
        {
            name: 'Básico',
            description: 'Ideal para empezar con el análisis crediticio',
            monthlyPrice: 0,
            annualPrice: 0,
            popular: false,
            limits: [
                'Hasta 2 usuarios',
                '1 empresa',
                'Hasta 50 clientes',
                '10 estudios / mes'
            ],
            features: [
                { label: 'Dashboard básico', included: true },
                { label: 'Soporte por correo', included: true },
                { label: 'Reportes Excel', included: false },
                { label: 'Notificaciones por correo', included: false },
                { label: 'Personalización de tema', included: false }
            ],
            ctaLabel: 'Comenzar Gratis',
            ctaLink: '/auth/iniciar-sesion'
        },
        {
            name: 'Profesional',
            description: 'Para equipos que necesitan más capacidad',
            monthlyPrice: 149000,
            annualPrice: 1430400,
            popular: true,
            limits: [
                'Hasta 5 usuarios',
                '2 empresas',
                'Hasta 200 clientes',
                '50 estudios / mes'
            ],
            features: [
                { label: 'Dashboard avanzado', included: true },
                { label: 'Soporte prioritario', included: true },
                { label: 'Reportes Excel', included: true },
                { label: 'Notificaciones por correo', included: true },
                { label: 'Personalización de tema', included: false }
            ],
            ctaLabel: 'Comenzar Prueba',
            ctaLink: '/auth/iniciar-sesion'
        },
        {
            name: 'Empresarial',
            description: 'Para empresas con operaciones a gran escala',
            monthlyPrice: 399000,
            annualPrice: 3830400,
            popular: false,
            limits: [
                'Usuarios ilimitados',
                'Empresas ilimitadas',
                'Clientes ilimitados',
                'Estudios ilimitados / mes'
            ],
            features: [
                { label: 'Dashboard completo', included: true },
                { label: 'Soporte dedicado', included: true },
                { label: 'Reportes Excel', included: true },
                { label: 'Notificaciones por correo', included: true },
                { label: 'Personalización de tema', included: true }
            ],
            ctaLabel: 'Contactar Ventas',
            ctaLink: '/auth/iniciar-sesion'
        }
    ];

    getPrice(plan: Plan): number {
        return this.billingCycle() === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    }

    formatPrice(value: number): string {
        if (value === 0) return 'Gratis';
        return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value);
    }
}
