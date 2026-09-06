import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { BureauCheckService } from '../bureau-check.service';
import { CreditStudyService } from '../../credit-study.service';
import { CustomersService } from '@/app/features/customers/customers.service';
import { CustomerDetail as CustomerDetailModel } from '@/app/types/customer';
import { CustomerAuthorization } from '@/app/types/credit-study';
import {
    BureauCheckDetail as BureauCheckDetailModel,
    CreateBureauCheckPayload
} from '@/app/types/bureau-check';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { LocationOption } from '@/app/core/services/locations.service';
import { Parameter } from '@/app/types/parameter';
import { AuthService } from '@/app/core/services/auth.service';
import { RecentItemsService } from '@/app/shared/services/recent-items.service';
import { isBusinessDocType } from '@/app/shared/components/billing-form/billing-form.builder';
import { StateControl } from '@/app/shared/components/state-control/state-control';
import { CityControl } from '@/app/shared/components/city-control/city-control';
import { SupportFab } from '@/app/shared/components/support-fab/support-fab';

/**
 * Consulta de riesgo crediticio: creación y detalle. Un solo flujo sin stepper:
 * datos del titular → gate de firma → consulta a la central → análisis IA
 * automático → informe propio (resumen, red flags, señales, cifras clave).
 * Por políticas de uso NUNCA se pinta el reporte crudo de la central: solo el
 * dato transformado que entrega el API.
 */
@Component({
    selector: 'app-bureau-check-detail',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        FloatLabelModule,
        FluidModule,
        MessageModule,
        CardModule,
        SelectModule,
        SkeletonModule,
        DialogModule,
        StateControl,
        CityControl,
        SupportFab
    ],
    templateUrl: './bureau-check-detail.html'
})
export class BureauCheckDetail {
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private bureauCheckService = inject(BureauCheckService);
    private creditStudyService = inject(CreditStudyService);
    private customersService = inject(CustomersService);
    private notificationService = inject(NotificationService);
    private parameterService = inject(ParameterService);
    private recentItemsService = inject(RecentItemsService);
    private authService = inject(AuthService);

    bureauCheckId = toSignal(this.route.params.pipe(map(params => params['id'])));

    private prefillCustomerId = toSignal(
        this.route.queryParams.pipe(map(qp => qp['customerId'] as string | undefined))
    );

    isDetailMode = computed(() => !!this.bureauCheckId());

    loading = signal(false);
    creating = signal(false);
    performing = signal(false);
    downloadingPdf = signal(false);
    performError = signal<string | null>(null);

    detail = signal<BureauCheckDetailModel | null>(null);
    analysis = computed(() => this.detail()?.analysis ?? null);
    titular = computed(() => this.detail()?.customer ?? null);

    /** Verificación de identidad (digitado vs central); null si no es concluyente. */
    identity = computed(() => {
        const i = this.detail()?.identity;
        return i && i.matches !== null ? i : null;
    });

    /** Narrativa de probabilidad de pago de la central (consultas nuevas). */
    probabilityText = computed(() => this.analysis()?.keyFigures?.txtProbabilidad ?? null);

    recommendations = computed(() => this.analysis()?.recommendations ?? []);
    sectorActivity = computed(() => this.analysis()?.keyFigures?.sectorActivity ?? []);
    paymentTimeline = computed(() => this.analysis()?.keyFigures?.paymentTimeline ?? []);
    paymentStats = computed(() => this.analysis()?.keyFigures?.paymentStats ?? null);
    balanceTrend = computed(() => this.analysis()?.keyFigures?.balanceTrend ?? null);
    alertsDetail = computed(() =>
        (this.analysis()?.keyFigures?.alertsDetail ?? []).filter(a => !!a.message)
    );

    readonly timelineDotClasses: Record<string, string> = {
        ok: 'bg-green-500',
        delay: 'bg-amber-400',
        severe: 'bg-red-500',
        unknown: 'bg-surface-300 dark:bg-surface-600'
    };

    loaderMessage = signal('');
    private loaderTimer: ReturnType<typeof setInterval> | null = null;

    private readonly createMessages = [
        'Consultando al titular en las centrales de riesgo',
        'Verificando estado del documento de identidad',
        'Recopilando su historial de crédito',
        'Preparando la consulta de riesgo'
    ];

