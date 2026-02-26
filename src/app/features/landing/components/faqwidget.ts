import { Component } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';

@Component({
    standalone: true,
    selector: 'faq-widget',
    imports: [AccordionModule],
    template: `
        <section id="faq" class="px-6 sm:px-12 lg:px-20 py-16 lg:py-24 bg-surface-0 dark:bg-surface-950">
            <div class="max-w-3xl mx-auto">
                <div class="text-center mb-16">
                    <span class="text-primary font-bold text-sm uppercase tracking-widest">FAQ</span>
                    <h2 class="font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-3 mb-4 text-color">Preguntas frecuentes</h2>
                    <p class="text-lg text-muted-color max-w-2xl mx-auto">Resuelve tus dudas sobre la plataforma</p>
                </div>

                <p-accordion [multiple]="true" expandIcon="pi pi-plus" collapseIcon="pi pi-minus">
                    <p-accordion-panel value="0">
                        <p-accordion-header>¿Qué es Verona y para quién está diseñado?</p-accordion-header>
                        <p-accordion-content>
                            <p class="text-muted-color leading-relaxed m-0">
                                Verona es una plataforma de análisis crediticio diseñada para empresas colombianas que otorgan crédito a sus clientes.
                                Está pensada para directores financieros, analistas de crédito y gerentes que necesitan evaluar el riesgo financiero
                                de forma rápida y objetiva con más de 15 indicadores calculados automáticamente.
                            </p>
                        </p-accordion-content>
                    </p-accordion-panel>

                    <p-accordion-panel value="1">
                        <p-accordion-header>¿Cómo funciona el scoring de riesgo?</p-accordion-header>
                        <p-accordion-content>
                            <p class="text-muted-color leading-relaxed m-0">
                                Nuestro sistema analiza los estados financieros del cliente (balance general, estado de resultados y capital de trabajo)
                                y calcula automáticamente indicadores como EBITDA, capacidad de pago, rotación de cartera, nivel de endeudamiento y más.
                                Con estos datos genera un score de 0 a 100 que clasifica el riesgo como bajo, moderado o alto.
                            </p>
                        </p-accordion-content>
                    </p-accordion-panel>

                    <p-accordion-panel value="2">
                        <p-accordion-header>¿Mis datos financieros están seguros?</p-accordion-header>
                        <p-accordion-content>
                            <p class="text-muted-color leading-relaxed m-0">
                                Absolutamente. Utilizamos cifrado AES-256, infraestructura cloud con respaldos automáticos diarios y cumplimos
                                con la Ley 1581 de 2012 (Habeas Data) de Colombia. Además, cada empresa tiene control de acceso por roles
                                para que solo las personas autorizadas vean la información.
                            </p>
                        </p-accordion-content>
                    </p-accordion-panel>

                    <p-accordion-panel value="3">
                        <p-accordion-header>¿Puedo usar Verona gratis?</p-accordion-header>
                        <p-accordion-content>
                            <p class="text-muted-color leading-relaxed m-0">
                                Sí. Nuestro plan Básico es completamente gratuito e incluye hasta 2 usuarios, 50 clientes y 10 estudios de crédito
                                por mes. Es ideal para comenzar a explorar la plataforma. Cuando necesites más capacidad, puedes actualizar
                                a un plan superior en cualquier momento.
                            </p>
                        </p-accordion-content>
                    </p-accordion-panel>

                    <p-accordion-panel value="4">
                        <p-accordion-header>¿Puedo gestionar varias empresas desde una cuenta?</p-accordion-header>
                        <p-accordion-content>
                            <p class="text-muted-color leading-relaxed m-0">
                                Sí. Los planes Profesional y Empresarial permiten gestionar múltiples empresas desde una sola cuenta.
                                Cada empresa tiene sus propios usuarios, roles, clientes y estudios de crédito independientes, lo que facilita
                                la administración de grupos empresariales.
                            </p>
                        </p-accordion-content>
                    </p-accordion-panel>

                    <p-accordion-panel value="5">
                        <p-accordion-header>¿Qué tipo de reportes puedo generar?</p-accordion-header>
                        <p-accordion-content>
                            <p class="text-muted-color leading-relaxed m-0">
                                Puedes exportar estudios de crédito completos a Excel con todos los indicadores financieros, la calificación de riesgo
                                y la decisión crediticia. Además, el dashboard muestra métricas en tiempo real como distribución de riesgo,
                                tendencias de capacidad de pago, estructura de deuda y más.
                            </p>
                        </p-accordion-content>
                    </p-accordion-panel>

                    <p-accordion-panel value="6">
                        <p-accordion-header>¿Puedo cambiar de plan en cualquier momento?</p-accordion-header>
                        <p-accordion-content>
                            <p class="text-muted-color leading-relaxed m-0">
                                Sí. Puedes actualizar o cambiar tu plan en cualquier momento desde la sección de Administración.
                                Los cambios se aplican de inmediato y el cobro se ajusta proporcionalmente al tiempo restante de tu ciclo de facturación.
                            </p>
                        </p-accordion-content>
                    </p-accordion-panel>
                </p-accordion>
            </div>
        </section>
    `
})
export class FaqWidget {}
