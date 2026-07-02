import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';
import { SupabaseService } from '@/app/core/services/supabase.service';

@Component({
    standalone: true,
    selector: 'join-widget',
    imports: [ButtonModule, Ripple, ScrollAnimateDirective, RouterModule],
    templateUrl: './join-widget.html'
})
export class JoinWidget {
    private supabaseService = inject(SupabaseService);

    /** True si el usuario ya tiene sesión: el CTA final pasa a "Ir al Dashboard". */
    isAuthenticated = computed(() => this.supabaseService.isAuthenticated());
}
