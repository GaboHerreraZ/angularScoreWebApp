import { Component, DestroyRef, effect, inject, signal, computed, linkedSignal } from '@angular/core';
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
import { StepperModule } from 'primeng/stepper';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { CreditStudyService } from '../credit-study.service';
import { CustomersService } from '@/app/features/customers/customers.service';
import { CustomerDetail as CustomerDetailModel } from '@/app/types/customer';
import { CreateFromBureauPayload, CreditStudyRequest, CreditStudyStep1, CreditStudyStep2, CustomerAuthorization, PerformStudyResponse } from '@/app/types/credit-study';
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
import { BureauProfile } from './bureau-profile/bureau-profile';
import { FinancialStatements } from './financial-statements/financial-statements';
import { StudyResult } from './study-result/study-result';
import { PromissoryNoteModal } from './promissory-note-modal/promissory-note-modal';
import { SupportFab } from '@/app/shared/components/support-fab/support-fab';
import { DateOnlyPipe } from '@/app/shared/pipes/date-only.pipe';

@Component({
    selector: 'app-credit-study-detail',
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
        FinancialStatements,
        StudyResult,
        PromissoryNoteModal,
        SupportFab,
        DateOnlyPipe
    ],
    providers: [provideConfirm()],
    templateUrl: './credit-study-detail.html'
})
export class CreditStudyDetail {
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

    creditStudyId = toSignal(
        this.route.params.pipe(map(params => params['id']))
    );

    /** Id del cliente recibido por query param al crear un estudio desde su ficha. */
    private prefillCustomerId = toSignal(
        this.route.queryParams.pipe(map(qp => qp['customerId'] as string | undefined))
    );

    /**
     * true cuando se abre un estudio existente. Los estudios no se editan: este
     * modo es de consulta (perfil del cliente, estados financieros y resultado).
     */
    isDetailMode = computed(() => !!this.creditStudyId());

    private readonly MAX_PDF_SIZE_MB = 10;
    private readonly MAX_PDF_SIZE_BYTES = this.MAX_PDF_SIZE_MB * 1024 * 1024;

    loading = signal(false);
    creatingStudy = signal(false);
    extractingPdf = signal(false);
    performingStudy = signal(false);
    downloadingPdf = signal(false);
    activeStep = 1;

    /** Mensaje rotativo mostrado en los loaders animados. */
    loaderMessage = signal('');
    private loaderTimer: ReturnType<typeof setInterval> | null = null;

    private readonly createStudyMessages = [
        'Consultando al cliente en las centrales de riesgo',
        'Recopilando información societaria y de contacto',
        'Verificando estado del documento',
        'Preparando el estudio de crédito'
    ];

    private readonly extractPdfMessages = [
        'Leyendo el documento',
        'Extrayendo periodos y cifras financieras',
        'Detectando alertas en los estados financieros',
        'Calculando indicadores y ratios'
    ];

    /** Resultado del GET /steps una vez el estudio existe. */
    step1Data = signal<CreditStudyStep1 | null>(null);
    step2Data = signal<CreditStudyStep2 | null>(null);

    /**
     * Fuente de estados financieros del estudio. Con resultado, refleja la
     * fuente con la que realmente se calculó (calculationSource, donde 'pdf'
     * equivale a 'pdf_upload'). Sin resultado, es la fuente a enviar en el
     * perform: Datacrédito por defecto cuando el step 2 la retorna; si no, el
     * PDF. El analista puede cambiarla desde la tabla de estados financieros.
     */
    selectedFinancialSource = linkedSignal<string | null>(() => {
        const result = this.studyResult();
        if (result) {
            const used = result.result?.summary?.calculationSource;
            if (!used || used === 'none') return null;
            return used === 'pdf' ? 'pdf_upload' : used;
        }
        const sources = this.step2Data()?.sources ?? [];
        if (!sources.length) return null;
        return sources.some(s => s.source === 'datacredito') ? 'datacredito' : 'pdf_upload';
    });
    studyResult = signal<PerformStudyResponse | null>(null);
    studyStatus = signal<{ code: string; label: string } | null>(null);
    studyRequest = signal<CreditStudyRequest | null>(null);
    studyDate = signal<string | null>(null);
    promissoryNote = signal<PromissoryNoteSummary | null>(null);

    hasFinancialData = computed(() => (this.step2Data()?.sources?.length ?? 0) > 0);
    studyCompleted = computed(() => !!this.studyResult());

    /** Modal de firma del pagaré. */
    promissoryNoteVisible = signal(false);

