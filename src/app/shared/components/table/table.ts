import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableAction, TableActionEvent, TableColumn, TableSettings, TablePageChangeEvent, TableSearchEvent, TagSeverity } from '@/app/types/table';

@Component({
    selector: 'app-custom-table',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, TagModule, SelectModule, InputTextModule, IconFieldModule, InputIconModule, ButtonModule, TooltipModule],
    templateUrl: './table.html'
})
export class CustomTable {
    tableSettings = input.required<TableSettings>();
    data = input<any[]>([]);
    totalRecords = input<number>(0);
    loading = input<boolean>(false);

    pageChange = output<TablePageChangeEvent>();
    search = output<TableSearchEvent>();
    actionClick = output<TableActionEvent>();
    addClick = output<void>();
    exportClick = output<void>();

    searchValue = signal<string>('');

    columns = computed(() => this.tableSettings().columns);
    dataKey = computed(() => this.tableSettings().dataKey ?? 'id');
    rows = computed(() => this.tableSettings().rows ?? 10);
    rowsPerPageOptions = computed(() => this.tableSettings().rowsPerPageOptions ?? [10, 25, 50]);
    showGridlines = computed(() => this.tableSettings().showGridlines ?? true);
    rowHover = computed(() => this.tableSettings().rowHover ?? true);
    searchPlaceholder = computed(() => this.tableSettings().searchPlaceholder ?? 'Buscar...');
    emptyMessage = computed(() => this.tableSettings().emptyMessage ?? 'No se encontraron registros.');
    emptyState = computed(() => this.tableSettings().emptyState ?? null);
    hasActiveSearch = computed(() => this.searchValue().trim().length > 0);
    loadingMessage = computed(() => this.tableSettings().loadingMessage ?? 'Cargando datos. Por favor espere.');
    title = computed(() => this.tableSettings().title ?? null);
    titleIcon = computed(() => this.tableSettings().titleIcon ?? null);
    showSearch = computed(() => this.tableSettings().showSearch ?? true);
    showColumnFilters = computed(() => this.tableSettings().showColumnFilters ?? true);

    actions = computed(() => this.tableSettings().actions ?? []);
    actionsHeader = computed(() => this.tableSettings().actionsHeader ?? 'Acciones');
    addButton = computed(() => this.tableSettings().addButton ?? null);
    exportButton = computed(() => this.tableSettings().exportButton ?? null);
    hasActions = computed(() => this.actions().length > 0);
    totalColumns = computed(() => this.columns().length + (this.hasActions() ? 1 : 0));

    /** Encabeza la tarjeta de móvil; el resto de columnas van como etiqueta/valor. */
    primaryColumn = computed<TableColumn | null>(() => this.columns()[0] ?? null);
    secondaryColumns = computed(() => this.columns().slice(1));

    globalFilterFields = computed(() => this.columns().map((col) => col.textField ?? col.field));

    resolveField(row: any, field: string): any {
        return field.split('.').reduce((obj, key) => (obj != null ? obj[key] : undefined), row);
    }

    getSeverity(value: string, col: TableColumn): TagSeverity {
        if (!col.severityMap) return col.defaultSeverity ?? 'info';
        const key = value?.toLowerCase?.() ?? '';
        return col.severityMap[value] ?? col.severityMap[key] ?? col.defaultSeverity ?? 'info';
    }

    // ── Score: anillo de progreso ─────────────────────────────────────
    /** Valor numérico del score, o null si la fila aún no tiene resultado. */
    getScoreValue(row: any, col: TableColumn): number | null {
        const raw = this.resolveField(row, col.field);
        return typeof raw === 'number' && !Number.isNaN(raw) ? raw : null;
    }

    /** Porcentaje (0-100) que llena el anillo, según el máximo de la escala. */
    getScorePercent(row: any, col: TableColumn): number {
        const value = this.getScoreValue(row, col);
        if (value == null) return 0;
        const max = col.scoreMax ?? 100;
        if (max <= 0) return 0;
        return Math.max(0, Math.min(100, (value / max) * 100));
    }

    /** Etiqueta opcional junto al anillo (p. ej. el statusLabel de viabilidad). */
    getScoreLabel(row: any, col: TableColumn): string | null {
        if (!col.scoreLabelField) return null;
        return this.resolveField(row, col.scoreLabelField) ?? null;
    }

    /** Colores del anillo y del número según la banda en la que cae el score. */
    getScoreClasses(row: any, col: TableColumn): { ring: string; text: string } {
        if (this.getScoreValue(row, col) == null) {
            return { ring: 'stroke-surface-300 dark:stroke-surface-600', text: 'text-surface-400' };
        }
        const percent = this.getScorePercent(row, col);
        if (percent >= 70) return { ring: 'stroke-green-500', text: 'text-green-600 dark:text-green-400' };
        if (percent >= 40) return { ring: 'stroke-amber-500', text: 'text-amber-600 dark:text-amber-400' };
        return { ring: 'stroke-red-500', text: 'text-red-500 dark:text-red-400' };
    }

    getImageSrc(row: any, col: TableColumn): string {
        if (col.imageDynamicClass) {
            return col.imagePrefix ?? '';
        }
        if (!col.imageField) return '';
        const raw = this.resolveField(row, col.imageField) ?? '';
        const prefix = col.imagePrefix ?? '';
        const suffix = col.imageSuffix ?? '';
        return `${prefix}${raw}${suffix}`;
    }

    getImageClass(row: any, col: TableColumn): string {
        if (!col.imageClass) return '';
        if (col.imageDynamicClass && col.imageField) {
            return col.imageClass + this.resolveField(row, col.imageField);
        }
        return col.imageClass;
    }

    getImageText(row: any, col: TableColumn): string {
        if (!col.textField) return '';
        return this.resolveField(row, col.textField) ?? '';
    }

    onPageChange(event: { first: number; rows: number }): void {
        this.pageChange.emit({
            first: event.first,
            rows: event.rows,
            page: Math.floor(event.first / event.rows) + 1
        });
    }

    onAddClick(): void {
        this.addClick.emit();
    }

    onExportClick(): void {
        this.exportClick.emit();
    }

    onAction(action: TableAction, row: any): void {
        this.actionClick.emit({ action: action.id, row });
    }

    onGlobalFilter(table: Table, event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchValue.set(value);
        table.filterGlobal(value, 'contains');
        this.search.emit({ query: value });
    }

    clearSearch(table: Table): void {
        this.searchValue.set('');
        table.clear();
        this.search.emit({ query: '' });
    }

    onEmptyStateAction(): void {
        this.addClick.emit();
    }
}
