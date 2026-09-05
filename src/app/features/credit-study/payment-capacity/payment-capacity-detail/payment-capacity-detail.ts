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
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { MessageModule } from 'primeng/message';
import { StepperModule } from 'primeng/stepper';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { CreditStudyService } from '../../credit-study.service';
import { CustomersService } from '@/app/features/customers/customers.service';
import { CustomerDetail as CustomerDetailModel } from '@/app/types/customer';
import {
    CreateFromBureauPayload,
    CreditStudyRequest,
    CreditStudyStep1,
    CustomerAuthorization,
    PerformStudyResponse
} from '@/app/types/credit-study';
import { CreditStudyDocumentsStep, EmploymentTypeCode } from '@/app/types/payment-capacity';
import { PromissoryNoteSummary } from '@/app/types/promissory-note';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { LocationOption } from '@/app/core/services/locations.service';
import { Parameter } from '@/app/types/parameter';
import { AuthService } from '@/app/core/services/auth.service';
import { RecentItemsService } from '@/app/shared/services/recent-items.service';
import { ConfirmService, provideConfirm } from '@/app/shared/services/confirm.service';
import { isBusinessDocType } from '@/app/shared/components/billing-form/billing-form.builder';
import { StateControl } from '@/app/shared/components/state-control/state-control';
import { CityControl } from '@/app/shared/components/city-control/city-control';
import { BureauProfile } from '../../credit-study-detail/bureau-profile/bureau-profile';
import { PromissoryNoteModal } from '../../credit-study-detail/promissory-note-modal/promissory-note-modal';
import { PaymentCapacityDocuments } from '../payment-capacity-documents/payment-capacity-documents';
import { PaymentCapacityResult } from '../payment-capacity-result/payment-capacity-result';
import { SupportFab } from '@/app/shared/components/support-fab/support-fab';
import { DateOnlyPipe } from '@/app/shared/pipes/date-only.pipe';

/**
 * Estudio de capacidad de pago (persona natural sin estados financieros):
 * creación y detalle. Comparte con el estudio empresarial la consulta al bureau,
 * el gate de autorización, el perform y el pagaré; lo propio es que el paso 2
 * son documentos del titular en vez de estados financieros, y que el paso 1
 * declara el perfil laboral.
 */
@Component({
    selector: 'app-payment-capacity-detail',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        DatePickerModule,
        FloatLabelModule,
        FluidModule,
        MessageModule,
        StepperModule,
        CardModule,
        BadgeModule,
        SelectModule,
        SkeletonModule,
        ConfirmDialogModule,
        DialogModule,
        StateControl,
        CityControl,
        BureauProfile,
        PromissoryNoteModal,
        PaymentCapacityDocuments,
        PaymentCapacityResult,
        SupportFab,
        DateOnlyPipe
    ],
    providers: [provideConfirm()],
    templateUrl: './payment-capacity-detail.html'
})
export class PaymentCapacityDetail {
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private creditStudyService = inject(CreditStudyService);
    private customersService = inject(CustomersService);
    private notificationService = inject(NotificationService);
    private parameterService = inject(ParameterService);
    private recentItemsService = inject(RecentItemsService);
    private confirmService = inject(ConfirmService);
    private authService = inject(AuthService);

    creditStudyId = toSignal(this.route.params.pipe(map(params => params['id'])));

    private prefillCustomerId = toSignal(
        this.route.queryParams.pipe(map(qp => qp['customerId'] as string | undefined))
    );

    isDetailMode = computed(() => !!this.creditStudyId());

    loading = signal(false);
    creatingStudy = signal(false);
    performingStudy = signal(false);
    downloadingPdf = signal(false);
    activeStep = 1;

    loaderMessage = signal('');
    private loaderTimer: ReturnType<typeof setInterval> | null = null;

    private readonly createStudyMessages = [
        'Consultando al titular en las centrales de riesgo',
        'Verificando estado del documento de identidad',
        'Recopilando su historial de crédito',
        'Preparando el estudio de capacidad de pago'
    ];

