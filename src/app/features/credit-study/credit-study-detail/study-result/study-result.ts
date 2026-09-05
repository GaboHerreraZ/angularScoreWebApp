import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import {
    CustomerCentralRisk,
    PerformStudyResponse,
    ReliabilityFlag,
    ScoringDimension,
    StudyAiAnalysis
} from '@/app/types/credit-study';
import { CreditStudyService } from '../../credit-study.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { AuthService } from '@/app/core/services/auth.service';
import { CentralRisk } from '../central-risk/central-risk';
import { DateOnlyPipe } from '@/app/shared/pipes/date-only.pipe';

interface DimensionView extends ScoringDimension {
    key: string;
    /** Puntaje relativo 0-1 usado para barra y badge: contribution / weight. */
    fillRatio: number;
}

@Component({
    selector: 'app-study-result',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, DatePipe, CardModule, MessageModule, ButtonModule, AccordionModule, ConfirmDialogModule, CentralRisk, DateOnlyPipe],
    providers: [ConfirmationService],
    templateUrl: './study-result.html'
})
export class StudyResult {
    private destroyRef = inject(DestroyRef);
    private creditStudyService = inject(CreditStudyService);
    private notificationService = inject(NotificationService);
    private confirmationService = inject(ConfirmationService);
    private authService = inject(AuthService);

    study = input.required<PerformStudyResponse>();
    creditStudyId = input<string>();
    /** Plazo solicitado por el cliente (viene del step de la solicitud). */
    requestedTerm = input<number | null>(null);
    customer = input<{ businessName?: string; identificationNumber?: string; city?: string }>();
    companyInfo = input<{ name: string; city: string; nit: string }>();
    readOnly = input<boolean>(false);
    /** Snapshot de la central de riesgo (apoyo a la decisión, sin score numérico). */
    centralRisk = input<CustomerCentralRisk | null>(null);

    /** Plazo solicitado resuelto: el input o el que traiga el estudio. */
    requestedTermValue = computed(() => this.requestedTerm() ?? this.study().requestedTerm ?? null);

    // ─── IA (solo un análisis por estudio) ───────────────────────────────────

    aiLoading = signal(false);
    /** Análisis generado en esta sesión (antes del refresh). */
    private generatedAnalysis = signal<StudyAiAnalysis | null>(null);
    /** Marca un error al generar para mostrar el estado de reintento. */
    aiError = signal(false);

    canUseAi = computed(() => this.authService.currentProfile()?.permissions.canMakeAiAnalysis);

    /** Análisis actual: el recién generado o el que ya viene con el estudio. */
    currentAiAnalysis = computed<StudyAiAnalysis | null>(() => {
        const generated = this.generatedAnalysis();
        if (generated) return generated;
        const embedded = this.study().aiAnalysis;
        return embedded && embedded.result?.trim() ? embedded : null;
    });

    hasAiAnalysis = computed(() => !!this.currentAiAnalysis());

    // ─── Scoring result ──────────────────────────────────────────────────────

    scoring = computed(() => this.study().result ?? null);
    summary = computed(() => this.scoring()?.summary ?? null);
    approvedCreditLine = computed(() => this.scoring()?.approvedCreditLine ?? null);
    reference = computed(() => this.scoring()?.reference ?? null);

    /** Si las cifras del análisis fueron verificadas contra la central. */
    financialsVerified = computed(() => this.summary()?.financialsVerified ?? false);

    /**
     * Cifras del estudio de capacidad de pago. Su presencia distingue los dos
     * productos: el resto de la pantalla (veredicto, dimensiones, alertas,
     * central, IA) es idéntico, solo cambian las cifras y los textos de fuente.
     */
    capacityFigures = computed(() => this.scoring()?.capacityFigures ?? null);
    isCapacityStudy = computed(() => !!this.capacityFigures());

