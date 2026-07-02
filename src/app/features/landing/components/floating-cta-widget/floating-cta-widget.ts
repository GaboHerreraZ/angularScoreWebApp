import { afterNextRender, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { SupabaseService } from '@/app/core/services/supabase.service';

/**
 * CTA flotante que aparece al hacer scroll más allá del hero y permanece
 * visible en toda la zona media del landing. Se oculta al volver arriba
 * (hero) y al llegar al footer, donde ya hay enlaces de contacto.
 */
@Component({
    standalone: true,
    selector: 'floating-cta-widget',
    imports: [ButtonModule, Ripple],
    templateUrl: './floating-cta-widget.html'
})
export class FloatingCtaWidget implements OnDestroy {
    private router = inject(Router);
    private supabaseService = inject(SupabaseService);

    /** True si el usuario ya tiene sesión: el CTA flotante pasa a "Ir al Dashboard". */
    isAuthenticated = computed(() => this.supabaseService.isAuthenticated());

    /** Controla la visibilidad del botón flotante. */
    visible = signal(false);

    private onScroll = () => this.updateVisibility();

    constructor() {
        afterNextRender(() => {
            this.updateVisibility();
            window.addEventListener('scroll', this.onScroll, { passive: true });
        });
    }

    private updateVisibility(): void {
        // Aparece tras superar el alto del primer viewport (más allá del hero).
        const pastHero = window.scrollY > window.innerHeight * 0.8;

        // Se oculta cuando el footer entra en pantalla, para no estorbar al final.
        const footer = document.getElementById('landing-footer');
        const reachedFooter = footer
            ? footer.getBoundingClientRect().top < window.innerHeight
            : false;

        this.visible.set(pastHero && !reachedFooter);
    }

    goToRegister(): void {
        this.router.navigateByUrl('/onboarding/registro');
    }

    goToDashboard(): void {
        this.router.navigateByUrl('/app');
    }

    ngOnDestroy(): void {
        window.removeEventListener('scroll', this.onScroll);
    }
}