    /** El estudio cerrado ya no admite más acciones (pagaré, análisis IA). */
    isStudyClosed = computed(() => this.studyStatus()?.code === 'closed');

    /**
     * El pagaré solo aplica cuando el estudio es viable o viable con condiciones,
     * aún no está cerrado y no se ha generado un pagaré.
     */
    canSignPromissoryNote = computed(() => {
        const status = this.studyResult()?.viabilityStatus;
        return (status === 'approved' || status === 'conditional')
            && !this.isStudyClosed()
            && !this.promissoryNote();
    });

    /** Colores del chip de estado del pagaré según su código. */
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

    /** Cliente del estudio; el modal del pagaré lo usa para traer al firmante. */
    studyCustomerId = computed(() =>
        this.step1Data()?.customer?.id ?? this.studyResult()?.customer?.id ?? undefined
    );

    /** Configuración visual (ícono + colores) según el estado del estudio. */
    studyStatusConfig = computed(() => {
        const status = this.studyStatus();
        if (!status) return null;

        const map: Record<string, { icon: string; classes: string; dot: string }> = {
            pendingFinancialStatements: {
                icon: 'pi pi-file-import',
                classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
                dot: 'bg-amber-500'
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

        return { ...config, label: status.label };
    });

    /**
     * Habilitación de cada paso: un paso queda accesible si el estudio ya existe
     * (hay datos del cliente) o si el paso ya tiene su propia información.
     * Regla: si un paso tiene datos, nunca debe quedar bloqueado.
     */
    step2Enabled = computed(() => this.isDetailMode() || !!this.step1Data() || this.hasFinancialData());
    step3Enabled = computed(() => this.hasFinancialData() || this.studyCompleted());

    /** Datos del cliente (del step1) para el resumen del resultado. */
    resultCustomer = computed(() => {
        const customer = this.step1Data()?.customer;
        return {
            businessName: customer?.businessName ?? undefined,
            identificationNumber: customer?.identificationNumber ?? undefined,
            city: customer?.city ?? customer?.bureauProfile?.contact?.city ?? undefined
        };
    });

    /** Etiqueta del estudio para el ticket de soporte (cliente al que pertenece). */
    supportRecordLabel = computed(() => {
        const customer = this.step1Data()?.customer;
        return customer?.businessName ?? null;
    });

    /** Perfil de empresa para el resultado (nombre, nit, ciudad). */
    company = computed(() => {
        const user = this.authService.currentProfile();
        return {
            name: user?.companyName ?? '-',
            city: user?.companyCity ?? '-',
            nit: user?.companyNit ?? '-'
        };
    });

    /** Resumen corto de lo que solicita el cliente (para el step 3). */
    studyRequestSummary = computed(() => {
        const customer = this.step1Data()?.customer;
        const request = this.studyRequest();
        return {
            businessName: customer?.businessName ?? '—',
            identification: customer?.identificationNumber ?? '—',
            personType: customer?.personType?.label ?? null,
            requestedTerm: request?.requestedTerm ?? null,
            requestedCreditLine: request?.requestedCreditLine ?? null,
            studyDate: this.studyDate()
        };
    });

    canExtractPdf = computed(() => this.authService.currentProfile()?.permissions?.canExtractPdf ?? false);

    /** Modal de advertencia / resumen previo a crear el estudio. */
    summaryVisible = signal(false);

    /**
     * Modal de firma de autorización (habeas data): se abre cuando `from-bureau`
     * responde `authorization_pending` porque el titular aún no ha firmado.
     */
    authVisible = signal(false);
    /** true mientras se consulta el estado de la firma. */
    checkingAuth = signal(false);
    /** true mientras, tras confirmar la firma, se crea el estudio en el bureau. */
    finalizingStudy = signal(false);
    authInfo = signal<CustomerAuthorization | null>(null);
    /** Payload de la última consulta a bureau, para reintentar tras la firma. */
    private lastBureauPayload: CreateFromBureauPayload | null = null;

    identificationTypes = toSignal(this.parameterService.getByType('identification_type'));

    step1Form = new FormGroup({
        identificationTypeId: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        identificationNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        businessName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        titularEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        titularState: new FormControl<LocationOption | null>(null, { validators: [Validators.required] }),
        titularCity: new FormControl<LocationOption | null>(null, { validators: [Validators.required] }),
        // Representante legal: obligatorios solo con NIT (ver syncLegalRepValidators).
        legalRepName: new FormControl('', { nonNullable: true }),
        legalRepIdentificationTypeId: new FormControl<Parameter | null>(null),
        legalRepIdentificationNumber: new FormControl('', { nonNullable: true }),
        requestedTerm: new FormControl<number | null>(null, { validators: [Validators.required] }),
        requestedCreditLine: new FormControl<number | null>(null, { validators: [Validators.required] })
    });

    private selectedIdentificationType = toSignal(this.step1Form.controls.identificationTypeId.valueChanges, {
        initialValue: this.step1Form.controls.identificationTypeId.value
    });

    /** true cuando el tipo de identificación seleccionado es NIT (persona jurídica). */
    isNitSelected = computed(() => isBusinessDocType(this.selectedIdentificationType()));

    /** El mismo campo guarda el nombre completo (persona natural) o la razón social (jurídica). */
    businessNameLabel = computed(() => this.isNitSelected() ? 'Razón Social' : 'Nombre completo');

    /** El representante legal es una persona natural: se excluye el NIT de sus tipos de documento. */
    legalRepIdentificationTypes = computed(() =>
        (this.identificationTypes() ?? []).filter(t => !isBusinessDocType(t))
    );

    /** Departamento seleccionado del titular; la lista de ciudades depende de él. */
    titularRegionCode = signal<string | null>(null);

    /**
     * Snapshot de los datos de la solicitud para el modal de resumen.
     * Se captura al abrir el modal: los FormControl no son señales, por lo que
     * un `computed` que leyera el form no se recalcularía al escribir en él.
     */
    summary = signal<{
        identificationType: string;
        identificationNumber: string;
        businessName: string;
        titularEmail: string;
        titularCity: string;
        isLegalEntity: boolean;
        legalRepName: string;
        legalRepIdentification: string;
        requestedTerm: number | null;
        requestedCreditLine: number | null;
    }>({
        identificationType: '—',
        identificationNumber: '—',
        businessName: '—',
        titularEmail: '—',
        titularCity: '—',
        isLegalEntity: false,
        legalRepName: '—',
        legalRepIdentification: '—',
        requestedTerm: null,
        requestedCreditLine: null
    });

    /** Cliente cargado para precargar el step 1 (modo creación desde la ficha del cliente). */
    private prefillCustomer = signal<CustomerDetailModel | null>(null);
    private prefillApplied = false;

    constructor() {
        effect(() => {
            const id = this.creditStudyId();
            if (id) {
                this.loadSteps(id);
            }
        });

        // Al crear un estudio desde la ficha de un cliente, carga sus datos.
        effect(() => {
            const customerId = this.prefillCustomerId();
            // Solo en modo creación (sin estudio existente) y una sola vez.
            if (!customerId || this.isDetailMode() || this.prefillCustomer()) return;
            this.customersService.getCustomerById(customerId).pipe(
                takeUntilDestroyed(this.destroyRef)
            ).subscribe(customer => this.prefillCustomer.set(customer));
        });

        // Precarga el step 1 cuando ya tenemos el cliente y la lista de tipos de identificación.
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

        // La ciudad depende del departamento: al cambiarlo se recargan las opciones.
        this.step1Form.controls.titularState.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(state => {
            this.titularRegionCode.set(state?.code ?? null);
            this.step1Form.controls.titularCity.reset();
        });

        // Los datos del representante legal solo aplican a persona jurídica.
        let wasNit = this.isNitSelected();
        this.step1Form.controls.identificationTypeId.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(idType => {
            const isNit = isBusinessDocType(idType);
            if (isNit === wasNit) return;
            wasNit = isNit;
            this.syncLegalRepValidators(isNit);
        });

        this.destroyRef.onDestroy(() => this.stopLoaderMessages());
    }

    /**
     * Con NIT los campos del representante legal son obligatorios; para persona
     * natural se ocultan, así que se limpian valores y validadores para que no
     * bloqueen el envío.
     */
    private syncLegalRepValidators(isNit: boolean): void {
        const controls = [
            this.step1Form.controls.legalRepName,
            this.step1Form.controls.legalRepIdentificationTypeId,
            this.step1Form.controls.legalRepIdentificationNumber
        ];

        for (const control of controls) {
            if (isNit) {
                control.setValidators([Validators.required]);
            } else {
                control.clearValidators();
                control.reset(undefined, { emitEvent: false });
            }
            control.updateValueAndValidity({ emitEvent: false });
        }
    }

    /** Inicia la rotación de mensajes del loader animado. */
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

    private loadSteps(id: string): void {
        this.loading.set(true);
        this.creditStudyService.getCreditStudySteps(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((response) => {
            this.step1Data.set(response.step1);
            this.step2Data.set(response.step2);
            this.studyResult.set(response.step3 ?? null);
            this.studyRequest.set(response.request ?? null);
            this.studyDate.set(response.studyDate ?? null);
            this.promissoryNote.set(response.promissoryNote ?? null);
            this.studyStatus.set(response.status ? { code: response.status.code, label: response.status.label } : null);

            const businessName = response.step1?.customer?.businessName;
            if (businessName) {
                this.recentItemsService.setCreditStudy(String(id), `Estudio · ${businessName}`);
            }

            // Posiciona el stepper en el paso más avanzado disponible:
            // solo va al paso 3 si el estudio ya tiene resultado (step3); si no,
            // con estados financieros cargados queda en el paso 2.
            const hasStep2 = (response.step2?.sources?.length ?? 0) > 0;
            this.activeStep = response.step3 ? 3 : (hasStep2 ? 2 : (response.step1 ? 2 : 1));
        });
    }

    /** Abre en otra pestaña el PDF firmado del pagaré (URL temporal del storage). */
    openPromissoryNoteDocument(): void {
        const url = this.promissoryNote()?.documentUrl;
        if (url) {
            window.open(url, '_blank', 'noopener');
        }
    }

    /** Abre en otra pestaña el enlace de firma electrónica del pagaré. */
    openPromissoryNoteSigningUrl(): void {
        const url = this.promissoryNote()?.signingUrl;
        if (url) {
            window.open(url, '_blank', 'noopener');
        }
    }

    /** Al cerrar el modal con el pagaré generado se refresca el estudio. */
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

    /** Abre el modal de advertencia con el resumen antes de crear el estudio. */
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
            isLegalEntity: this.isNitSelected(),
            legalRepName: v.legalRepName || '—',
            legalRepIdentification: v.legalRepIdentificationTypeId
                ? `${v.legalRepIdentificationTypeId.label} ${v.legalRepIdentificationNumber}`.trim()
                : v.legalRepIdentificationNumber || '—',
            requestedTerm: v.requestedTerm,
            requestedCreditLine: v.requestedCreditLine
        });

        this.summaryVisible.set(true);
    }