    step1Data = signal<CreditStudyStep1 | null>(null);
    step2Data = signal<CreditStudyDocumentsStep | null>(null);
    studyResult = signal<PerformStudyResponse | null>(null);
    studyStatus = signal<{ code: string; label: string } | null>(null);
    studyRequest = signal<CreditStudyRequest | null>(null);
    studyDate = signal<string | null>(null);
    promissoryNote = signal<PromissoryNoteSummary | null>(null);

    studyCompleted = computed(() => !!this.studyResult());
    hasDocuments = computed(() => (this.step2Data()?.documents?.length ?? 0) > 0);

    /** Perfil laboral del estudio ya creado (define qué documentos se piden). */
    employmentType = computed<EmploymentTypeCode>(() =>
        this.studyRequest()?.employmentType?.code === 'independent' ? 'independent' : 'salaried'
    );

    /** Solo se puede analizar cuando la ventana de documentos quedó cubierta. */
    canPerformStudy = computed(() => this.step2Data()?.coverage?.complete ?? false);

    promissoryNoteVisible = signal(false);
    isStudyClosed = computed(() => this.studyStatus()?.code === 'closed');

    canSignPromissoryNote = computed(() => {
        const status = this.studyResult()?.viabilityStatus;
        return (status === 'approved' || status === 'conditional')
            && !this.isStudyClosed()
            && !this.promissoryNote();
    });

    promissoryNoteStatusConfig = computed(() => {
        const note = this.promissoryNote();
        if (!note) return null;

        const map: Record<string, { icon: string; classes: string }> = {
            signed: {
                icon: 'pi pi-verified',
                classes: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
            },
            sent: {
                icon: 'pi pi-send',
                classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
            },
            pending: {
                icon: 'pi pi-clock',
                classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
            },
            declined: {
                icon: 'pi pi-times-circle',
                classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
            }
        };

        const config = map[note.status] ?? {
            icon: 'pi pi-info-circle',
            classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
        };

        return { ...config, label: note.statusLabel };
    });

    studyCustomerId = computed(() =>
        this.step1Data()?.customer?.id ?? this.studyResult()?.customer?.id ?? undefined
    );

    /**
     * Estado del estudio. El backend reutiliza la máquina del flujo con EEFF, así
     * que aquí se remapea el label: "pendiente de estados financieros" no le dice
     * nada al analista de un estudio que se alimenta de extractos.
     */
    studyStatusConfig = computed(() => {
        const status = this.studyStatus();
        if (!status) return null;

        const map: Record<string, { icon: string; classes: string; dot: string; label?: string }> = {
            pendingFinancialStatements: {
                icon: 'pi pi-file-import',
                classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
                dot: 'bg-amber-500',
                label: 'Pendiente de documentos'
            },
            pendingStudyAnalysis: {
                icon: 'pi pi-hourglass',
                classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
                dot: 'bg-blue-500'
            },
            studyClosed: {
                icon: 'pi pi-check-circle',
                classes: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
                dot: 'bg-green-500'
            },
            closed: {
                icon: 'pi pi-verified',
                classes: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
                dot: 'bg-green-500'
            }
        };

        const config = map[status.code] ?? {
            icon: 'pi pi-info-circle',
            classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
            dot: 'bg-indigo-500'
        };

        return { ...config, label: config.label ?? status.label };
    });

    step2Enabled = computed(() => this.isDetailMode() || !!this.step1Data());
    step3Enabled = computed(() => this.canPerformStudy() || this.studyCompleted());

    resultCustomer = computed(() => {
        const customer = this.step1Data()?.customer;
        return {
            businessName: customer?.businessName ?? undefined,
            identificationNumber: customer?.identificationNumber ?? undefined,
            city: customer?.city ?? customer?.bureauProfile?.contact?.city ?? undefined
        };
    });

    supportRecordLabel = computed(() => this.step1Data()?.customer?.businessName ?? null);

    company = computed(() => {
        const user = this.authService.currentProfile();
        return {
            name: user?.companyName ?? '-',
            city: user?.companyCity ?? '-',
            nit: user?.companyNit ?? '-'
        };
    });

