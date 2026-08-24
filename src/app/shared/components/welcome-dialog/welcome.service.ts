import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@/app/core/services/auth.service';

const SEEN_KEY = 'creditia.welcome.v1';

/**
 * Bienvenida de una sola vez, la primera vez que el cliente entra con la cuenta
 * ya pagada (`onboardingStatus === 'ready'`).
 *
 * El "ya la vio" se guarda por usuario en localStorage: no hay campo en el
 * backend para esto, y el peor caso —verla otra vez en otro navegador— es
 * inofensivo. Vive en un servicio y no dentro del componente porque el layout
 * necesita saber si está abierta para no lanzar el tour de bienvenida encima.
 */
@Injectable({ providedIn: 'root' })
export class WelcomeService {
    private readonly authService = inject(AuthService);

    private readonly seen = signal<Record<string, boolean>>(this.read());

    readonly visible = computed(() => {
        const profile = this.authService.currentProfile();
        if (!profile || profile.onboardingStatus !== 'ready') return false;
        return !this.seen()[profile.id];
    });

    /** Cierra la bienvenida y la marca como vista para este usuario. */
    dismiss(): void {
        const id = this.authService.currentProfile()?.id;
        if (!id) return;
        const next = { ...this.seen(), [id]: true };
        this.seen.set(next);
        try {
            localStorage.setItem(SEEN_KEY, JSON.stringify(next));
        } catch {
            // Sin localStorage (modo privado): se cierra igual en esta sesión.
        }
    }

    private read(): Record<string, boolean> {
        try {
            const raw = localStorage.getItem(SEEN_KEY);
            return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
        } catch {
            return {};
        }
    }
}
