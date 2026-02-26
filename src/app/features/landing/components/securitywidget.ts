import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'security-widget',
    template: `
        <section id="security" class="px-6 sm:px-12 lg:px-20 py-16 lg:py-24 bg-surface-0 dark:bg-surface-950">
            <div class="max-w-screen-2xl mx-auto">
                <div class="text-center mb-16">
                    <span class="text-primary font-bold text-sm uppercase tracking-widest">Seguridad</span>
                    <h2 class="font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-3 mb-4 text-color">Tu información financiera está protegida</h2>
                    <p class="text-lg text-muted-color max-w-2xl mx-auto">Cumplimos con los más altos estándares de seguridad y regulaciones colombianas para la protección de datos</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <!-- Encryption -->
                    <div class="text-center group">
                        <div class="w-20 h-20 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                            <i class="pi pi-lock text-green-500 text-3xl"></i>
                        </div>
                        <h3 class="font-bold text-lg mb-2 mt-0 text-color">Cifrado de Datos</h3>
                        <p class="text-muted-color text-sm leading-relaxed m-0">Toda la información se transmite y almacena con cifrado AES-256 de extremo a extremo</p>
                    </div>

                    <!-- Cloud Security -->
                    <div class="text-center group">
                        <div class="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                            <i class="pi pi-cloud text-blue-500 text-3xl"></i>
                        </div>
                        <h3 class="font-bold text-lg mb-2 mt-0 text-color">Infraestructura Cloud</h3>
                        <p class="text-muted-color text-sm leading-relaxed m-0">Servidores seguros con respaldos automáticos diarios y alta disponibilidad garantizada</p>
                    </div>

                    <!-- Habeas Data -->
                    <div class="text-center group">
                        <div class="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                            <i class="pi pi-verified text-purple-500 text-3xl"></i>
                        </div>
                        <h3 class="font-bold text-lg mb-2 mt-0 text-color">Habeas Data</h3>
                        <p class="text-muted-color text-sm leading-relaxed m-0">Cumplimiento total con la Ley 1581 de 2012 y normativas colombianas de protección de datos</p>
                    </div>

                    <!-- Role-based Access -->
                    <div class="text-center group">
                        <div class="w-20 h-20 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                            <i class="pi pi-shield text-orange-500 text-3xl"></i>
                        </div>
                        <h3 class="font-bold text-lg mb-2 mt-0 text-color">Control de Acceso</h3>
                        <p class="text-muted-color text-sm leading-relaxed m-0">Roles y permisos granulares por usuario y empresa para máxima seguridad interna</p>
                    </div>
                </div>
            </div>
        </section>
    `
})
export class SecurityWidget {}
