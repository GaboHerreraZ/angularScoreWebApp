import { Component, DestroyRef, effect, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';
import { StepperModule } from 'primeng/stepper';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { CreditStudyService } from '../credit-study.service';
import { CreateCreditStudy } from '@/app/types/credit-study';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { StudyResult } from './study-result/study-result';
import { AutoCompleteComponent } from '@/app/shared/components/auto-complete/auto-complete';
import { AutoCompleteOption } from '@/app/shared/components/auto-complete/auto-complete.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { Parameter } from '@/app/types/parameter';
import { AuthService } from '@/app/core/services/auth.service';
import { HelpTooltip } from '@/app/shared/components/help-tooltip/help-tooltip';
import { ConfirmService, provideConfirm } from '@/app/shared/services/confirm.service';
import { RecentItemsService } from '@/app/shared/services/recent-items.service';

@Component({
    selector: 'app-credit-study-detail',
    standalone: true,
    imports: [
        CommonModule,
        CurrencyPipe,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        FloatLabelModule,
        FluidModule,
        MessageModule,
        DatePickerModule,
        StepperModule,
        CardModule,
        BadgeModule,
        SelectModule,
        SkeletonModule,
        ConfirmDialogModule,
        DialogModule,
        AutoCompleteComponent,
        StudyResult,
        HelpTooltip
    ],
    providers: [provideConfirm()],
    templateUrl: './credit-study-detail.html'
})
export class CreditStudyDetail  {
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private creditStudyService = inject(CreditStudyService);
    private notificationService = inject(NotificationService);
    private parameterService = inject(ParameterService);
    private confirmService = inject(ConfirmService);
    private recentItemsService = inject(RecentItemsService);
    private sanitizer = inject(DomSanitizer);

    private authService = inject(AuthService);


    company = computed(() => {
        const user = this.authService.currentProfile();
        return {
            name: user?.companyName ?? '-',
            city: user?.companyCity ?? '-',
            nit: user?.companyNit ?? '-'
        };
    })

    canExtractPdf = computed(() => {
        const user = this.authService.currentProfile();
        return user?.permissions.canExtractPdf;
    });

    creditStudyId = toSignal(
        this.route.params.pipe(
            map(params => params['id'])
        )
    );

    private queryCustomerId = toSignal(
        this.route.queryParams.pipe(map(qp => qp['customerId']))
    );
    private queryCustomerName = toSignal(
        this.route.queryParams.pipe(map(qp => qp['customerName']))
    );

    private readonly MAX_PDF_SIZE_MB = 10;
    private readonly MAX_PDF_SIZE_BYTES = this.MAX_PDF_SIZE_MB * 1024 * 1024;

    loading = signal(false);
    extractingPdf = signal(false);
    activeStep = 1;
    performingStudy = signal(false);
    approvingCredit = signal(false);
    studyCompleted = signal(false);
    studyResult = signal<CreateCreditStudy | null>(null);

    previewVisible = signal(false);
    previewHtml = signal<SafeHtml>('');
    loadingPreview = signal(false);

    studyCustomer = computed(() => (this.studyResult() as any)?.customer as { businessName?: string; identificationNumber?: string; city?: string } | undefined);

    latestPromissoryNote = computed(() => {
        const notes = this.studyResult()?.promissoryNotes;
        if (!notes?.length) return null;
        return notes.reduce((latest, note) =>
            new Date(note.createdAt) > new Date(latest.createdAt) ? note : latest
        , notes[0]);
    });

    promissoryNoteStatus = computed(() => this.latestPromissoryNote()?.status?.code ?? null);
    signedDocumentUrl = computed(() => this.latestPromissoryNote()?.signedDocumentUrl ?? null);

    isReadOnly = computed(() => {
        const statusCode = this.studyResult()?.status?.code;
        const noteStatus = this.promissoryNoteStatus();
        return statusCode === 'studyClosed'
            || noteStatus === 'pendingSignature'
            || noteStatus === 'signed';
    });

    customerUrlParams = signal<Record<string, string | number>>({
        companyId: this.creditStudyService.companyId()
    });

    periods = toSignal(this.parameterService.getByType('period'));

    private customerIdSignal = signal<string>('');

    private formValuesSignal = signal<any>({});

    totalAssets = computed(() => {
        const values = this.formValuesSignal();
        return (values.totalCurrentAssets ?? 0) + (values.totalNonCurrentAssets ?? 0);
    });

    totalLiabilities = computed(() => {
        const values = this.formValuesSignal();
        return (values.totalCurrentLiabilities ?? 0) + (values.totalNonCurrentLiabilities ?? 0);
    });
    equity = computed(() => {
        const totalLiabilities = this.totalLiabilities();
        const totalAssets = this.totalAssets();
        return (totalAssets ?? 0) - (totalLiabilities ?? 0);
    });
    grossProfit = computed(() => {
        const values = this.formValuesSignal();
        return (values.ordinaryActivityRevenue ?? 0) - (values.costOfSales ?? 0);
    });

    step1Form = new FormGroup({
        customerId: new FormControl<AutoCompleteOption | null>(null, { validators: [Validators.required] }),
        customerName: new FormControl<string>({ value: '', disabled: true }), // Para edición
        studyDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
        requestedTerm: new FormControl<number | null>(null, { validators: [Validators.required] }),
        requestedCreditLine: new FormControl<number | null>(null, { validators: [Validators.required] }),
        notes: new FormControl('', { nonNullable: true  })
    });

    isEditMode = computed(() => !!this.creditStudyId());

    step2Form = new FormGroup({
        cashAndEquivalents: new FormControl<number | null>(null, { validators: [Validators.required] }),
        accountsReceivable1: new FormControl<number | null>(null, { validators: [Validators.required] }),
        accountsReceivable2: new FormControl<number | null>(null, { validators: [Validators.required] }),
        balanceSheetDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
        inventories1: new FormControl<number | null>(null, { validators: [Validators.required] }),
        inventories2: new FormControl<number | null>(null, { validators: [Validators.required] }),
        totalCurrentAssets: new FormControl<number | null>(null, { validators: [Validators.required] }),
        fixedAssetsProperty: new FormControl<number | null>(null, { validators: [Validators.required] }),
        totalNonCurrentAssets: new FormControl<number | null>(null, { validators: [Validators.required] }),
        shortTermFinancialLiabilities: new FormControl<number | null>(null, { validators: [Validators.required] }),
        suppliers1: new FormControl<number | null>(null, { validators: [Validators.required] }),
        suppliers2: new FormControl<number | null>(null, { validators: [Validators.required] }),
        totalCurrentLiabilities: new FormControl<number | null>(null, { validators: [Validators.required] }),
        longTermFinancialLiabilities: new FormControl<number | null>(null, { validators: [Validators.required] }),
        totalNonCurrentLiabilities: new FormControl<number | null>(null, { validators: [Validators.required] }),
        retainedEarnings: new FormControl<number | null>(null, { validators: [Validators.required] }),
        incomeStatementId: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        ordinaryActivityRevenue: new FormControl<number | null>(null, { validators: [Validators.required] }),
        costOfSales: new FormControl<number | null>(null, { validators: [Validators.required] }),
        administrativeExpenses: new FormControl<number | null>(null, { validators: [Validators.required] }),
        sellingExpenses: new FormControl<number | null>(null, { validators: [Validators.required] }),
        depreciation: new FormControl<number | null>(null, { validators: [Validators.required] }),
        amortization: new FormControl<number | null>(null, { validators: [Validators.required] }),
        financialExpenses: new FormControl<number | null>(null, { validators: [Validators.required] }),
        taxes: new FormControl<number | null>(null, { validators: [Validators.required] }),
        netIncome: new FormControl<number | null>(null, { validators: [Validators.required] })
    });

    constructor() {
        effect(() => {
            const id = this.creditStudyId();
            if (id) {
                this.loadCreditStudy(id);
            }
        });

        effect(() => {
            const isEdit = this.isEditMode();
            const customerIdControl = this.step1Form.get('customerId');

            if (isEdit) {
                customerIdControl?.clearValidators();
            } else {
                customerIdControl?.setValidators([Validators.required]);
            }
            customerIdControl?.updateValueAndValidity();
        });

        // Pre-set customer from query params (when navigating from customer credit studies)
        effect(() => {
            const customerId = this.queryCustomerId();
            const customerName = this.queryCustomerName();
            if (customerId && customerName) {
                this.step1Form.patchValue({
                    customerId: { id: Number(customerId), name: customerName }
                });
            }
        });

        this.step2Form.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(values => {
            this.formValuesSignal.set(values);
        });
    }

    loadCreditStudy(id: string): void {
        this.loading.set(true);
        this.creditStudyService.getCreditStudyById(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((creditStudy) => {
            this.customerIdSignal.set(creditStudy.customerId);

            const businessName = (creditStudy as any).customer?.businessName ?? '';
            if (creditStudy.id && businessName) {
                this.recentItemsService.setCreditStudy(String(creditStudy.id), `Estudio · ${businessName}`);
            }

            const period = this.periods()?.find(p => p.id === creditStudy.incomeStatementId);

            this.step1Form.patchValue({
                customerId: null,
                customerName: (creditStudy as any).customer?.businessName ?? '',
                studyDate: creditStudy.studyDate ? new Date(creditStudy.studyDate) : null,
                requestedTerm: creditStudy.requestedTerm ?? null,
                requestedCreditLine: creditStudy.requestedCreditLine ?? null,
                notes: creditStudy.notes ?? ''
            });

            this.step2Form.patchValue({
                cashAndEquivalents: creditStudy.cashAndEquivalents ?? null,
                accountsReceivable1: creditStudy.accountsReceivable1 ?? null,
                accountsReceivable2: creditStudy.accountsReceivable2 ?? null,
                balanceSheetDate: creditStudy.balanceSheetDate ? new Date(creditStudy.balanceSheetDate) : null,
                inventories1: creditStudy.inventories1 ?? null,
                inventories2: creditStudy.inventories2 ?? null,
                totalCurrentAssets: creditStudy.totalCurrentAssets ?? null,
                fixedAssetsProperty: creditStudy.fixedAssetsProperty ?? null,
                totalNonCurrentAssets: creditStudy.totalNonCurrentAssets ?? null,
                shortTermFinancialLiabilities: creditStudy.shortTermFinancialLiabilities ?? null,
                suppliers1: creditStudy.suppliers1 ?? null,
                suppliers2: creditStudy.suppliers2 ?? null,
                totalCurrentLiabilities: creditStudy.totalCurrentLiabilities ?? null,
                longTermFinancialLiabilities: creditStudy.longTermFinancialLiabilities ?? null,
                totalNonCurrentLiabilities: creditStudy.totalNonCurrentLiabilities ?? null,
                retainedEarnings: creditStudy.retainedEarnings ?? null,
                incomeStatementId: period ?? null,
                ordinaryActivityRevenue: creditStudy.ordinaryActivityRevenue ?? null,
                costOfSales: creditStudy.costOfSales ?? null,
                administrativeExpenses: creditStudy.administrativeExpenses ?? null,
                sellingExpenses: creditStudy.sellingExpenses ?? null,
                depreciation: creditStudy.depreciation ?? null,
                amortization: creditStudy.amortization ?? null,
                financialExpenses: creditStudy.financialExpenses ?? null,
                taxes: creditStudy.taxes ?? null,
                netIncome: creditStudy.netIncome ?? null
            });

            this.formValuesSignal.set(this.step2Form.getRawValue());

            if (creditStudy.viabilityStatus != null || creditStudy.stabilityFactor != null) {
                this.studyResult.set(creditStudy);
                this.studyCompleted.set(true);
            } else {
                this.studyCompleted.set(false);
            }

            const noteStatus = creditStudy.promissoryNotes?.length
                ? creditStudy.promissoryNotes.reduce((l, n) => new Date(n.createdAt) > new Date(l.createdAt) ? n : l, creditStudy.promissoryNotes[0]).status?.code
                : null;
            if (creditStudy.status?.code === 'studyClosed' || noteStatus === 'pendingSignature' || noteStatus === 'signed') {
                this.step1Form.disable();
                this.step2Form.disable();
            } else {
                this.step1Form.enable();
                this.step2Form.enable();
                this.step1Form.get('customerName')?.disable();
            }
        });
    }


    getInvalidCount(stepForm: FormGroup): number {
        let count = 0;
        Object.keys(stepForm.controls).forEach(key => {
            const control = stepForm.get(key);
            if (control && control.invalid) {
                count++;
            }
        });
        return count;
    }

    isStepInvalid(stepForm: FormGroup): boolean {
        return stepForm.invalid && stepForm.touched;
    }

    onSave(): void {
        this.step1Form.markAllAsTouched();
        this.step2Form.markAllAsTouched();

        if (this.step1Form.invalid || this.step2Form.invalid) {
            this.notificationService.warn('Por favor complete todos los campos requeridos', 'Validación');
            return;
        }

        this.loading.set(true);
        const step1Data = this.step1Form.getRawValue();
        const step2Data = this.step2Form.getRawValue();
        const customerId = this.isEditMode()
            ? this.customerIdSignal()
            : step1Data.customerId?.id.toString() ?? '';

        const creditStudyData = {
            customerId,
            studyDate: step1Data.studyDate,
            notes: step1Data.notes,
            requestedTerm: step1Data.requestedTerm ?? 0,
            requestedCreditLine: step1Data.requestedCreditLine ?? 0,
            balanceSheetDate: step2Data.balanceSheetDate ?? undefined,
            cashAndEquivalents: step2Data.cashAndEquivalents ?? 0,
            accountsReceivable1: step2Data.accountsReceivable1 ?? 0,
            accountsReceivable2: step2Data.accountsReceivable2 ?? 0,
            inventories1: step2Data.inventories1 ?? 0,
            inventories2: step2Data.inventories2 ?? 0,
            totalCurrentAssets: step2Data.totalCurrentAssets ?? 0,
            fixedAssetsProperty: step2Data.fixedAssetsProperty ?? 0,
            totalNonCurrentAssets: step2Data.totalNonCurrentAssets ?? 0,
            totalAssets: this.totalAssets(),
            shortTermFinancialLiabilities: step2Data.shortTermFinancialLiabilities ?? 0,
            suppliers1: step2Data.suppliers1 ?? 0,
            suppliers2: step2Data.suppliers2 ?? 0,
            totalCurrentLiabilities: step2Data.totalCurrentLiabilities ?? 0,
            longTermFinancialLiabilities: step2Data.longTermFinancialLiabilities ?? 0,
            totalNonCurrentLiabilities: step2Data.totalNonCurrentLiabilities ?? 0,
            totalLiabilities: this.totalLiabilities(),
            retainedEarnings: step2Data.retainedEarnings ?? 0,
            equity: this.equity(),
            incomeStatementId: (step2Data.incomeStatementId as any)?.id ?? 0,
            ordinaryActivityRevenue: step2Data.ordinaryActivityRevenue ?? 0,
            costOfSales: step2Data.costOfSales ?? 0,
            grossProfit: this.grossProfit(),
            administrativeExpenses: step2Data.administrativeExpenses ?? 0,
            sellingExpenses: step2Data.sellingExpenses ?? 0,
            depreciation: step2Data.depreciation ?? 0,
            amortization: step2Data.amortization ?? 0,
            financialExpenses: step2Data.financialExpenses ?? 0,
            taxes: step2Data.taxes ?? 0,
            netIncome: step2Data.netIncome ?? 0,
        };

        const operation$ = this.creditStudyId()
            ? this.creditStudyService.updateCreditStudy(this.creditStudyId()!, creditStudyData)
            : this.creditStudyService.createCreditStudy(creditStudyData);

        operation$.pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((result: any) => {
            const message = this.creditStudyId()
                ? 'Estudio de crédito actualizado correctamente'
                : 'Estudio de crédito creado correctamente';
            this.notificationService.success(message);

            if (!this.creditStudyId() && result?.id) {
                const fromCustomerId = this.queryCustomerId();
                if (fromCustomerId) {
                    this.router.navigate(['/app/clientes/detalle-cliente', fromCustomerId, 'estudios-credito']);
                } else {
                    this.router.navigate(['/app/estudio-credito/detalle-estudio', result.id]).then(() => {
                        setTimeout(() => {
                            this.activeStep = 3;
                        }, 100);
                    });
                }
            } else if (this.creditStudyId()) {
                this.loadCreditStudy(this.creditStudyId()!);
            }
        });
    }

    onUploadFinancialStatements(): void {
        this.step1Form.markAllAsTouched();

        if (this.step1Form.invalid) {
            this.notificationService.warn(
                'Complete los datos del cupo (cliente, fecha, plazo, cupo y observaciones) antes de cargar los estados financieros',
                'Validación'
            );
            return;
        }

        this.confirmService.confirm({
            title: 'Cargar Estados Financieros',
            message: `Al cargar los estados financieros se creará el estudio de crédito automáticamente a partir del documento.\n\n` +
                `Para una extracción exitosa, el archivo debe cumplir con las siguientes condiciones:\n\n` +
                `- Formato PDF\n` +
                `- Peso máximo de ${this.MAX_PDF_SIZE_MB} MB\n` +
                `- Debe ser un documento digital legible (no se aceptan copias escaneadas, fotografías ni capturas de pantalla)`,
            kind: 'info',
            icon: 'pi pi-file-pdf',
            acceptLabel: 'Proceder',
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

            const step1Data = this.step1Form.getRawValue();
            const customerId = step1Data.customerId?.id?.toString() ?? '';
            const studyDate = step1Data.studyDate ? this.toIsoDate(step1Data.studyDate) : '';

            if (!customerId || !studyDate) {
                this.notificationService.warn('Complete los datos del cupo antes de cargar los estados financieros', 'Validación');
                return;
            }

            this.extractingPdf.set(true);
            this.creditStudyService.extractFinancialData(file, {
                customerId,
                studyDate,
                requestedTerm: step1Data.requestedTerm ?? 0,
                requestedCreditLine: step1Data.requestedCreditLine ?? 0,
                notes: step1Data.notes
            }).pipe(
                finalize(() => this.extractingPdf.set(false)),
                takeUntilDestroyed(this.destroyRef)
            ).subscribe((study) => {
                this.notificationService.success('Estudio de crédito creado a partir de los estados financieros');
                this.navigateToCreatedStudy(study);
            });
        };

        input.click();
    }

    private toIsoDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private navigateToCreatedStudy(study: CreateCreditStudy): void {
        const fromCustomerId = this.queryCustomerId();
        if (fromCustomerId) {
            this.router.navigate(['/app/clientes/detalle-cliente', fromCustomerId, 'estudios-credito']);
        } else if (study?.id) {
            this.router.navigate(['/app/estudio-credito/detalle-estudio', study.id]);
        }
    }

    onViewCustomer(): void {
        const customerId = this.customerIdSignal();
        if (!customerId) return;
        this.router.navigate(['/app/clientes/detalle-cliente', customerId, 'informacion'], {
            queryParams: { returnUrl: this.router.url }
        });
    }

    onCancel(): void {
        const fromCustomerId = this.queryCustomerId();
        if (fromCustomerId) {
            this.router.navigate(['/app/clientes/detalle-cliente', fromCustomerId, 'estudios-credito']);
        } else {
            this.router.navigate(['/app/estudio-credito']);
        }
    }

    isInvalid(form: FormGroup, controlName: string): boolean {
        const control = form.get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(form: FormGroup, controlName: string): string {
        const control = form.get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        return '';
    }

    canSaveStudy(): boolean {
        return this.step1Form.valid && this.step2Form.valid;
    }

    canPerformStudy(): boolean {
        return this.isEditMode() && !!this.creditStudyId();
    }

    private readonly fieldLabels: Record<string, string> = {
        customerId: 'Cliente',
        studyDate: 'Fecha del Estudio',
        requestedTerm: 'Plazo Solicitado',
        requestedCreditLine: 'Cupo de Crédito Solicitado',
        notes: 'Observaciones',
        cashAndEquivalents: 'Efectivo y Equivalentes',
        accountsReceivable1: 'Cuentas Por Cobrar Periodo Anterior',
        accountsReceivable2: 'Cuentas Por Cobrar Periodo Actual',
        balanceSheetDate: 'Fecha Balance General',
        inventories1: 'Inventario Periodo Anterior',
        inventories2: 'Inventario Periodo Actual',
        totalCurrentAssets: 'Total Activos Corrientes',
        fixedAssetsProperty: 'Activos Fijos / Propiedad',
        totalNonCurrentAssets: 'Total Activos No Corrientes',
        shortTermFinancialLiabilities: 'Obligaciones Financieras Corrientes',
        suppliers1: 'Cuentas Comerciales Por Pagar Año Anterior',
        suppliers2: 'Cuentas Comerciales Por Pagar Año Actual',
        totalCurrentLiabilities: 'Total Pasivos Corrientes',
        longTermFinancialLiabilities: 'Obligaciones Financieras No Corrientes',
        totalNonCurrentLiabilities: 'Total Pasivos No Corrientes',
        retainedEarnings: 'Ganancias Acumuladas',
        incomeStatementId: 'Período',
        ordinaryActivityRevenue: 'Ingresos Actividad Ordinaria',
        costOfSales: 'Costos De Venta',
        administrativeExpenses: 'Gastos Administrativos',
        sellingExpenses: 'Gastos de Ventas o Distribución',
        depreciation: 'Depreciación',
        amortization: 'Amortización',
        financialExpenses: 'Gastos Financieros',
        taxes: 'Impuestos',
        netIncome: 'Utilidad Neta del Ejercicio'
    };

    private getMissingRequiredFields(): string[] {
        const missing: string[] = [];
        const forms: FormGroup[] = [this.step1Form, this.step2Form];
        for (const form of forms) {
            Object.keys(form.controls).forEach(key => {
                const control = form.get(key);
                if (control?.invalid && control.errors?.['required']) {
                    missing.push(this.fieldLabels[key] ?? key);
                }
            });
        }
        return missing;
    }

    onPerformStudy(activateCallback: (step: number) => void): void {
        if (!this.creditStudyId()) {
            return;
        }

        this.step1Form.markAllAsTouched();
        this.step2Form.markAllAsTouched();

        const missing = this.getMissingRequiredFields();
        if (missing.length) {
            this.notificationService.warn(
                `Faltan campos requeridos: ${missing.join(', ')}.`,
                'Campos requeridos faltantes'
            );
            return;
        }

        this.confirmService.confirm({
            title: 'Confirmar Estudio',
            message: '¿Está seguro de que desea iniciar el proceso de estudio de crédito? Esta acción no se puede deshacer.',
            kind: 'warn',
            acceptLabel: 'Sí, realizar estudio',
            onAccept: () => {
                this.performingStudy.set(true);

                this.creditStudyService.performCreditStudy(this.creditStudyId()!).pipe(
                    finalize(() => this.performingStudy.set(false)),
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe((data: any) => {
                    this.notificationService.success('Estudio de crédito realizado exitosamente');
                    this.studyResult.set(data);
                    this.studyCompleted.set(true);
                    setTimeout(() => activateCallback(4), 300);
                });
            }
        });
    }

    onApproveCredit(): void {
        const id = this.creditStudyId();
        if (!id) {
            return;
        }

        this.loadingPreview.set(true);
        this.creditStudyService.previewPromissoryNote(id).pipe(
            finalize(() => this.loadingPreview.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((response) => {
            this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(response.html));
            this.previewVisible.set(true);
        });
    }

    decliningSignature = signal(false);

    onDeclineSignature(): void {
        const note = this.latestPromissoryNote();
        if (!note) return;

        this.confirmService.confirm({
            title: 'Cancelar Firma del Pagaré',
            message: '¿Está seguro de que desea cancelar la firma del pagaré? El documento dejará de estar disponible para el cliente.',
            kind: 'danger',
            acceptLabel: 'Sí, cancelar firma',
            rejectLabel: 'Volver',
            onAccept: () => {
                this.decliningSignature.set(true);

                this.creditStudyService.declinePromissoryNote(note.id).pipe(
                    finalize(() => this.decliningSignature.set(false)),
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe(() => {
                    this.notificationService.success('La firma del pagaré ha sido cancelada.');
                    this.loadCreditStudy(this.creditStudyId()!);
                });
            }
        });
    }

    onConfirmApproveCredit(): void {
        const id = this.creditStudyId();
        if (!id) {
            return;
        }

        this.previewVisible.set(false);
        this.approvingCredit.set(true);

        this.creditStudyService.approveCreditStudy(id).pipe(
            finalize(() => this.approvingCredit.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.notificationService.success(
                    'Crédito aprobado. Se ha enviado el pagaré al cliente para su firma.'
                );
                this.loadCreditStudy(this.creditStudyId()!);
            },
            error: () => {
                // El errorInterceptor ya muestra la notificación de error
            }
        });
    }
}