    /**
     * Badge de verificación mostrado junto al veredicto: recuerda que un "Viable"
     * calculado sobre cifras sin verificar no equivale a uno sobre DataCrédito.
     */
    verificationConfig = computed(() => {
        if (!this.summary()) return null;
        return this.financialsVerified()
            ? { label: 'Cifras verificadas', icon: 'pi pi-verified', bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-700 dark:text-green-400' }
            : { label: 'Cifras sin verificar', icon: 'pi pi-exclamation-circle', bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-700 dark:text-amber-400' };
    });

    /** Badge de la fuente del cálculo, resaltado en la sección de cifras clave. */
    calculationSourceConfig = computed(() => {
        if (this.isCapacityStudy()) {
            return { label: 'Extractos y soportes de ingreso', icon: 'pi pi-building-columns', bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-700 dark:text-green-400' };
        }
        switch (this.summary()?.calculationSource) {
            case 'datacredito':
                return { label: 'Central de riesgo', icon: 'pi pi-verified', bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-700 dark:text-green-400' };
            case 'pdf':
                return { label: 'Estados financieros cargados (sin verificar)', icon: 'pi pi-file', bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-700 dark:text-amber-400' };
            case 'none':
                return { label: 'Sin datos financieros', icon: 'pi pi-ban', bg: 'bg-surface-100 dark:bg-surface-800', color: 'text-muted-color' };
            default:
                return null;
        }
    });

    /** Cifras financieras clave formateadas para mostrar bajo el banner. */
    private readonly keyFigureRows: { key: string; label: string; format: 'currency' | 'days' | 'ratio' }[] = [
        { key: 'monthlyPaymentCapacity', label: 'Capacidad de pago mensual', format: 'currency' },
        { key: 'estimatedMonthlyQuota', label: 'Cuota mensual estimada', format: 'currency' },
        { key: 'annualPaymentCapacity', label: 'Capacidad de pago anual', format: 'currency' },
        { key: 'ebitda', label: 'EBITDA', format: 'currency' },
        { key: 'currentDebtService', label: 'Servicio de deuda actual', format: 'currency' },
        { key: 'paymentCoverageRatio', label: 'Cobertura de pago', format: 'ratio' },
        { key: 'stabilityFactor', label: 'Factor de estabilidad', format: 'ratio' },
        { key: 'accountsReceivableTurnover', label: 'Rotación de cartera', format: 'days' },
        { key: 'inventoryTurnover', label: 'Rotación de inventario', format: 'days' },
        { key: 'paymentTimeSuppliers', label: 'Pago a proveedores', format: 'days' },
        { key: 'cashConversionCycle', label: 'Ciclo de conversión de caja', format: 'days' }
    ];

    keyFigures = computed(() => {
        if (this.isCapacityStudy()) return this.capacityKeyFigures();

        const figures = this.scoring()?.keyFigures;
        if (!figures) return [];
        return this.keyFigureRows
            .filter(row => figures[row.key] != null)
            .map(row => ({ label: row.label, value: this.formatKeyFigure(figures[row.key]!, row.format) }));
    });

    /**
     * Cifras del estudio de capacidad. No se reutilizan las del flujo con EEFF
     * porque allí no hay EBITDA ni rotaciones: el motor las devuelve en cero y
     * mostrarlas confundiría al analista.
     */
    private capacityKeyFigures(): { label: string; value: string }[] {
        const cf = this.capacityFigures();
        if (!cf) return [];

        const money = (v: number | null) => v == null ? '—' : this.formatKeyFigure(v, 'currency');
        const percent = (v: number | null) => v == null ? '—' : `${Math.round(v * 100)}%`;

        const rows: { label: string; value: string }[] = [
            { label: 'Ingreso mensual verificado', value: money(cf.verifiedMonthlyIncome) }
        ];
        if (cf.payrollNetIncome != null) {
            rows.push({ label: 'Neto de nómina (desprendible)', value: money(cf.payrollNetIncome) });
        }
        rows.push({ label: 'Ingreso según extractos', value: money(cf.bankStatementIncome) });
        if (cf.incomeVerificationIndex != null) {
            rows.push({ label: 'Verificación nómina vs. cuenta', value: percent(cf.incomeVerificationIndex) });
        }
        rows.push(
            { label: 'Compromisos fijos mensuales', value: `${money(cf.recurringFixedExpenses)}/mes` },
            { label: 'Cuotas de crédito', value: `${money(cf.debtServicePayments)}/mes` },
            { label: 'Pago de tarjetas', value: `${money(cf.cardPayments)}/mes` },
            { label: 'Total obligaciones', value: `${money(cf.existingDebtPayments)}/mes` },
            { label: 'Ingreso disponible', value: `${money(cf.availableIncome)}/mes` },
            { label: 'Costo de vida observado', value: `${money(cf.livingCost)}/mes` },
            { label: 'Cuota máxima sostenible', value: `${money(cf.maxSuggestedInstallment)}/mes` }
        );
        if (cf.minInstallmentsForRequested != null) {
            rows.push({
                label: 'Cuotas mínimas para lo solicitado',
                value: `${cf.minInstallmentsForRequested} (sin intereses)`
            });
        }
        rows.push({ label: 'Endeudamiento actual (sin tarjetas)', value: percent(cf.currentDti) });
        if (cf.payrollLoanCapacity != null) {
            rows.push({ label: 'Cupo de libranza (Ley 1527)', value: money(cf.payrollLoanCapacity) });
        }
        rows.push(
            { label: 'Variación del ingreso', value: percent(cf.incomeCv) },
            { label: 'Meses con ingreso', value: `${cf.monthsWithIncome} de ${cf.coveredMonths}` }
        );
        return rows;
    }

    private formatKeyFigure(value: number, format: 'currency' | 'days' | 'ratio'): string {
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
            case 'days':
                return `${Math.round(value).toLocaleString('es-CO')} días`;
            case 'ratio':
                return value.toLocaleString('es-CO', { maximumFractionDigits: 2 });
        }
    }

    /** Montos del banner/resumen resueltos con fallback al estudio. */
    requestedAmount = computed(() => this.approvedCreditLine()?.requested ?? this.study().requestedCreditLine ?? null);
    approvedAmount = computed(() => this.approvedCreditLine()?.amount ?? this.study().recommendedCreditLine ?? null);
    bureauSuggestedAmount = computed(() => this.reference()?.experianSuggestedAmount ?? null);
    cappedByBureau = computed(() => this.approvedCreditLine()?.cappedByBureau ?? false);

    scorePercentage = computed(() => this.summary()?.totalScore ?? this.study().viabilityScore ?? 0);
    maxScore = computed(() => this.summary()?.maxScore ?? 100);
    viabilityStatus = computed(() => this.summary()?.status ?? this.study().viabilityStatus ?? 'pending');

    statusConfig = computed(() => {
        switch (this.viabilityStatus()) {
            case 'approved':
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-200 dark:border-green-800',
                    iconBg: 'bg-green-500',
                    icon: 'pi pi-check-circle',
                    titleColor: 'text-green-700 dark:text-green-400',
                    title: 'Viable',
                    description: 'El análisis indica que el cliente es apto para el cupo solicitado. La decisión final de otorgamiento es de su empresa.'
                };
            case 'conditional':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    border: 'border-amber-200 dark:border-amber-800',
                    iconBg: 'bg-amber-500',
                    icon: 'pi pi-exclamation-triangle',
                    titleColor: 'text-amber-700 dark:text-amber-400',
                    title: 'Viable con condiciones',
                    description: 'El cliente es apto sujeto a las condiciones señaladas. Revíselas antes de otorgar el cupo.'
                };
            case 'rejected':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-200 dark:border-red-800',
                    iconBg: 'bg-red-500',
                    icon: 'pi pi-times-circle',
                    titleColor: 'text-red-700 dark:text-red-400',
                    title: 'No viable',
                    description: 'El análisis no respalda el cupo solicitado bajo las condiciones actuales.'
                };
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-gray-900/20',
                    border: 'border-gray-200 dark:border-gray-800',
                    iconBg: 'bg-gray-500',
                    icon: 'pi pi-info-circle',
                    titleColor: 'text-gray-700 dark:text-gray-400',
                    title: 'Pendiente',
                    description: 'El estudio aún no ha sido procesado.'
                };
        }
    });

