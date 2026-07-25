import { Component, computed, input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { CentralRiskLinkNode, CustomerCentralRisk } from '@/app/types/credit-study';

/** Fila aplanada de la red de vínculos económicos, con profundidad para indentar. */
interface LinkNetworkRow {
    node: CentralRiskLinkNode;
    depth: number;
}

/**
 * Resumen del comportamiento del cliente en la central de riesgo (apoyo a la
 * decisión del analista, con el score de la central destacado). El shape es
 * idéntico en PN y PJ: cada bloque se muestra solo si viene poblado, así que
 * este único mapper sirve para ambos tipos de persona.
 */
@Component({
    selector: 'app-central-risk',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, AccordionModule, TableModule, TooltipModule],
    templateUrl: './central-risk.html'
})
export class CentralRisk {
    centralRisk = input<CustomerCentralRisk | null>(null);

    /** true si hay al menos un bloque de datos que valga la pena mostrar. */
    hasData = computed(() => {
        const cr = this.centralRisk();
        if (!cr) return false;
        return !!(
            cr.score != null ||
            cr.alerts?.length ||
            cr.suggestions?.length ||
            cr.viabilidad?.label ||
            cr.ratingRecaudos?.label ||
            cr.nivelRiesgo?.label ||
            cr.ratingSectorial?.label ||
            cr.indebtedness ||
            cr.income ||
            cr.paymentBehavior?.length ||
            cr.creditSectors?.length ||
            cr.creditPortfolio?.length ||
            cr.linkNetwork
        );
    });

    /** Grupos de sugerencias de la central con contenido real (título o ítems). */
    suggestions = computed(() => (this.centralRisk()?.suggestions ?? []).filter(s => s?.title || s?.items?.length));

    /**
     * Clases de color del score de la central. Rangos heurísticos solo para la
     * visualización (no son política de crédito): ≥700 favorable, 500-699
     * intermedio, <500 desfavorable.
     */
    scoreConfig = computed(() => {
        const score = this.centralRisk()?.score;
        if (score == null) return null;
        if (score >= 700) {
            return {
                label: 'Puntaje favorable',
                text: 'text-green-700 dark:text-green-400',
                ring: 'border-green-500',
                panel: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                chip: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            };
        }
        if (score >= 500) {
            return {
                label: 'Puntaje intermedio',
                text: 'text-amber-700 dark:text-amber-400',
                ring: 'border-amber-500',
                panel: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
                chip: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            };
        }
        return {
            label: 'Puntaje bajo',
            text: 'text-red-700 dark:text-red-400',
            ring: 'border-red-500',
            panel: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            chip: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        };
    });

    /** Alertas directas sobre el titular consultado (pesan en la decisión). */
    selfAlerts = computed(() => (this.centralRisk()?.alerts ?? []).filter(a => a.source === 'self'));
    /** Alertas sobre entidades vinculadas (riesgo de contagio del grupo). */
    linkedAlerts = computed(() => (this.centralRisk()?.alerts ?? []).filter(a => a.source === 'linked'));

    /** Red de vínculos aplanada (root + descendientes) con su profundidad. */
    linkNetworkRows = computed<LinkNetworkRow[]>(() => {
        const root = this.centralRisk()?.linkNetwork;
        if (!root) return [];
        const rows: LinkNetworkRow[] = [];
        const walk = (node: CentralRiskLinkNode, depth: number) => {
            rows.push({ node, depth });
            (node.children ?? []).forEach(child => walk(child, depth + 1));
        };
        walk(root, 0);
        return rows;
    });

    /** Clases de color del chip de comportamiento mensual según el código de mora. */
    paymentBehaviorConfig(code: string): { bg: string; text: string; dot: string } {
        const c = (code ?? '').toUpperCase();
        // Al día
        if (c === 'N' || c === '0') {
            return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' };
        }
        // Mora temprana (1-30 días)
        if (c === '1') {
            return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' };
        }
        // Sin información
        if (c === '' || c === '-' || c === 'S') {
            return { bg: 'bg-surface-100 dark:bg-surface-800', text: 'text-muted-color', dot: 'bg-surface-400' };
        }
        // Mora avanzada (2+)
        return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };
    }

    /** Etiqueta corta del mes (MM/AA) para el vector de comportamiento. */
    formatBehaviorMonth(anioMes: string): string {
        if (!anioMes) return '—';
        const [year, month] = anioMes.split('-');
        return month && year ? `${month}/${year.slice(-2)}` : anioMes;
    }

    /** Convierte a número los montos que la central envía como string. */
    toNumber(value: string | null): number | null {
        if (value == null || value === '') return null;
        const n = Number(value);
        return isNaN(n) ? null : n;
    }
}
