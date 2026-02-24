import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { Ripple } from 'primeng/ripple';

@Component({
    standalone: true,
    selector: 'hero-widget',
    imports: [ButtonModule, RouterModule, Ripple],
    template: `
        <section class="relative overflow-hidden bg-linear-to-br from-primary/5 via-surface-0 to-surface-0 dark:from-primary/10 dark:via-surface-950 dark:to-surface-950">
            <div class="flex flex-col lg:flex-row gap-12 items-center justify-between px-6 sm:px-12 lg:px-20 py-16 lg:py-24 max-w-screen-2xl mx-auto">
                <!-- Text content -->
                <div class="flex-1 animate-fadein animate-duration-1000">
                    <div class="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-semibold mb-6">
                        <i class="pi pi-sparkles"></i>
                        <span>Plataforma de análisis crediticio</span>
                    </div>
                    <h1 class="font-extrabold text-4xl sm:text-5xl lg:text-6xl mt-0 mb-6 leading-tight text-color">
                        Decisiones de crédito <span class="text-primary">inteligentes</span>, rápidas y seguras
                    </h1>
                    <p class="text-lg sm:text-xl mb-8 leading-relaxed text-muted-color max-w-2xl">
                        Automatiza el análisis financiero de tus clientes con scoring de riesgo en tiempo real.
                        Más de 15 indicadores calculados automáticamente para decisiones acertadas.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 mb-12">
                        <a [routerLink]="['/auth/iniciar-sesion']">
                            <button pButton pRipple label="Comenzar Gratis" icon="pi pi-arrow-right" iconPos="right" rounded class="text-lg px-8 py-3 w-full sm:w-auto"></button>
                        </a>
                        <button pButton pRipple label="Ver cómo funciona" icon="pi pi-play-circle" rounded outlined class="text-lg px-8 py-3" (click)="scrollTo('how-it-works')"></button>
                    </div>
                    <!-- Trust badges -->
                    <div class="flex flex-wrap gap-8">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <i class="pi pi-shield text-green-500 text-lg"></i>
                            </div>
                            <div>
                                <div class="font-bold text-color">Seguro</div>
                                <div class="text-sm text-muted-color">Datos encriptados</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <i class="pi pi-chart-line text-blue-500 text-lg"></i>
                            </div>
                            <div>
                                <div class="font-bold text-color">+15 indicadores</div>
                                <div class="text-sm text-muted-color">Análisis completo</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <i class="pi pi-clock text-purple-500 text-lg"></i>
                            </div>
                            <div>
                                <div class="font-bold text-color">En minutos</div>
                                <div class="text-sm text-muted-color">Resultados al instante</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dashboard illustration -->
                <div class="flex-1 animate-fadeinright animate-ease-in-out animate-duration-1000 w-full max-w-xl">
                    <div class="bg-surface-0 dark:bg-surface-900 rounded-2xl shadow-2xl p-6 border border-surface">
                        <!-- Mock header -->
                        <div class="flex items-center justify-between mb-6">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full bg-red-400"></div>
                                <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div class="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <span class="text-xs text-muted-color font-mono">verona.app/estudio-crediticio</span>
                        </div>
                        <!-- Scoring card -->
                        <div class="bg-linear-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-xl p-5 mb-4">
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-sm font-semibold text-muted-color">Score de Riesgo</span>
                                <span class="bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full">Riesgo Bajo</span>
                            </div>
                            <div class="text-5xl font-extrabold text-green-600 dark:text-green-400 mb-2">87<span class="text-lg text-muted-color">/100</span></div>
                            <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                                <div class="bg-linear-to-r from-green-500 to-emerald-400 h-2 rounded-full" style="width: 87%"></div>
                            </div>
                        </div>
                        <!-- Mini indicators -->
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                                <div class="text-xs text-muted-color mb-1">Capacidad de Pago</div>
                                <div class="text-lg font-bold text-color flex items-center gap-1">
                                    <i class="pi pi-arrow-up text-green-500 text-xs"></i>
                                    $24.5M
                                </div>
                            </div>
                            <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                                <div class="text-xs text-muted-color mb-1">EBITDA</div>
                                <div class="text-lg font-bold text-color flex items-center gap-1">
                                    <i class="pi pi-arrow-up text-green-500 text-xs"></i>
                                    $18.2M
                                </div>
                            </div>
                            <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                                <div class="text-xs text-muted-color mb-1">Endeudamiento</div>
                                <div class="text-lg font-bold text-color flex items-center gap-1">
                                    <i class="pi pi-arrow-down text-blue-500 text-xs"></i>
                                    32%
                                </div>
                            </div>
                            <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                                <div class="text-xs text-muted-color mb-1">Cobertura Deuda</div>
                                <div class="text-lg font-bold text-color flex items-center gap-1">
                                    <i class="pi pi-check text-green-500 text-xs"></i>
                                    2.4x
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `
})
export class HeroWidget {
    scrollTo(id: string) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