    studyRequestSummary = computed(() => {
        const customer = this.step1Data()?.customer;
        const request = this.studyRequest();
        return {
            businessName: customer?.businessName ?? '—',
            identification: customer?.identificationNumber ?? '—',
            employmentLabel: request?.employmentType?.label
                ?? (this.employmentType() === 'independent' ? 'Independiente' : 'Asalariado'),
            declaredEmploymentStartDate: request?.declaredEmploymentStartDate ?? null,
            requestedCreditLine: request?.requestedCreditLine ?? null,
            studyDate: this.studyDate()
        };
    });

    summaryVisible = signal(false);
    authVisible = signal(false);
    checkingAuth = signal(false);
    finalizingStudy = signal(false);
    authInfo = signal<CustomerAuthorization | null>(null);
    private lastBureauPayload: CreateFromBureauPayload | null = null;

    /** El estudio de capacidad es solo para persona natural: sin NIT. */
    identificationTypes = toSignal(
        this.parameterService.getByType('identification_type').pipe(
            map(types => types.filter(type => !isBusinessDocType(type)))
        )
    );

    employmentTypes = toSignal(this.parameterService.getByType('employment_type'));

    /** Hoy, como tope del calendario: la fecha de inicio laboral es pasada. */
    readonly today = new Date();

    step1Form = new FormGroup({
        identificationTypeId: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        identificationNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        businessName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        titularEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        titularState: new FormControl<LocationOption | null>(null, { validators: [Validators.required] }),
        titularCity: new FormControl<LocationOption | null>(null, { validators: [Validators.required] }),
        employmentTypeId: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        // Opcional y solo mes/año: nadie recuerda el día exacto de hace años, y
        // en el asalariado la fecha verificada la trae el desprendible.
        declaredEmploymentStartDate: new FormControl<Date | null>(null),
        // Sin plazo: este estudio mide la cuota mensual que el titular sostiene;
        // el plazo y la tasa los decide quien otorga el crédito.
        requestedCreditLine: new FormControl<number | null>(null, { validators: [Validators.required] })
    });

    private selectedEmploymentType = toSignal(this.step1Form.controls.employmentTypeId.valueChanges, {
        initialValue: this.step1Form.controls.employmentTypeId.value
    });

    /** El texto de ayuda del formulario cambia según el perfil declarado. */
    employmentHint = computed(() => {
        switch (this.selectedEmploymentType()?.code) {
            case 'independent':
                return 'Se le pedirán 3 meses de extractos bancarios y, opcionalmente, las facturas o cuentas de cobro que emite a sus clientes (de esos mismos meses).';
            case 'salaried':
                return 'Se le pedirán 3 meses de extractos bancarios y al menos un desprendible de nómina.';
            default:
                return 'El perfil laboral define qué documentos se solicitan en el siguiente paso.';
        }
    });

    titularRegionCode = signal<string | null>(null);

    summary = signal<{
        identificationType: string;
        identificationNumber: string;
        businessName: string;
        titularEmail: string;
        titularCity: string;
        employmentType: string;
        declaredEmploymentStartDate: Date | null;
        requestedCreditLine: number | null;
    }>({
        identificationType: '—',
        identificationNumber: '—',
        businessName: '—',
        titularEmail: '—',
        titularCity: '—',
        employmentType: '—',
        declaredEmploymentStartDate: null,
        requestedCreditLine: null
    });

    private prefillCustomer = signal<CustomerDetailModel | null>(null);
    private prefillApplied = false;

