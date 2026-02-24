import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'stats-widget',
    template: `
        <section id="how-it-works" class="px-6 sm:px-12 lg:px-20 py-16 lg:py-24 bg-surface-50 dark:bg-surface-900 max-w-screen-2xl mx-auto">
            <div class="text-center mb-16">
                <span class="text-primary font-bold text-sm uppercase tracking-widest">Proceso simple</span>
                <h2 class="font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-3 mb-4 text-color">¿Cómo funciona?</h2>
                <p class="text-lg text-muted-color max-w-2xl mx-auto">De los datos financieros a una decisión crediticia en cuatro simples pasos</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                <!-- Connector line (desktop only) -->
                <div class="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-linear-to-r from-primary/20 via-primary/40 to-primary/20"></div>

                <!-- Step 1 -->
                <div class="flex flex-col items-center text-center group">
                    <div class="relative z-10 w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <i class="pi pi-user-plus text-white text-2xl"></i>
                        <span class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-surface-0 dark:bg-surface-900 border-2 border-blue-500 text-blue-500 text-xs font-bold flex items-center justify-center">1</span>
                    </div>
                    <h3 class="font-bold text-xl mb-3 text-color mt-0">Registra tu cliente</h3>
                    <p class="text-muted-color leading-relaxed">Agrega la información básica de tu cliente y sus referencias comerciales</p>
                </div>

                <!-- Step 2 -->
                <div class="flex flex-col items-center text-center group">
                    <div class="relative z-10 w-16 h-16 rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <i class="pi pi-file-edit text-white text-2xl"></i>
                        <span class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-surface-0 dark:bg-surface-900 border-2 border-purple-500 text-purple-500 text-xs font-bold flex items-center justify-center">2</span>
                    </div>
                    <h3 class="font-bold text-xl mb-3 text-color mt-0">Ingresa datos financieros</h3>
                    <p class="text-muted-color leading-relaxed">Balance general, estado de resultados y capital de trabajo</p>
                </div>

                <!-- Step 3 -->
                <div class="flex flex-col items-center text-center group">
                    <div class="relative z-10 w-16 h-16 rounded-2xl bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <i class="pi pi-chart-bar text-white text-2xl"></i>
                        <span class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-surface-0 dark:bg-surface-900 border-2 border-orange-500 text-orange-500 text-xs font-bold flex items-center justify-center">3</span>
                    </div>
                    <h3 class="font-bold text-xl mb-3 text-color mt-0">Análisis automático</h3>
                    <p class="text-muted-color leading-relaxed">El sistema calcula +15 indicadores financieros automáticamente</p>
                </div>

                <!-- Step 4 -->
                <div class="flex flex-col items-center text-center group">
                    <div class="relative z-10 w-16 h-16 rounded-2xl bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <i class="pi pi-verified text-white text-2xl"></i>
                        <span class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-surface-0 dark:bg-surface-900 border-2 border-green-500 text-green-500 text-xs font-bold flex items-center justify-center">4</span>
                    </div>
                    <h3 class="font-bold text-xl mb-3 text-color mt-0">Decisión con scoring</h3>
                    <p class="text-muted-color leading-relaxed">Obtén un score de 0-100 con categorización de riesgo automática</p>
                </div>
            </div>
        </section>
    `
})
export class StatsWidget {}
