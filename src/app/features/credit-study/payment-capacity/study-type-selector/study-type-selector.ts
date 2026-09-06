import { Component, computed, inject, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { StudyTypeCode } from '@/app/types/payment-capacity';
import { FeatureFlagsService } from '@/app/core/services/feature-flags.service';
import { AuthService } from '@/app/core/services/auth.service';

/** Bolsa de la que descuenta cada tipo (los estudios comparten la de estudios). */
type PackProductCode = 'creditStudy' | 'bureauCheck';

interface StudyTypeOption {
    code: StudyTypeCode;
    pool: PackProductCode;
    title: string;
    subtitle: string;
    icon: string;
    iconClasses: string;
    bullets: string[];
}

/**
 * Diálogo de elección del tipo de estudio, previo a crear uno nuevo. Existen
 * dos productos con flujos distintos: el empresarial (estados financieros,
 * PN o PJ) y el de capacidad de pago (persona natural, sobre extractos y
 * soportes de ingreso). Emite el code elegido; el contenedor rutea.
 */
@Component({
    selector: 'app-study-type-selector',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule],
    templateUrl: './study-type-selector.html'
})
export class StudyTypeSelector {
    private featureFlags = inject(FeatureFlagsService);
    private authService = inject(AuthService);
    private router = inject(Router);

    visible = model<boolean>(false);
    selected = output<StudyTypeCode>();

    /**
     * El empresarial siempre; los demás solo con su feature flag encendido.
     * Cada opción sale marcada con si su bolsa tiene saldo: sin saldo la tarjeta
     * se muestra bloqueada con un CTA de compra (el backend igual rechazaría).
     */
    options = computed(() => {
        const perms = this.authService.currentProfile()?.permissions;
        const balanceByPool: Record<PackProductCode, boolean> = {
            creditStudy: perms?.hasCredits ?? false,
            bureauCheck: perms?.hasBureauCredits ?? false
        };
        return this.allOptions
            .filter(o => o.code === 'financialStatements' || this.featureFlags.isEnabled(o.code))
            .map(o => ({ ...o, available: balanceByPool[o.pool] }));
    });

    private readonly allOptions: StudyTypeOption[] = [
        {
            code: 'financialStatements',
            pool: 'creditStudy',
            title: 'Estudio empresarial',
            subtitle: 'Con estados financieros',
            icon: 'pi pi-building',
            iconClasses: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400',
            bullets: [
                'Persona natural o jurídica',
                'Balance y estado de resultados (PDF o centrales)',
                'Indicadores financieros y cupo por capacidad de pago'
            ]
        },
        {
            code: 'paymentCapacity',
            pool: 'creditStudy',
            title: 'Estudio de capacidad de pago',
            subtitle: 'Sin estados financieros',
            icon: 'pi pi-wallet',
            iconClasses: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400',
            bullets: [
                'Solo persona natural (asalariado o independiente)',
                'Extractos bancarios y soportes de ingreso',
                'Cuota máxima y endeudamiento sobre flujo de caja real'
            ]
        },
        {
            code: 'bureauCheck',
            pool: 'bureauCheck',
            title: 'Consulta de riesgo crediticio',
            subtitle: 'Sin documentos, en minutos',
            icon: 'pi pi-id-card',
            iconClasses: 'bg-violet-50 text-violet-500 dark:bg-violet-500/10 dark:text-violet-400',
            bullets: [
                'Solo persona natural',
                'Análisis IA del perfil en centrales de riesgo',
                'Red flags, señales a favor e informe descargable'
            ]
        }
    ];

    onSelect(code: StudyTypeCode): void {
        this.visible.set(false);
        this.selected.emit(code);
    }

    /** Cierra el diálogo y lleva a comprar el paquete de la bolsa sin saldo. */
    goToBuy(pool: PackProductCode, event: Event): void {
        event.stopPropagation();
        this.visible.set(false);
        this.router.navigate(['/app/administracion/analisis-credito'], { queryParams: { producto: pool } });
    }
}