    /** Confirmación del modal: llama al backend para crear el estudio desde el bureau. */
    onConfirmCreateStudy(): void {
        const v = this.step1Form.getRawValue();

        const payload: CreateFromBureauPayload = {
            identificationTypeCode: v.identificationTypeId?.code ?? '',
            numeroIdentificacion: v.identificationNumber,
            apellidoRazonSocial: v.businessName,
            titularEmail: v.titularEmail,
            titularCity: v.titularCity?.name ?? '',
            requestedTerm: v.requestedTerm ?? 0,
            requestedCreditLine: v.requestedCreditLine ?? 0
        };

        // Persona jurídica: el objeto incluye además al representante legal.
        if (this.isNitSelected()) {
            payload.legalRepName = v.legalRepName;
            payload.legalRepIdentificationTypeCode = v.legalRepIdentificationTypeId?.code ?? '';
            payload.legalRepIdentificationNumber = v.legalRepIdentificationNumber;
        }
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
            // El titular aún no ha firmado la autorización: abre el modal de firma.
            if (response.status === 'authorization_pending' && response.authorization) {
                this.authInfo.set(response.authorization);
                this.summaryVisible.set(false);
                this.authVisible.set(true);
                return;
            }

            this.onStudyCreated(response.creditStudyId);
        });
    }

    /** Navega al estudio recién creado y refresca la cuota. */
    private onStudyCreated(creditStudyId?: string): void {
        if (!creditStudyId) return;
        this.summaryVisible.set(false);
        this.authVisible.set(false);
        this.notificationService.success('Estudio de crédito creado correctamente');

        // Crear un estudio consume cuota: refresca permisos.
        this.authService.refreshProfile();

        this.router.navigate(['/app/estudio-credito/detalle-estudio', creditStudyId]);
    }

    /**
     * Botón "Verificar firma" del modal de autorización: consulta si el titular
     * ya firmó. Si firmó, relanza `from-bureau` (que esta vez crea el estudio).
     */
    onCheckAuthorization(): void {
        const identificationNumber = this.lastBureauPayload?.numeroIdentificacion;
        if (!identificationNumber) return;

        this.checkingAuth.set(true);
        this.creditStudyService.getCustomerAuthorization(identificationNumber).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (auth) => {
                this.authInfo.set(auth);
                if (auth.isSigned) {
                    // Transiciona el modal de "verificando" a "creando estudio".
                    this.checkingAuth.set(false);
                    this.createAfterSignature();
                } else {
                    this.checkingAuth.set(false);
                    this.notificationService.info('El titular aún no ha firmado la autorización. Inténtelo de nuevo en unos minutos.', 'Firma pendiente');
                }
            },
            error: () => this.checkingAuth.set(false)
        });
    }

    /** Relanza la consulta al bureau una vez el titular firmó, para crear el estudio. */
    private createAfterSignature(): void {
        const payload = this.lastBureauPayload;
        if (!payload) return;

        // Muestra el loader "Creando estudio..." dentro del modal de firma.
        this.finalizingStudy.set(true);
        this.startLoaderMessages(this.createStudyMessages);

        this.creditStudyService.createFromBureau(payload).pipe(
            finalize(() => {
                this.finalizingStudy.set(false);
                this.stopLoaderMessages();
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((response) => {
            // Caso poco probable: el backend aún no refleja la firma.
            if (response.status === 'authorization_pending' && response.authorization) {
                this.authInfo.set(response.authorization);
                this.notificationService.warn('La autorización aún figura como pendiente. Inténtelo de nuevo en unos segundos.');
                return;
            }
            this.onStudyCreated(response.creditStudyId);
        });
    }

    // ─── Step 2: carga de estados financieros ────────────────────────────────

    onUploadFinancialStatements(): void {
        this.confirmService.confirm({
            title: 'Cargar Estados Financieros',
            message: `El documento debe ser un PDF digital legible de máximo ${this.MAX_PDF_SIZE_MB} MB. No se aceptan escaneos, fotografías ni capturas de pantalla.`,
            kind: 'info',
            icon: 'pi pi-file-pdf',
            acceptLabel: 'Seleccionar archivo',
            onAccept: () => this.openFileSelector()
        });
    }

    private openFileSelector(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';

        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;

            if (file.type !== 'application/pdf') {
                this.notificationService.error('Solo se permiten archivos PDF', 'Formato inválido');
                return;
            }

            if (file.size > this.MAX_PDF_SIZE_BYTES) {
                this.notificationService.error(
                    `El archivo excede el tamaño máximo permitido de ${this.MAX_PDF_SIZE_MB} MB`,
                    'Archivo muy grande'
                );
                return;
            }

            this.extractFinancialStatements(file);
        };

        input.click();
    }

    private extractFinancialStatements(file: File): void {
        const id = this.creditStudyId();
        if (!id) return;

        this.extractingPdf.set(true);
        this.startLoaderMessages(this.extractPdfMessages);
        this.creditStudyService.extractFinancialStatements(id, file).pipe(
            finalize(() => {
                this.extractingPdf.set(false);
                this.stopLoaderMessages();
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((response) => {
            if (!response.success) {
                this.notificationService.error('No fue posible extraer los estados financieros del documento', 'Extracción fallida');
                return;
            }

            this.notificationService.success('Estados financieros procesados correctamente');
            // Recargar el estudio para traer el step2 ya poblado.
            this.loadSteps(id);
        });
    }

    // ─── Step 3: realizar el estudio ─────────────────────────────────────────

    onPerformStudy(activateCallback?: (step: number) => void): void {
        const id = this.creditStudyId();
        if (!id) return;

        const source = this.selectedFinancialSource();
        const sourceLabel = source === 'datacredito' ? 'Datacrédito' : 'Estados Financieros (PDF)';

        this.confirmService.confirm({
            title: 'Realizar Estudio de Crédito',
            message: `Se ejecutará el análisis de viabilidad con la información del cliente y los estados financieros de la fuente "${sourceLabel}". ` +
                'El sistema calculará el score y el resultado de viabilidad de la solicitud. Esta acción no se puede deshacer.',
            kind: 'warn',
            icon: 'pi pi-bolt',
            acceptLabel: 'Sí, realizar estudio',
            onAccept: () => {
                this.performingStudy.set(true);
                this.creditStudyService.performStudy(id, source).pipe(
                    finalize(() => this.performingStudy.set(false)),
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe((result) => {
                    this.studyResult.set(result);
                    if (result.status) {
                        this.studyStatus.set({ code: result.status.code, label: result.status.label });
                    }
                    this.notificationService.success('Estudio de crédito realizado exitosamente');
                    activateCallback?.(3);
                });
            }
        });
    }

    /** Descarga el PDF del estudio. Solo tiene sentido cuando el estudio ya tiene resultado. */
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
                const fallbackName = `estudio-credito-${businessName ? businessName.replace(/\s+/g, '-') : id}.pdf`;
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

    onCancel(): void {
        this.router.navigate(['/app/estudio-credito']);
    }
}