    /** Etiqueta legible de la fuente del cálculo para el resumen. */
    calculationSourceLabel = computed(() => {
        if (this.isCapacityStudy()) return 'Extractos y soportes de ingreso';
        switch (this.summary()?.calculationSource) {
            case 'datacredito': return 'Central de riesgo';
            case 'pdf': return 'Documento cargado';
            case 'none': return 'Sin datos';
            default: return null;
        }
    });

    // ─── Dimensiones (solo evaluables) ───────────────────────────────────────

    dimensions = computed<DimensionView[]>(() => {
        const dims = this.scoring()?.dimensions;
        if (!dims) return [];
        return Object.entries(dims)
            .filter(([, dim]) => dim.evaluable)
            .map(([key, dim]) => ({
                ...dim,
                key,
                fillRatio: dim.weight > 0 ? Math.max(0, Math.min(1, dim.contribution / dim.weight)) : 0
            }));
    });

    // ─── Dos capas de red flags ──────────────────────────────────────────────

    private groupBySeverity(flags: ReliabilityFlag[]) {
        const severities: ReliabilityFlag['severity'][] = ['danger', 'warning', 'info'];
        return severities
            .map(severity => ({ severity, flags: flags.filter(f => f.severity === severity) }))
            .filter(group => group.flags.length > 0);
    }