    private readonly performMessages = [
        'Analizando el perfil crediticio del titular',
        'Leyendo el comportamiento de pago',
        'Identificando señales de alerta y señales a favor',
        'Preparando el informe'
    ];

    /** El análisis corre solo al abrir una consulta recién creada (una vez por carga). */
    private autoPerformTried = false;

    riskConfig = computed(() => {
        const level = this.analysis()?.riskLevel;
        const map: Record<string, { label: string; classes: string; icon: string }> = {
            low: {
                label: 'Riesgo bajo',
                icon: 'pi pi-shield',
                classes: 'bg-green-50 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
            },
            medium: {
                label: 'Riesgo medio',
                icon: 'pi pi-exclamation-triangle',
                classes: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
            },
            high: {
                label: 'Riesgo alto',
                icon: 'pi pi-times-circle',
                classes: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
            }
        };
        return level ? map[level] ?? null : null;
    });

    statusConfig = computed(() => {
        const status = this.detail()?.status;
        if (!status) return null;
        const map: Record<string, { icon: string; classes: string; dot: string; label?: string }> = {
            pendingStudyAnalysis: {
                icon: 'pi pi-hourglass',
                classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
                dot: 'bg-blue-500',
                label: 'Analizando'
            },
            studyCompleted: {
                icon: 'pi pi-check-circle',
                classes: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
                dot: 'bg-green-500',
                label: 'Completada'
            }
        };
        const config = map[status.code] ?? {
            icon: 'pi pi-info-circle',
            classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
            dot: 'bg-indigo-500'
        };
        return { ...config, label: config.label ?? status.label };
    });

    keyFigureTiles = computed(() => {
        const kf = this.analysis()?.keyFigures;
        if (!kf) return [];
        const money = (v: number | null) =>
            v === null ? '—' : `$${Math.round(v).toLocaleString('es-CO')}`;
        const pct = (v: number | null) => (v === null ? '—' : `${v}%`);
        const tiles = [
            { label: 'Saldo total de obligaciones', value: money(kf.saldoActual) },
            { label: 'Saldo en mora', value: money(kf.saldoMora) },
            { label: '% de endeudamiento', value: pct(kf.porcentajeDeuda) }
        ];
        // Cifras del enriquecimiento: los análisis viejos no las traen.
        if (kf.valorCuota !== undefined) {
            tiles.push({ label: 'Cuota mensual comprometida', value: money(kf.valorCuota) });
        }
        if (kf.totalCodeudorOtros !== undefined) {
            tiles.push({ label: 'Obligaciones como codeudor', value: money(kf.totalCodeudorOtros) });
        }
        tiles.push(
            { label: 'Ingreso mensual reportado', value: money(kf.reportedIncome) },
            { label: 'Ingreso comprometido en cuotas', value: pct(kf.quotaToIncomePct) }
        );
        if (kf.creditosVigentes !== undefined) {
            tiles.push({ label: 'Créditos vigentes', value: String(kf.creditosVigentes) });
        }
        if (kf.creditosCerrados !== undefined) {
            tiles.push({ label: 'Créditos cerrados', value: String(kf.creditosCerrados) });
        }
        tiles.push({ label: 'Sectores con créditos', value: String(kf.sectorsWithCredits ?? '—') });
        return tiles;
    });

    sectionBlocks = computed(() => {
        const s = this.analysis()?.sections;
        if (!s) return [];
        return [
            { icon: 'pi pi-credit-card', title: 'Endeudamiento', text: s.indebtedness },
            { icon: 'pi pi-calendar', title: 'Hábito de pago', text: s.paymentHabits },
            { icon: 'pi pi-bell', title: 'Alertas y verificación', text: s.alerts },
            { icon: 'pi pi-dollar', title: 'Ingreso', text: s.income }
        ].filter(b => b.text);
    });

    // ─── Creación ────────────────────────────────────────────────────────────

    summaryVisible = signal(false);
    authVisible = signal(false);
    checkingAuth = signal(false);
    finalizing = signal(false);
    authInfo = signal<CustomerAuthorization | null>(null);
    private lastPayload: CreateBureauCheckPayload | null = null;

    /** Solo persona natural: sin NIT. */
    identificationTypes = toSignal(
        this.parameterService.getByType('identification_type').pipe(
            map(types => types.filter(type => !isBusinessDocType(type)))
        )
    );

