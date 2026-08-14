import { Component, computed, effect, inject, OnDestroy, signal, untracked } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { HeaderWidget } from '@/app/features/landing/components/header-widget/header-widget';
import { FooterWidget } from '@/app/features/landing/components/footer-widget/footer-widget';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

/*
 * Estudio de ejemplo (/estudio-ejemplo): dos casos 100% ficticios que muestran
 * qué entrega un análisis de CREDIT-IA, con un diseño propio del landing,
 * deliberadamente más simple que el reporte real de la app.
 */

type Tone = 'good' | 'watch' | 'bad';

interface SampleDimension {
    label: string;
    status: string;
    tone: Tone;
    note: string;
}

interface SampleAlert {
    severity: 'danger' | 'warning';
    source: string;
    title: string;
    detail: string;
}

interface SampleCase {
    id: 'conditional' | 'rejected';
    tabLabel: string;
    studyNumber: string;
    clientName: string;
    clientMeta: string;
    requestedAmount: string;
    requestedTerm: string;
    recommendedAmount: string;
    score: number;
    verdict: string;
    tone: 'watch' | 'bad';
    dimensions: SampleDimension[];
    alerts: SampleAlert[];
    aiAnalysis: string[];
    closingIcon: string;
    closingText: string;
}

@Component({
    selector: 'app-sample-study-page',
    standalone: true,
    imports: [RouterModule, ButtonModule, Ripple, HeaderWidget, FooterWidget, ScrollAnimateDirective],
    templateUrl: './sample-study-page.html',
    styles: [
        `
            .case-enter {
                animation: case-enter 500ms ease-out both;
            }

            @keyframes case-enter {
                from {
                    opacity: 0;
                    transform: translateY(14px);
                }
            }

            .score-bar {
                animation: bar-grow 900ms 150ms ease-out both;
            }

            @keyframes bar-grow {
                from {
                    width: 0;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .case-enter,
                .score-bar {
                    animation: none;
                }
            }
        `
    ]
})
export class SampleStudyPage implements OnDestroy {
    private meta = inject(Meta);

    /** Casos ficticios: nombres, NITs y cifras inventados; solo la historia es realista. */
    readonly cases: SampleCase[] = [
        {
            id: 'conditional',
            tabLabel: 'Viable con condiciones',
            studyNumber: 'EC-2026-0187',
            clientName: 'Distribuciones Altavista S.A.S.',
            clientMeta: 'Persona Jurídica · NIT 901.456.783-2 · Comercio mayorista',
            requestedAmount: '$35.000.000',
            requestedTerm: '45 días',
            recommendedAmount: '$18.000.000',
            score: 64,
            verdict: 'Viable con condiciones',
            tone: 'watch',
            dimensions: [
                { label: 'Capacidad de pago', status: 'Holgada', tone: 'good', note: 'El flujo del negocio cubre el pago al vencimiento con margen.' },
                { label: 'Salud financiera', status: 'Sólida', tone: 'good', note: 'Márgenes y endeudamiento en niveles sanos.' },
                { label: 'Historial en centrales', status: 'Con moras', tone: 'bad', note: 'Mora vigente y moras de 60 días en el último año.' },
                { label: 'Veracidad del documento', status: 'No verificable', tone: 'watch', note: 'La central no tiene financieros del cliente para contrastar el PDF.' }
            ],
            alerts: [
                {
                    severity: 'danger',
                    source: 'Documento del cliente',
                    title: 'Devoluciones inusualmente altas',
                    detail: 'Las devoluciones rondan el 40% de las ventas brutas del último año: puede indicar problemas de calidad o ingresos inflados.'
                },
                {
                    severity: 'danger',
                    source: 'Datacrédito Experian',
                    title: 'Saldo en mora vigente',
                    detail: 'El cliente presenta $1.240.000 actualmente en mora con el sector telecomunicaciones.'
                },
                {
                    severity: 'warning',
                    source: 'Datacrédito Experian',
                    title: 'Moras recurrentes de 60 días',
                    detail: 'El comportamiento de pago muestra moras de 60 días durante varios meses del último año.'
                }
            ],
            aiAnalysis: [
                'Distribuciones Altavista muestra una operación sana: la utilidad operativa del último año cubre con holgura el pago al vencimiento y su ciclo de caja soporta el plazo solicitado sin tensión.',
                'Sin embargo, el historial en la central pesa: hay un saldo en mora vigente, moras recurrentes de 60 días y la central no avala capacidad de endeudamiento. Las cifras del PDF tampoco pudieron contrastarse con información independiente.',
                'Se sugiere aprobar con condiciones: reducir el cupo a $18.000.000, exigir el pagaré firmado antes del primer despacho y revisar el comportamiento de pago a los 90 días.'
            ],
            closingIcon: 'pi-verified',
            closingText: 'Con la decisión tomada, el pagaré se firmó en línea. Y si el cliente incumple, puedes reportarlo ante las centrales de riesgo.'
        },
        {
            id: 'rejected',
            tabLabel: 'No viable',
            studyNumber: 'EC-2026-0203',
            clientName: 'Julián Restrepo',
            clientMeta: 'Persona Natural · C.C. 1.023.456.789 · Comerciante independiente',
            requestedAmount: '$20.000.000',
            requestedTerm: '30 días',
            recommendedAmount: '$0',
            score: 28,
            verdict: 'No viable',
            tone: 'bad',
            dimensions: [
                { label: 'Listas restrictivas', status: 'Sin coincidencias', tone: 'good', note: 'El titular no aparece en listas restrictivas.' },
                { label: 'Capacidad de pago', status: 'Insuficiente', tone: 'bad', note: 'Los ingresos estimados no cubren el pago del monto solicitado.' },
                { label: 'Historial en centrales', status: 'Probabilidad de pago baja', tone: 'bad', note: 'La central clasifica al titular en su banda más baja.' },
                { label: 'Información de recaudo', status: 'Insuficiente', tone: 'watch', note: 'Sin historial suficiente para calificar su comportamiento.' }
            ],
            alerts: [
                {
                    severity: 'danger',
                    source: 'Datacrédito Experian',
                    title: 'Ingresos muy por debajo del monto',
                    detail: 'Los ingresos estimados del titular (cerca de $950.000 al mes) no soportan un cupo de $20.000.000.'
                },
                {
                    severity: 'danger',
                    source: 'Datacrédito Experian',
                    title: 'Probabilidad de pago baja',
                    detail: 'La central clasifica al titular como cliente con baja probabilidad de pago.'
                },
                {
                    severity: 'warning',
                    source: 'Datacrédito Experian',
                    title: 'La central avala un cupo mucho menor',
                    detail: 'El monto máximo sugerido por la central es $2.600.000: menos del 15% de lo solicitado.'
                }
            ],
            aiAnalysis: [
                'Los ingresos estimados del titular no soportan el cupo solicitado de $20.000.000: el pago al vencimiento supera por mucho su capacidad mensual, y la central clasifica su probabilidad de pago como baja.',
                'No se recomienda otorgar este crédito. Si decides mantener la relación comercial, considera un cupo dentro del rango avalado por la central ($2.600.000), con codeudor y soporte de ingresos: carta laboral o certificación de contador.'
            ],
            closingIcon: 'pi-shield',
            closingText: 'Este estudio evitó poner en riesgo $20.000.000 en mercancía. Costó una fracción de eso.'
        }
    ];

