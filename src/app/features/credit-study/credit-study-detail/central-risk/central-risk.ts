import { Component, computed, input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
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
 * decisión del analista, sin el score numérico). El shape es idéntico en PN y
 * PJ: cada bloque se muestra solo si viene poblado, así que este único mapper
 * sirve para ambos tipos de persona.
 */
@Component({
    selector: 'app-central-risk',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, DatePipe, AccordionModule, TableModule, TooltipModule],
    templateUrl: './central-risk.html'
})
export class CentralRisk {
    centralRisk = input<CustomerCentralRisk | null>(null);

    /** true si hay al menos un bloque de datos que valga la pena mostrar. */
    hasData = computed(() => {
        const cr = this.centralRisk();
        if (!cr) return false;
        return !!(
            cr.alerts?.length ||
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