    form = new FormGroup({
        identificationTypeId: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        identificationNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        businessName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        titularEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        titularState: new FormControl<LocationOption | null>(null, { validators: [Validators.required] }),
        titularCity: new FormControl<LocationOption | null>(null, { validators: [Validators.required] }),
        // Solo para el contraste contra el monto sugerido por la central.
        requestedCreditLine: new FormControl<number | null>(null, { validators: [Validators.required] })
    });

    titularRegionCode = signal<string | null>(null);

    summary = signal<{
        identificationType: string;
        identificationNumber: string;
        businessName: string;
        titularEmail: string;
        titularCity: string;
        requestedCreditLine: number | null;
    }>({
        identificationType: '—',
        identificationNumber: '—',
        businessName: '—',
        titularEmail: '—',
        titularCity: '—',
        requestedCreditLine: null
    });

    private prefillCustomer = signal<CustomerDetailModel | null>(null);
    private prefillApplied = false;

    constructor() {
        effect(() => {
            const id = this.bureauCheckId();
            if (id) {
                this.loadDetail(id);
            }
        });

        effect(() => {
            const customerId = this.prefillCustomerId();
            if (!customerId || this.isDetailMode() || this.prefillCustomer()) return;
            this.customersService.getCustomerById(customerId).pipe(
                takeUntilDestroyed(this.destroyRef)
            ).subscribe(customer => this.prefillCustomer.set(customer));
        });

        effect(() => {
            const customer = this.prefillCustomer();
            const idTypes = this.identificationTypes();
            if (!customer || !idTypes?.length || this.prefillApplied) return;
            this.prefillApplied = true;

            const idType = idTypes.find(t => t.id === customer.identificationType?.id)
                ?? idTypes.find(t => t.code === customer.identificationType?.code)
                ?? null;

            this.form.patchValue({
                identificationTypeId: idType,
                identificationNumber: customer.identificationNumber ?? '',
                businessName: customer.businessName ?? '',
                titularEmail: customer.email ?? ''
            });
        });

        this.form.controls.titularState.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(state => {
            this.titularRegionCode.set(state?.code ?? null);
            this.form.controls.titularCity.reset();
        });

        this.destroyRef.onDestroy(() => this.stopLoaderMessages());
    }

    private startLoaderMessages(messages: string[]): void {
        this.stopLoaderMessages();
        let index = 0;
        this.loaderMessage.set(messages[0]);
        this.loaderTimer = setInterval(() => {
            index = (index + 1) % messages.length;
            this.loaderMessage.set(messages[index]);
        }, 2200);
    }

    private stopLoaderMessages(): void {
        if (this.loaderTimer) {
            clearInterval(this.loaderTimer);
            this.loaderTimer = null;
        }
    }