    constructor() {
        effect(() => {
            const id = this.creditStudyId();
            if (id) {
                this.loadSteps(id);
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

            this.step1Form.patchValue({
                identificationTypeId: idType,
                identificationNumber: customer.identificationNumber ?? '',
                businessName: customer.businessName ?? '',
                titularEmail: customer.email ?? ''
            });
        });

        this.step1Form.controls.titularState.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(state => {
            this.titularRegionCode.set(state?.code ?? null);
            this.step1Form.controls.titularCity.reset();
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

    /**
     * `silent`: recarga sin esqueletos ni saltar de paso. Se usa después del
     * perform, donde ya estamos parados en el resultado y solo hace falta traer
     * el análisis recién calculado.
     */
    private loadSteps(id: string, silent = false): void {
        if (!silent) this.loading.set(true);
        this.creditStudyService.getCreditStudySteps(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((response) => {
            // Un enlace viejo (pagaré, consumo de bolsa, notificación) puede
            // traer aquí un estudio empresarial: se envía a su propio detalle.
            if (response.studyType?.code === 'financialStatements') {
                void this.router.navigate(['/app/estudio-credito/detalle-estudio', id], { replaceUrl: true });
                return;
            }

            this.step1Data.set(response.step1);
            this.step2Data.set((response.step2 as CreditStudyDocumentsStep | null) ?? null);
            this.studyResult.set(response.step3 ?? null);
            this.studyRequest.set(response.request ?? null);
            this.studyDate.set(response.studyDate ?? null);
            this.promissoryNote.set(response.promissoryNote ?? null);
            this.studyStatus.set(response.status ? { code: response.status.code, label: response.status.label } : null);

            const businessName = response.step1?.customer?.businessName;
            if (businessName) {
                this.recentItemsService.setCreditStudy(
                    String(id),
                    `Estudio · ${businessName}`,
                    'paymentCapacity'
                );
            }

            if (silent) return;

            const hasDocuments = ((response.step2 as CreditStudyDocumentsStep | null)?.documents?.length ?? 0) > 0;
            this.activeStep = response.step3 ? 3 : (hasDocuments ? 2 : (response.step1 ? 2 : 1));
        });
    }

    /** Tras subir o eliminar un documento cambian la cobertura y el estado. */
    onDocumentsChanged(): void {
        const id = this.creditStudyId();
        if (id) {
            this.loadSteps(id);
        }
    }

    openPromissoryNoteDocument(): void {
        const url = this.promissoryNote()?.documentUrl;
        if (url) {
            window.open(url, '_blank', 'noopener');
        }
    }

    openPromissoryNoteSigningUrl(): void {
        const url = this.promissoryNote()?.signingUrl;
        if (url) {
            window.open(url, '_blank', 'noopener');
        }
    }

    onPromissoryNoteGenerated(): void {
        const id = this.creditStudyId();
        if (id) {
            this.loadSteps(id);
        }
    }

    isInvalid(controlName: string): boolean {
        const control = this.step1Form.get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(controlName: string): string {
        const control = this.step1Form.get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['email']) return 'Ingrese un correo electrónico válido';
        return '';
    }

    isStepInvalid(): boolean {
        return this.step1Form.invalid && this.step1Form.touched;
    }

    getInvalidCount(): number {
        let count = 0;
        Object.keys(this.step1Form.controls).forEach(key => {
            if (this.step1Form.get(key)?.invalid) count++;
        });
        return count;
    }

    onCreateStudy(): void {
        this.step1Form.markAllAsTouched();

        if (this.step1Form.invalid) {
            this.notificationService.warn('Por favor complete todos los campos requeridos', 'Validación');
            return;
        }

        const v = this.step1Form.getRawValue();
        this.summary.set({
            identificationType: v.identificationTypeId?.label ?? '—',
            identificationNumber: v.identificationNumber || '—',
            businessName: v.businessName || '—',
            titularEmail: v.titularEmail || '—',
            titularCity: v.titularCity?.name ?? '—',
            employmentType: v.employmentTypeId?.label ?? '—',
            declaredEmploymentStartDate: v.declaredEmploymentStartDate,
            requestedCreditLine: v.requestedCreditLine
        });

        this.summaryVisible.set(true);
    }

    onConfirmCreateStudy(): void {
        const v = this.step1Form.getRawValue();

        const payload: CreateFromBureauPayload = {
            identificationTypeCode: v.identificationTypeId?.code ?? '',
            numeroIdentificacion: v.identificationNumber,
            apellidoRazonSocial: v.businessName,
            titularEmail: v.titularEmail,
            titularCity: v.titularCity?.name ?? '',
            requestedCreditLine: v.requestedCreditLine ?? 0,
            studyTypeCode: 'paymentCapacity',
            employmentTypeCode: (v.employmentTypeId?.code ?? 'salaried') as EmploymentTypeCode,
            declaredEmploymentStartDate: this.toIsoDate(v.declaredEmploymentStartDate)
        };
        this.lastBureauPayload = payload;

        this.creatingStudy.set(true);
        this.startLoaderMessages(this.createStudyMessages);
        this.creditStudyService.createFromBureau(payload).pipe(
            finalize(() => {
                this.creatingStudy.set(false);
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

            this.onStudyCreated(response.creditStudyId);
        });
    }

    private onStudyCreated(creditStudyId?: string): void {
        if (!creditStudyId) return;
        this.summaryVisible.set(false);
        this.authVisible.set(false);
        this.notificationService.success('Estudio de capacidad de pago creado correctamente');

        this.authService.refreshProfile();

        this.router.navigate(['/app/estudio-credito/estudio-capacidad', creditStudyId]);
    }

    onCheckAuthorization(): void {
        const identificationNumber = this.lastBureauPayload?.numeroIdentificacion;
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
        const payload = this.lastBureauPayload;
        if (!payload) return;

        this.finalizingStudy.set(true);
        this.startLoaderMessages(this.createStudyMessages);

        this.creditStudyService.createFromBureau(payload).pipe(
            finalize(() => {
                this.finalizingStudy.set(false);
                this.stopLoaderMessages();
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((response) => {
            if (response.status === 'authorization_pending' && response.authorization) {
                this.authInfo.set(response.authorization);
                this.notificationService.warn('La autorización aún figura como pendiente. Inténtelo de nuevo en unos segundos.');
                return;
            }
            this.onStudyCreated(response.creditStudyId);
        });
    }

    // ─── Step 3: realizar el estudio ─────────────────────────────────────────

    onPerformStudy(activateCallback?: (step: number) => void): void {
        const id = this.creditStudyId();
        if (!id) return;

        this.confirmService.confirm({
            title: 'Realizar Estudio de Capacidad de Pago',
            message: 'Se analizarán los extractos y soportes cargados junto con la información de las centrales de riesgo para calcular el ingreso verificado, ' +
                'la cuota máxima que puede asumir y el resultado de viabilidad. Esta acción no se puede deshacer.',
            kind: 'warn',
            icon: 'pi pi-bolt',
            acceptLabel: 'Sí, realizar estudio',
            onAccept: () => {
                this.performingStudy.set(true);
                this.creditStudyService.performStudy(id).pipe(
                    finalize(() => this.performingStudy.set(false)),
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe((result) => {
                    this.studyResult.set(result);
                    if (result.status) {
                        this.studyStatus.set({ code: result.status.code, label: result.status.label });
                    }
                    this.notificationService.success('Estudio de capacidad de pago realizado exitosamente');
                    activateCallback?.(3);
                    // El análisis (serie de ingreso, obligaciones, comportamiento) se
                    // persiste en el paso 2: sin recargarlo el bloque de flujo de caja
                    // no aparece hasta refrescar la pantalla.
                    this.loadSteps(id, true);
                });
            }
        });
    }

    onDownloadPdf(): void {
        const id = this.creditStudyId();
        if (!id || !this.studyCompleted() || this.downloadingPdf()) return;

        this.downloadingPdf.set(true);
        this.creditStudyService.downloadPdf(id).pipe(
            finalize(() => this.downloadingPdf.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                const blob = response.body;
                if (!blob) {
                    this.notificationService.error('No fue posible descargar el PDF del estudio', 'Descarga fallida');
                    return;
                }

                const businessName = this.step1Data()?.customer?.businessName;
                const fallbackName = `estudio-capacidad-${businessName ? businessName.replace(/\s+/g, '-') : id}.pdf`;
                const fileName = this.extractFileName(response.headers.get('Content-Disposition')) ?? fallbackName;

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => this.notificationService.error('No fue posible descargar el PDF del estudio', 'Descarga fallida')
        });
    }

    private extractFileName(contentDisposition: string | null): string | null {
        if (!contentDisposition) return null;
        const match = /filename="?([^"]+)"?/.exec(contentDisposition);
        return match?.[1] ?? null;
    }

    /** El backend espera la fecha como YYYY-MM-DD, sin desfase de zona horaria. */
    private toIsoDate(date: Date | null): string | undefined {
        if (!date) return undefined;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    onCancel(): void {
        this.router.navigate(['/app/estudio-credito']);
    }
}
