import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'features-widget',
    template: `
        <section id="features" class="px-6 sm:px-12 lg:px-20 py-16 lg:py-24 bg-surface-0 dark:bg-surface-950">
            <div class="max-w-screen-2xl mx-auto">
                <div class="text-center mb-16">
                    <span class="text-primary font-bold text-sm uppercase tracking-widest">Características</span>
                    <h2 class="font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-3 mb-4 text-color">Todo lo que necesitas para decisiones de crédito acertadas</h2>
                    <p class="text-lg text-muted-color max-w-2xl mx-auto">Herramientas diseñadas para optimizar cada paso del análisis crediticio</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <!-- Feature 1 -->
                    <article class="bg-surface-50 dark:bg-surface-900 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20">
                        <div class="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                            <i class="pi pi-bolt text-blue-500 text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-3 mt-0 text-color">Análisis Automatizado</h3>
                        <p class="text-muted-color leading-relaxed m-0">Más de 15 indicadores financieros calculados al instante: EBITDA, capacidad de pago, rotación de cartera y más.</p>
                    </article>

                    <!-- Feature 2 -->
                    <article class="bg-surface-50 dark:bg-surface-900 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20">
                        <div class="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-6">
                            <i class="pi pi-chart-pie text-green-500 text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-3 mt-0 text-color">Scoring de Riesgo</h3>
                        <p class="text-muted-color leading-relaxed m-0">Calificación de 0 a 100 con categorización automática: riesgo bajo, moderado o alto para cada estudio.</p>
                    </article>

                    <!-- Feature 3 -->
                    <article class="bg-surface-50 dark:bg-surface-900 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20">
                        <div class="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                            <i class="pi pi-users text-purple-500 text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-3 mt-0 text-color">Gestión de Clientes</h3>
                        <p class="text-muted-color leading-relaxed m-0">Base de datos centralizada con información comercial, referencias y actividad económica de cada cliente.</p>
                    </article>

                    <!-- Feature 4 -->
                    <article class="bg-surface-50 dark:bg-surface-900 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20">
                        <div class="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6">
                            <i class="pi pi-file-excel text-orange-500 text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-3 mt-0 text-color">Reportes Profesionales</h3>
                        <p class="text-muted-color leading-relaxed m-0">Exporta estudios completos a Excel con todos los indicadores y la decisión crediticia para tus archivos.</p>
                    </article>

                    <!-- Feature 5 -->
                    <article class="bg-surface-50 dark:bg-surface-900 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20">
                        <div class="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6">
                            <i class="pi pi-building text-cyan-500 text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-3 mt-0 text-color">Multi-empresa</h3>
                        <p class="text-muted-color leading-relaxed m-0">Gestiona múltiples compañías desde una sola cuenta con usuarios y roles independientes para cada una.</p>
                    </article>

                    <!-- Feature 6 -->
                    <article class="bg-surface-50 dark:bg-surface-900 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/20">
                        <div class="w-14 h-14 rounded-xl bg-pink-500/10 flex items-center justify-center mb-6">
                            <i class="pi pi-chart-bar text-pink-500 text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-3 mt-0 text-color">Dashboard Inteligente</h3>
                        <p class="text-muted-color leading-relaxed m-0">Visualiza el estado de tus clientes, estudios recientes y métricas clave en tiempo real desde un solo lugar.</p>
                    </article>
                </div>
            </div>
        </section>
    `
})
export class FeaturesWidget {}