    private loadDetail(id: string): void {
        this.loading.set(true);
        this.bureauCheckService.getDetail(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (detail) => {
                this.detail.set(detail);

                const businessName = detail.customer?.businessName;
                if (businessName) {
                    this.recentItemsService.setCreditStudy(
                        String(id),
                        `Consulta · ${businessName}`,
                        'bureauCheck'
                    );
                }

                // Consulta recién creada (o con análisis fallido a medias): el
                // análisis corre solo — mismo flujo visual que la creación.
                if (!detail.analysis && detail.status?.code === 'pendingStudyAnalysis' && !this.autoPerformTried) {
                    this.autoPerformTried = true;
                    this.onPerform();
                }
            },
            error: () => {
                this.notificationService.warn('No se encontró la consulta de riesgo en esta empresa.');
                void this.router.navigate(['/app/estudio-credito']);
            }
        });
    }

    onPerform(): void {
        const id = this.bureauCheckId();
        if (!id || this.performing()) return;

        this.performing.set(true);
        this.performError.set(null);
        this.startLoaderMessages(this.performMessages);
        this.bureauCheckService.perform(id).pipe(
            finalize(() => {
                this.performing.set(false);
                this.stopLoaderMessages();
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (detail) => {
                this.detail.set(detail);
                this.notificationService.success('Análisis de la consulta generado correctamente');
            },
            error: (error) => {
                const message = error?.error?.message
                    ?? 'El análisis no se pudo generar. La consulta no se pierde: vuelva a intentarlo.';
                this.performError.set(message);
            }
        });
    }

    isInvalid(controlName: string): boolean {
        const control = this.form.get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(controlName: string): string {
        const control = this.form.get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['email']) return 'Ingrese un correo electrónico válido';
        return '';
    }

    onCreate(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) {
            this.notificationService.warn('Por favor complete todos los campos requeridos', 'Validación');
            return;
        }

        const v = this.form.getRawValue();
        this.summary.set({
            identificationType: v.identificationTypeId?.label ?? '—',
            identificationNumber: v.identificationNumber || '—',
            businessName: v.businessName || '—',
            titularEmail: v.titularEmail || '—',
            titularCity: v.titularCity?.name ?? '—',
            requestedCreditLine: v.requestedCreditLine
        });
        this.summaryVisible.set(true);
    }

    onConfirmCreate(): void {
        const v = this.form.getRawValue();
        const payload: CreateBureauCheckPayload = {
            identificationTypeCode: v.identificationTypeId?.code ?? '',
            numeroIdentificacion: v.identificationNumber,
            apellidoRazonSocial: v.businessName,
            titularEmail: v.titularEmail,
            titularCity: v.titularCity?.name ?? '',
            requestedCreditLine: v.requestedCreditLine ?? undefined
        };
        this.lastPayload = payload;

        this.creating.set(true);
        this.startLoaderMessages(this.createMessages);
        this.bureauCheckService.create(payload).pipe(
            finalize(() => {
                this.creating.set(false);
                this.stopLoaderMessages();
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((response) => {
            if (response.status === 'authorization_pending' && response.authorization) {
                this.authInfo.set(response.authorization);
                this.summaryVisible.set(false);
                this.authVisible.set(true);
                return;
            }
            this.onCreated(response.creditStudyId);
        });
    }

    private onCreated(creditStudyId?: string): void {
        if (!creditStudyId) return;
        this.summaryVisible.set(false);
        this.authVisible.set(false);
        this.notificationService.success('Consulta de riesgo creada correctamente');
        this.authService.refreshProfile();
        void this.router.navigate(['/app/estudio-credito/consulta-riesgo', creditStudyId]);
    }

    onCheckAuthorization(): void {
        const identificationNumber = this.lastPayload?.numeroIdentificacion;
        if (!identificationNumber) return;

        this.checkingAuth.set(true);
        this.creditStudyService.getCustomerAuthorization(identificationNumber).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (auth) => {
                this.authInfo.set(auth);
                this.checkingAuth.set(false);
                if (auth.isSigned) {
                    this.createAfterSignature();
                } else {
                    this.notificationService.info('El titular aún no ha firmado la autorización. Inténtelo de nuevo en unos minutos.', 'Firma pendiente');
                }
            },
            error: () => this.checkingAuth.set(false)
        });
    }

    private createAfterSignature(): void {
        const payload = this.lastPayload;
        if (!payload) return;

        this.finalizing.set(true);
        this.startLoaderMessages(this.createMessages);
        this.bureauCheckService.create(payload).pipe(
            finalize(() => {
                this.finalizing.set(false);
                this.stopLoaderMessages();
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((response) => {
            if (response.status === 'authorization_pending' && response.authorization) {
                this.authInfo.set(response.authorization);
                this.notificationService.warn('La autorización aún figura como pendiente. Inténtelo de nuevo en unos segundos.');
                return;
            }
            this.onCreated(response.creditStudyId);
        });
    }

    onDownloadPdf(): void {
        const id = this.bureauCheckId();
        if (!id || !this.analysis() || this.downloadingPdf()) return;

        this.downloadingPdf.set(true);
        this.bureauCheckService.downloadPdf(id).pipe(
            finalize(() => this.downloadingPdf.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                const blob = response.body;
                if (!blob) {
                    this.notificationService.error('No fue posible descargar el informe', 'Descarga fallida');
                    return;
                }
                const businessName = this.titular()?.businessName;
                const fallbackName = `consulta-riesgo-${businessName ? businessName.replace(/\s+/g, '-') : id}.pdf`;
                const match = /filename="?([^"]+)"?/.exec(response.headers.get('Content-Disposition') ?? '');
                const fileName = match?.[1] ?? fallbackName;

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => this.notificationService.error('No fue posible descargar el informe', 'Descarga fallida')
        });
    }

    onCancel(): void {
        void this.router.navigate(['/app/estudio-credito']);
    }
}
