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
import { AiAnalysisResponse, CreateCreditStudy, ViabilityConditions, ViabilityDimension } from '@/app/types/credit-study';
import { CreditStudyService } from '../../credit-study.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { HelpTooltip } from '@/app/shared/components/help-tooltip/help-tooltip';

@Component({
    selector: 'app-study-result',
    standalone: true,
    imports: [CommonModule, CurrencyPipe, DatePipe, CardModule, MessageModule, ButtonModule, AccordionModule, ConfirmDialogModule, HelpTooltip],
    providers: [ConfirmationService],
    templateUrl: './study-result.html'
})
export class StudyResult {
    private destroyRef = inject(DestroyRef);
    private creditStudyService = inject(CreditStudyService);
    private notificationService = inject(NotificationService);
    private confirmationService = inject(ConfirmationService);

    study = input.required<CreateCreditStudy>();
    customer = input<{ businessName?: string; identificationNumber?: string; city?: string }>();
    companyInfo = input<{ name: string; city: string; nit: string }>();
    subscriptionName = input<string>('');
    readOnly = input<boolean>(false);

    isPro = computed(() => this.subscriptionName().toLowerCase().includes('pro'));

    aiLoading = signal(false);
    aiAnalysis = signal<AiAnalysisResponse | null>(null);
    aiRequested = signal(false);

    existingAiAnalyses = computed(() => {
        const analyses = this.study().aiAnalyses ?? [];
        return analyses
            .filter(a => a.result != null && a.result.trim() !== '')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    hasExistingAnalyses = computed(() => this.existingAiAnalyses().length > 0);

    viability = computed(() => {
        const raw = this.study().viabilityConditions;
        if (!raw) return null;
        if (typeof raw === 'string') {
            try { return JSON.parse(raw) as ViabilityConditions; } catch { return null; }
        }
        return raw as ViabilityConditions;
    });

    scorePercentage = computed(() => this.viability()?.summary?.totalScore ?? Math.round((this.study().stabilityFactor ?? 0) * 100));

    maxScore = computed(() => this.viability()?.summary?.maxScore ?? 100);

    viabilityStatus = computed(() => this.study().viabilityStatus ?? this.viability()?.summary?.status ?? 'pending');

    statusConfig = computed(() => {
        const status = this.viabilityStatus();
        switch (status) {
            case 'approved':
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-200 dark:border-green-800',
                    iconBg: 'bg-green-500',
                    icon: 'pi pi-check-circle',
                    titleColor: 'text-green-700 dark:text-green-400',
                    title: 'Cupo Aprobado',
                    description: 'El analisis crediticio indica que el cliente es apto para el cupo solicitado.'
                };
            case 'conditional':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    border: 'border-amber-200 dark:border-amber-800',
                    iconBg: 'bg-amber-500',
                    icon: 'pi pi-exclamation-triangle',
                    titleColor: 'text-amber-700 dark:text-amber-400',
                    title: 'Cupo Aprobado con Condiciones',
                    description: 'El analisis crediticio indica que el cliente es apto para el cupo, sujeto a condiciones adicionales.'
                };
            case 'rejected':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-200 dark:border-red-800',
                    iconBg: 'bg-red-500',
                    icon: 'pi pi-times-circle',
                    titleColor: 'text-red-700 dark:text-red-400',
                    title: 'Cupo No Aprobado',
                    description: 'El analisis crediticio indica que el cliente no cumple con los requisitos minimos para el cupo solicitado.'
                };
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-gray-900/20',
                    border: 'border-gray-200 dark:border-gray-800',
                    iconBg: 'bg-gray-500',
                    icon: 'pi pi-info-circle',
                    titleColor: 'text-gray-700 dark:text-gray-400',
                    title: 'Pendiente',
                    description: 'El estudio aun no ha sido procesado.'
                };
        }
    });

    alerts = computed(() => this.viability()?.alerts ?? []);

    dimensions = computed(() => {
        const dims = this.viability()?.dimensions;
        if (!dims) return [];
        return Object.entries(dims).map(([key, dim]) => ({ key, ...dim }));
    });

    summary = computed(() => this.viability()?.summary);

    alertSeverityMap: Record<string, string> = {
        success: 'success',
        warning: 'warn',
        danger: 'error',
        info: 'info'
    };

    alertIconMap: Record<string, string> = {
        success: 'pi pi-check-circle',
        warning: 'pi pi-exclamation-triangle',
        danger: 'pi pi-times-circle',
        info: 'pi pi-info-circle'
    };

    dimensionTooltips: Record<string, string> = {
        financialHealth: 'Evalua la solidez financiera general de la empresa mediante indicadores clave como el nivel de endeudamiento, la relacion entre activos y pasivos, y la capacidad de generar utilidades. Un puntaje alto indica estabilidad y bajo riesgo de insolvencia.',
        paymentCapacity: 'Mide si la empresa genera suficiente flujo de caja para cubrir el cupo solicitado. Compara la capacidad de pago mensual (basada en EBITDA ajustado menos deuda actual) contra el monto del cupo. Un margen amplio indica holgura financiera.',
        termCoherence: 'Compara el plazo de pago solicitado contra los tiempos reales de operacion del negocio (rotacion de cartera, inventarios y proveedores). Un plazo solicitado muy inferior al ciclo operativo real indica alto riesgo de incumplimiento.',
        creditLineAdequacy: 'Verifica que el cupo solicitado sea proporcional a la capacidad financiera real de la empresa. Compara el monto solicitado contra el cupo maximo recomendado calculado a partir de la capacidad de pago y el plazo.'
    };

    getDimensionStatusConfig(dim: ViabilityDimension & { key: string }): { label: string; bg: string; color: string } {
        const ratio = dim.score / dim.maxScore;
        if (ratio >= 0.8) return { label: 'Excelente', bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-700 dark:text-green-400' };
        if (ratio >= 0.5) return { label: 'Aceptable', bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-700 dark:text-amber-400' };
        return { label: 'Critico', bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-700 dark:text-red-400' };
    }

    getDimensionBarWidth(dim: ViabilityDimension): number {
        return Math.round((dim.score / dim.maxScore) * 100);
    }

    getDimensionBarColor(dim: ViabilityDimension): string {
        const ratio = dim.score / dim.maxScore;
        if (ratio >= 0.8) return 'bg-green-500';
        if (ratio >= 0.5) return 'bg-amber-500';
        return 'bg-red-500';
    }

    onRequestAiAnalysis(): void {
        this.confirmationService.confirm({
            message: 'Se realizara un analisis con inteligencia artificial basado en los resultados del estudio de credito. Esta accion consume una solicitud de su plan Pro.',
            header: 'Analisis con IA',
            icon: 'pi pi-sparkles',
            acceptLabel: 'Si, analizar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
            accept: () => this.executeAiAnalysis()
        });
    }

    private executeAiAnalysis(): void {
        const studyId = this.study().id;
        if (!studyId) return;

        this.aiLoading.set(true);
        this.aiRequested.set(true);

        this.creditStudyService.performAiAnalysis(studyId).pipe(
            finalize(() => this.aiLoading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(result => {
            if (result.success && result.data) {
                this.aiAnalysis.set(result.data);
                this.notificationService.success('Analisis de IA generado exitosamente', 'IA');
            } else {
                this.notificationService.error(result.error ?? 'Error al generar el analisis', 'Error');
            }
        });
    }
}