    /** Capa 1: fiabilidad del documento (PDF contra sí mismo). */
    pdfReliabilityGroups = computed(() => this.groupBySeverity(this.scoring()?.pdfReliabilityFlags ?? []));
    pdfReliabilityCount = computed(() => this.scoring()?.pdfReliabilityFlags?.length ?? 0);

    /** Capa 2: señales de la central de riesgo. */
    centralRiskGroups = computed(() => this.groupBySeverity(this.scoring()?.centralRiskFlags ?? []));
    centralRiskCount = computed(() => this.scoring()?.centralRiskFlags?.length ?? 0);

    /** Todas las alertas del motor de scoring (recomendaciones por dimensión). */
    generalAlerts = computed(() => this.scoring()?.alerts ?? []);

    private readonly alertGroupMeta: Record<string, { label: string; icon: string; iconColor: string; bg: string; border: string; badgeBg: string; badgeColor: string }> = {
        danger: {
            label: 'Críticas', icon: 'pi pi-times-circle', iconColor: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800',
            badgeBg: 'bg-red-100 dark:bg-red-900/30', badgeColor: 'text-red-700 dark:text-red-400'
        },
        warning: {
            label: 'Advertencias', icon: 'pi pi-exclamation-triangle', iconColor: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800',
            badgeBg: 'bg-amber-100 dark:bg-amber-900/30', badgeColor: 'text-amber-700 dark:text-amber-400'
        },
        info: {
            label: 'Informativas', icon: 'pi pi-info-circle', iconColor: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800',
            badgeBg: 'bg-blue-100 dark:bg-blue-900/30', badgeColor: 'text-blue-700 dark:text-blue-400'
        },
        success: {
            label: 'Favorables', icon: 'pi pi-check-circle', iconColor: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800',
            badgeBg: 'bg-green-100 dark:bg-green-900/30', badgeColor: 'text-green-700 dark:text-green-400'
        }
    };

    /** Alertas agrupadas por tipo, ordenadas de más grave a menos grave. */
    alertGroups = computed(() => {
        const order: string[] = ['danger', 'warning', 'info', 'success'];
        const alerts = this.generalAlerts();
        return order
            .map(type => ({
                type,
                ...this.alertGroupMeta[type],
                messages: alerts.filter(a => a.type === type).map(a => a.message)
            }))
            .filter(group => group.messages.length > 0);
    });

    // ─── Mapas de presentación ───────────────────────────────────────────────

    reliabilityFlagConfig: Record<string, { icon: string; iconColor: string; bg: string; border: string; badgeBg: string; badgeColor: string; groupLabel: string }> = {
        danger: {
            icon: 'pi pi-times-circle',
            iconColor: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            badgeBg: 'bg-red-100 dark:bg-red-900/30',
            badgeColor: 'text-red-700 dark:text-red-400',
            groupLabel: 'Críticas'
        },
        warning: {
            icon: 'pi pi-exclamation-triangle',
            iconColor: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-800',
            badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
            badgeColor: 'text-amber-700 dark:text-amber-400',
            groupLabel: 'Advertencias'
        },
        info: {
            icon: 'pi pi-info-circle',
            iconColor: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
            badgeColor: 'text-blue-700 dark:text-blue-400',
            groupLabel: 'Informativas'
        }
    };

