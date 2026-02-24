import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { Ripple } from 'primeng/ripple';

@Component({
    standalone: true,
    selector: 'join-widget',
    imports: [ButtonModule, RouterModule, Ripple],
    template: `
        <section class="px-6 sm:px-12 lg:px-20 py-16 lg:py-24 bg-linear-to-r from-primary to-primary-emphasis text-white">
            <div class="max-w-screen-2xl mx-auto">
                <!-- Impact numbers -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
                    <div class="text-center">
                        <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mb-4">
                            <i class="pi pi-file-check text-2xl text-white"></i>
                        </div>
                        <div class="text-5xl font-extrabold mb-2">500+</div>
                        <div class="text-lg text-white/80">Estudios procesados</div>
                    </div>
                    <div class="text-center">
                        <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mb-4">
                            <i class="pi pi-verified text-2xl text-white"></i>
                        </div>
                        <div class="text-5xl font-extrabold mb-2">98%</div>
                        <div class="text-lg text-white/80">Precisión en análisis</div>
                    </div>
                    <div class="text-center">
                        <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mb-4">
                            <i class="pi pi-clock text-2xl text-white"></i>
                        </div>
                        <div class="text-5xl font-extrabold mb-2">24/7</div>
                        <div class="text-lg text-white/80">Plataforma disponible</div>
                    </div>
                </div>

                <!-- CTA -->
                <div class="text-center">
                    <h2 class="font-extrabold text-3xl sm:text-4xl mt-0 mb-6">Optimiza tu análisis crediticio hoy</h2>
                    <p class="text-lg text-white/80 mb-8 max-w-xl mx-auto">Únete a las empresas que ya toman decisiones de crédito más inteligentes y rápidas.</p>
                    <a [routerLink]="['/auth/iniciar-sesion']">
                        <button pButton pRipple label="Comenzar Gratis" icon="pi pi-arrow-right" iconPos="right" rounded class="bg-white! text-primary! hover:bg-white/90! text-lg px-8 py-3 font-bold"></button>
                    </a>
                    <p class="text-sm text-white/60 mt-4 mb-0">Sin tarjeta de crédito &middot; Configuración en minutos</p>
                </div>
            </div>
        </section>
    `
})
export class JoinWidget {}
