import { Component, DestroyRef, effect, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
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
import { ConfirmationService } from 'primeng/api';
import { CreditStudyService } from '../credit-study.service';
import { CreateCreditStudy } from '@/app/types/credit-study';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { AutoCompleteComponent } from '@/app/shared/components/auto-complete/auto-complete';
import { AutoCompleteOption } from '@/app/shared/components/auto-complete/auto-complete.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { AuthService } from '@/app/core/services/auth.service';

@Component({
    selector: 'app-credit-study-detail',
    standalone: true,
    imports: [
        CommonModule,
        CurrencyPipe,
        DatePipe,
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
        AutoCompleteComponent
    ],
    providers: [ConfirmationService],
    templateUrl: './credit-study-detail.html'
})
export class CreditStudyDetail implements OnInit {
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private creditStudyService = inject(CreditStudyService);
    private notificationService = inject(NotificationService);
    private parameterService = inject(ParameterService);
    private confirmationService = inject(ConfirmationService);

    private authSerice = inject(AuthService);


    company = computed(() => {
        const user = this.authSerice.currentProfile();
        const company = user?.userCompanies?.[0]?.company;
        return {
            name: company?.name ?? '-',
            city: company?.city ?? '-',
            nit: company?.nit ?? '-'
        };
    })


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

    loading = signal(false);
    activeStep = 1;
    performingStudy = signal(false);
    studyCompleted = signal(false);
    studyResult = signal<CreateCreditStudy | null>(null);

    scoreStatus = computed(() => {
        const factor = this.studyResult()?.stabilityFactor ?? 0;
        if (factor >= 0.66) {
            return {
                bg: 'bg-green-50',
                border: 'border-green-200',
                iconBg: 'bg-green-500',
                icon: 'pi pi-check-circle',
                titleColor: 'text-green-700',
                title: 'Cupo Aprobado',
                description: 'El análisis crediticio indica que el cliente es apto para el cupo solicitado.',
                riskLabel: 'Bajo Riesgo',
                interpretation: 'Riesgo bajo. El cliente presenta excelentes indicadores financieros con amplia capacidad de pago para el monto solicitado.'
            };
        } else if (factor >= 0.33) {
            return {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                iconBg: 'bg-blue-500',
                icon: 'pi pi-info-circle',
                titleColor: 'text-blue-700',
                title: 'Cupo Aprobado con Condiciones',
                description: 'El análisis crediticio indica que el cliente es apto para el cupo, sujeto a condiciones adicionales.',
                riskLabel: 'Riesgo Moderado',
                interpretation: 'Riesgo moderado. El cliente presenta indicadores financieros aceptables con capacidad de pago adecuada, pero se recomienda monitoreo periódico.'
            };
        } else {
            return {
                bg: 'bg-red-50',
                border: 'border-red-200',
                iconBg: 'bg-red-500',
                icon: 'pi pi-times-circle',
                titleColor: 'text-red-700',
                title: 'Cupo No Aprobado',
                description: 'El análisis crediticio indica que el cliente no cumple con los requisitos mínimos para el cupo solicitado.',
                riskLabel: 'Alto Riesgo',
                interpretation: 'Riesgo alto. El cliente presenta indicadores financieros insuficientes y no cuenta con la capacidad de pago necesaria para el monto solicitado.'
            };
        }
    });

    scorePercentage = computed(() => Math.round((this.studyResult()?.stabilityFactor ?? 0) * 100));

    studyCustomer = computed(() => (this.studyResult() as any)?.customer as { businessName?: string; identificationNumber?: string; city?: string } | undefined);

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
    netIncome = computed(() => {
        const values = this.formValuesSignal();
        return (values.ordinaryActivityRevenue ?? 0) - (values.costOfSales ?? 0);
    });

    step1Form = new FormGroup({
        customerId: new FormControl<AutoCompleteOption | null>(null, { validators: [Validators.required] }),
        customerName: new FormControl<string>({ value: '', disabled: true }), // Para edición
        studyDate: new FormControl<Date | null>(null, { validators: [Validators.required] }),
        requestedTerm: new FormControl<number | null>(null, { validators: [Validators.required] }),
        requestedMonthlyCreditLine: new FormControl<number | null>(null, { validators: [Validators.required] }),
        notes: new FormControl('', { nonNullable: true  })
    });

    isEditMode = computed(() => !!this.creditStudyId());

    step2Form = new FormGroup({
        cashAndEquivalents: new FormControl<number | null>(null, { validators: [Validators.required] }),
        accountsReceivable1: new FormControl<number | null>(null, { validators: [Validators.required] }),
        accountsReceivable2: new FormControl<number | null>(null, { validators: [Validators.required] }),
        balanceSheet: new FormControl<number | null>(null, { validators: [Validators.required] }),
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
        incomeStatementId: new FormControl({}, { validators: [Validators.required] }),
        ordinaryActivityRevenue: new FormControl<number | null>(null, { validators: [Validators.required] }),
        costOfSales: new FormControl<number | null>(null, { validators: [Validators.required] }),
        administrativeExpenses: new FormControl<number | null>(null, { validators: [Validators.required] }),
        sellingExpenses: new FormControl<number | null>(null, { validators: [Validators.required] }),
        depreciationAmortization: new FormControl<number | null>(null, { validators: [Validators.required] }),
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
    ngOnInit(): void {
    }

    loadCreditStudy(id: string): void {
        this.loading.set(true);
        this.creditStudyService.getCreditStudyById(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((creditStudy) => {
            if (creditStudy) {
                this.customerIdSignal.set(creditStudy.customerId);

                const period = this.periods()?.find(p => p.id === creditStudy.incomeStatementId);

                this.step1Form.patchValue({
                    customerId: null,
                    customerName: (creditStudy as any).customer?.businessName ?? '',
                    studyDate: creditStudy.studyDate ? new Date(creditStudy.studyDate) : null,
                    requestedTerm: creditStudy.requestedTerm ?? null,
                    requestedMonthlyCreditLine: creditStudy.requestedMonthlyCreditLine ?? null,
                    notes: creditStudy.notes ?? ''
                });

                this.step2Form.patchValue({
                    cashAndEquivalents: creditStudy.cashAndEquivalents ?? null,
                    accountsReceivable1: creditStudy.accountsReceivable1 ?? null,
                    accountsReceivable2: creditStudy.accountsReceivable2 ?? null,
                    balanceSheet: creditStudy.balanceSheet ?? null,
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
                    depreciationAmortization: creditStudy.depreciationAmortization ?? null,
                    financialExpenses: creditStudy.financialExpenses ?? null,
                    taxes: creditStudy.taxes ?? null,
                    netIncome: creditStudy.netIncome ?? null
                });

                this.formValuesSignal.set(this.step2Form.getRawValue());

                if (creditStudy.stabilityFactor != null) {
                    this.studyResult.set(creditStudy);
                    this.studyCompleted.set(true);
                } else {
                    this.studyCompleted.set(false);
                }
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
            statusId: 9,
            studyDate: step1Data.studyDate,
            notes: step1Data.notes,
            requestedTerm: step1Data.requestedTerm ?? 0,
            requestedMonthlyCreditLine: step1Data.requestedMonthlyCreditLine ?? 0,
            balanceSheet: step2Data.balanceSheet ?? 0,
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
            depreciationAmortization: step2Data.depreciationAmortization ?? 0,
            financialExpenses: step2Data.financialExpenses ?? 0,
            taxes: step2Data.taxes ?? 0,
            netIncome: this.netIncome(),
        };

        const operation$ = this.creditStudyId()
            ? this.creditStudyService.updateCreditStudy(this.creditStudyId()!, creditStudyData)
            : this.creditStudyService.createCreditStudy(creditStudyData);

        operation$.pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((result: any) => {
            if (result.success) {
                const message = this.creditStudyId()
                    ? 'Estudio de crédito actualizado correctamente'
                    : 'Estudio de crédito creado correctamente';
                this.notificationService.success(message, 'OK');

                if (!this.creditStudyId() && result.data?.id) {
                    const fromCustomerId = this.queryCustomerId();
                    if (fromCustomerId) {
                        this.router.navigate(['/clientes/detalle-cliente', fromCustomerId, 'estudios-credito']);
                    } else {
                        this.router.navigate(['/estudio-credito/detalle-estudio', result.data.id]).then(() => {
                            setTimeout(() => {
                                this.activeStep = 3;
                            }, 100);
                        });
                    }
                }
                else if (this.creditStudyId()) {
                    this.loadCreditStudy(this.creditStudyId()!);
                }
            } else {
                this.notificationService.error(result.error ?? 'Error al guardar', 'Error');
            }
        });
    }

    onCancel(): void {
        const fromCustomerId = this.queryCustomerId();
        if (fromCustomerId) {
            this.router.navigate(['/clientes/detalle-cliente', fromCustomerId, 'estudios-credito']);
        } else {
            this.router.navigate(['/estudio-credito']);
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
        return this.isEditMode() && this.step1Form.valid && this.step2Form.valid;
    }

    onPerformStudy(activateCallback: (step: number) => void): void {
        if (!this.canPerformStudy() || !this.creditStudyId()) {
            return;
        }

        this.confirmationService.confirm({
            message: '¿Está seguro de que desea iniciar el proceso de estudio de crédito? Esta acción no se puede deshacer.',
            header: 'Confirmar Estudio',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, realizar estudio',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-success',
            rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
            accept: () => {
                this.performingStudy.set(true);

                this.creditStudyService.performCreditStudy(this.creditStudyId()!).pipe(
                    finalize(() => this.performingStudy.set(false)),
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe((result: { success: boolean; error?: string; data?: any }) => {
                    if (result.success) {
                        this.notificationService.success('Estudio de crédito realizado exitosamente', 'Éxito');
                        this.studyResult.set(result.data);
                        this.studyCompleted.set(true);
                        setTimeout(() => activateCallback(4), 300);
                    } else {
                        this.notificationService.error(result.error ?? 'Error al realizar el estudio', 'Error');
                    }
                });
            }
        });
    }
}