    getReliabilityFlagConfig(severity: string) {
        return this.reliabilityFlagConfig[severity] ?? this.reliabilityFlagConfig['info'];
    }

    dimensionTooltips: Record<string, string> = {
        financialHealth: 'Evalúa la solidez financiera general de la empresa mediante indicadores clave como el nivel de endeudamiento, la relación entre activos y pasivos, y la capacidad de generar utilidades.',
        paymentCapacity: 'Mide si la empresa genera suficiente flujo de caja para cubrir el cupo solicitado, comparando la capacidad de pago mensual contra el monto del cupo.',
        termCoherence: 'Compara el plazo de pago solicitado contra los tiempos reales de operación del negocio (rotación de cartera, inventarios y proveedores).',
        creditLineAdequacy: 'Verifica que el cupo solicitado sea proporcional a la capacidad financiera real de la empresa e incluye el techo avalado por la central.',
        capitalExposure: 'Evalúa qué tan eficientemente la empresa usa su capital frente a la exposición del cupo solicitado.',
        veracity: 'Contrasta las cifras del documento cargado contra las reportadas en la central de riesgo para el mismo periodo.',
        centralRisk: 'Refleja el nivel de riesgo del cliente según la información de la central de riesgo.',
        // Dimensiones propias del estudio de capacidad de pago.
        incomeStability: 'Mide qué tan constante es el ingreso mes a mes, cuántos meses de historia se pudieron verificar y la antigüedad laboral del titular.',
        indebtedness: 'Compara las cuotas que ya paga —más la del crédito solicitado— contra su ingreso verificado.',
        financialBehavior: 'Evalúa cómo maneja la cuenta: saldos promedio, días en negativo, retiros inmediatos tras recibir el ingreso y gastos de riesgo.',
        docVeracity: 'Resume el resultado de las verificaciones automáticas sobre los documentos aportados (saldos, totales, identidad del titular y cuenta de consignación).'
    };

    getDimensionStatusConfig(dim: DimensionView): { label: string; bg: string; color: string } {
        const ratio = dim.fillRatio;
        if (ratio >= 0.8) return { label: 'Excelente', bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-700 dark:text-green-400' };
        if (ratio >= 0.5) return { label: 'Aceptable', bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-700 dark:text-amber-400' };
        return { label: 'Crítico', bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-700 dark:text-red-400' };
    }

    getDimensionBarWidth(dim: DimensionView): number {
        return Math.round(dim.fillRatio * 100);
    }

    getDimensionBarColor(dim: DimensionView): string {
        const ratio = dim.fillRatio;
        if (ratio >= 0.8) return 'bg-green-500';
        if (ratio >= 0.5) return 'bg-amber-500';
        return 'bg-red-500';
    }

    // ─── IA ──────────────────────────────────────────────────────────────────

    onRequestAiAnalysis(): void {
        this.confirmationService.confirm({
            message: 'Se realizará un análisis con inteligencia artificial basado en los resultados del estudio de crédito.',
            header: 'Análisis con IA',
            icon: 'pi pi-sparkles',
            acceptLabel: 'Sí, analizar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
            accept: () => this.executeAiAnalysis()
        });
    }

    private executeAiAnalysis(): void {
        const studyId = this.creditStudyId() ?? this.study().id;
        if (!studyId) return;

        this.aiLoading.set(true);
        this.aiError.set(false);

        this.creditStudyService.performAiAnalysis(studyId).pipe(
            finalize(() => this.aiLoading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => {
                // Guarda el análisis para mostrarlo sin recargar la página.
                this.generatedAnalysis.set({
                    id: data.id,
                    result: data.result,
                    status: data.status,
                    durationMs: data.durationMs,
                    createdAt: data.createdAt,
                    performedBy: data.performedBy,
                    performedByUser: data.performedByUser
                });
                this.notificationService.success('Análisis de IA generado exitosamente', 'IA');
                this.authService.refreshProfile();
            },
            error: () => {
                this.aiError.set(true);
            }
        });
    }
}