    /** Anotaciones al margen: qué está viendo el comprador en cada bloque. */
    readonly annotations = [
        { icon: 'pi-chart-line', text: 'El score combina las dimensiones del negocio: capacidad de pago, salud financiera, historial y coherencia del plazo.' },
        { icon: 'pi-flag', text: 'Las alertas cruzan dos fuentes: el documento que entrega tu cliente y Datacrédito Experian.' },
        { icon: 'pi-sparkles', text: 'La recomendación la redacta la IA en lenguaje claro. La decisión final siempre es tuya.' },
        { icon: 'pi-pen-to-square', text: '¿Decides venderle? El pagaré se genera y se firma en línea desde el mismo estudio.' }
    ];

    activeId = signal<'conditional' | 'rejected'>('conditional');
    activeCase = computed(() => this.cases.find((c) => c.id === this.activeId())!);

    /** Score pintado en pantalla: cuenta de 0 al valor del caso activo. */
    displayScore = signal(0);

    private rafId?: number;
    private readonly reduceMotion = typeof matchMedia !== 'undefined'
        && matchMedia('(prefers-reduced-motion: reduce)').matches;

    constructor() {
        this.meta.updateTag({
            name: 'description',
            content: 'Mira un estudio de crédito de ejemplo: score de riesgo, alertas de Datacrédito y del PDF, y la recomendación de la IA. Dos casos ficticios: viable con condiciones y no viable.'
        });

        effect(() => {
            const target = this.activeCase().score;
            untracked(() => this.countScore(target));
        });
    }

    selectCase(id: 'conditional' | 'rejected'): void {
        this.activeId.set(id);
    }

    private countScore(target: number): void {
        if (this.rafId !== undefined) {
            cancelAnimationFrame(this.rafId);
        }
        if (this.reduceMotion) {
            this.displayScore.set(target);
            return;
        }

        this.displayScore.set(0);
        const duration = 800;
        let start: number | null = null;

        const step = (timestamp: number) => {
            start ??= timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            this.displayScore.set(Math.round(eased * target));
            if (progress < 1) {
                this.rafId = requestAnimationFrame(step);
            }
        };
        this.rafId = requestAnimationFrame(step);
    }

    ngOnDestroy(): void {
        if (this.rafId !== undefined) {
            cancelAnimationFrame(this.rafId);
        }
    }
}
