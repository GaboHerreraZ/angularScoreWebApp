import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'testimonials-widget',
    template: `
        <section id="testimonials" class="px-6 sm:px-12 lg:px-20 py-16 lg:py-24 bg-surface-50 dark:bg-surface-900">
            <div class="max-w-screen-2xl mx-auto">
                <div class="text-center mb-16">
                    <span class="text-primary font-bold text-sm uppercase tracking-widest">Testimonios</span>
                    <h2 class="font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-3 mb-4 text-color">Lo que dicen nuestros clientes</h2>
                    <p class="text-lg text-muted-color max-w-2xl mx-auto">Empresas en Colombia ya confían en Verona para sus decisiones crediticias</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <!-- Testimonial 1 -->
                    <article class="bg-surface-0 dark:bg-surface-950 rounded-2xl p-8 border border-surface hover:shadow-lg transition-all duration-300">
                        <div class="flex items-center gap-1 mb-4">
                            @for (star of [1,2,3,4,5]; track star) {
                            <i class="pi pi-star-fill text-yellow-500 text-sm"></i>
                            }
                        </div>
                        <p class="text-color leading-relaxed mb-6 italic">"Redujimos el tiempo de análisis crediticio de 2 días a 15 minutos. Los indicadores automáticos nos dan una visión completa del riesgo financiero de cada cliente."</p>
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <span class="text-blue-500 font-bold text-lg">CM</span>
                            </div>
                            <div>
                                <div class="font-bold text-color">Carlos Mendoza</div>
                                <div class="text-sm text-muted-color">Director Financiero — Distribuidora del Valle</div>
                            </div>
                        </div>
                    </article>

                    <!-- Testimonial 2 -->
                    <article class="bg-surface-0 dark:bg-surface-950 rounded-2xl p-8 border border-surface hover:shadow-lg transition-all duration-300">
                        <div class="flex items-center gap-1 mb-4">
                            @for (star of [1,2,3,4,5]; track star) {
                            <i class="pi pi-star-fill text-yellow-500 text-sm"></i>
                            }
                        </div>
                        <p class="text-color leading-relaxed mb-6 italic">"El scoring de riesgo nos permite tomar decisiones objetivas y respaldadas por datos. Hemos reducido la cartera vencida en un 35% desde que implementamos Verona."</p>
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <span class="text-green-500 font-bold text-lg">LP</span>
                            </div>
                            <div>
                                <div class="font-bold text-color">Laura Pineda</div>
                                <div class="text-sm text-muted-color">Gerente de Crédito — Materiales Andinos S.A.</div>
                            </div>
                        </div>
                    </article>

                    <!-- Testimonial 3 -->
                    <article class="bg-surface-0 dark:bg-surface-950 rounded-2xl p-8 border border-surface hover:shadow-lg transition-all duration-300">
                        <div class="flex items-center gap-1 mb-4">
                            @for (star of [1,2,3,4,5]; track star) {
                            <i class="pi pi-star-fill text-yellow-500 text-sm"></i>
                            }
                        </div>
                        <p class="text-color leading-relaxed mb-6 italic">"Manejamos 3 empresas desde una sola cuenta. Los reportes en Excel y el dashboard avanzado nos dan control total sobre toda nuestra operación crediticia."</p>
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <span class="text-purple-500 font-bold text-lg">AR</span>
                            </div>
                            <div>
                                <div class="font-bold text-color">Andrés Restrepo</div>
                                <div class="text-sm text-muted-color">CEO — Grupo Inversiones Antioquia</div>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    `
})
export class TestimonialsWidget {}
