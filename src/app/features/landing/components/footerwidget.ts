import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    standalone: true,
    selector: 'footer-widget',
    imports: [RouterModule],
    template: `
        <footer class="bg-gray-900 px-6 sm:px-12 lg:px-20 pt-16 pb-8" style="border-top-left-radius: 14px; border-top-right-radius: 14px">
            <div class="max-w-screen-2xl mx-auto">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    <!-- Brand -->
                    <div>
                        <div class="flex items-center gap-2 mb-4">
                            <img alt="Verona logo" src="/layout/images/logo-light.png" class="w-8 h-8" />
                            <span class="text-white text-2xl font-bold">Verona</span>
                        </div>
                        <p class="text-gray-400 leading-relaxed mb-6">Análisis crediticio inteligente para empresas que buscan tomar decisiones de crédito más rápidas y seguras.</p>
                    </div>

                    <!-- Producto -->
                    <div>
                        <h4 class="text-white font-semibold text-sm uppercase tracking-wide mb-4 mt-0">Producto</h4>
                        <ul class="list-none p-0 m-0 flex flex-col gap-3">
                            <li><a class="cursor-pointer text-gray-400 hover:text-white transition-colors duration-300" (click)="scrollTo('features')">Características</a></li>
                            <li><a class="cursor-pointer text-gray-400 hover:text-white transition-colors duration-300" (click)="scrollTo('how-it-works')">Cómo Funciona</a></li>
                            <li><a class="cursor-pointer text-gray-400 hover:text-white transition-colors duration-300" (click)="scrollTo('pricing')">Planes</a></li>
                        </ul>
                    </div>

                    <!-- Empresa -->
                    <div>
                        <h4 class="text-white font-semibold text-sm uppercase tracking-wide mb-4 mt-0">Legal</h4>
                        <ul class="list-none p-0 m-0 flex flex-col gap-3">
                            <li><a [routerLink]="['/legal/terminos']" class="cursor-pointer text-gray-400 hover:text-white transition-colors duration-300">Términos y Condiciones</a></li>
                            <li><a [routerLink]="['/legal/privacidad']" class="cursor-pointer text-gray-400 hover:text-white transition-colors duration-300">Política de Privacidad</a></li>
                            <li><a [routerLink]="['/legal/habeas-data']" class="cursor-pointer text-gray-400 hover:text-white transition-colors duration-300">Tratamiento de Datos</a></li>
                        </ul>
                    </div>

                    <!-- Contacto -->
                    <div>
                        <h4 class="text-white font-semibold text-sm uppercase tracking-wide mb-4 mt-0">Contacto</h4>
                        <ul class="list-none p-0 m-0 flex flex-col gap-3">
                            <li class="flex items-center gap-2">
                                <i class="pi pi-envelope text-gray-500"></i>
                                <span class="text-gray-400">soporte&#64;verona.app</span>
                            </li>
                            <li class="flex items-center gap-2">
                                <i class="pi pi-map-marker text-gray-500"></i>
                                <span class="text-gray-400">Colombia</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Divider -->
                <div class="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span class="text-gray-500 text-sm">&copy; 2026 Verona. Todos los derechos reservados.</span>
                    <span class="text-gray-500 text-sm">Hecho con &hearts; en Colombia &#x1F1E8;&#x1F1F4;</span>
                </div>
            </div>
        </footer>
    `
})
export class FooterWidget {
    scrollTo(id: string) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
