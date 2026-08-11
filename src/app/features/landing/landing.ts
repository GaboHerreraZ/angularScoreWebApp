import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { HeaderWidget } from './components/header-widget/header-widget';
import { HeroWidget } from './components/hero-widget/hero-widget';
import { OverviewWidget } from './components/overview-widget/overview-widget';
import { ProductDemoWidget } from './components/product-demo-widget/product-demo-widget';
import { BenefitsWidget } from './components/benefits-widget/benefits-widget';
import { JoinWidget } from './components/join-widget/join-widget';
import { FooterWidget } from './components/footer-widget/footer-widget';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [ButtonModule, DialogModule, HeaderWidget, HeroWidget, OverviewWidget, ProductDemoWidget, BenefitsWidget, JoinWidget, FooterWidget],
    templateUrl: './landing.html'
})
export class Landing {
    private route = inject(ActivatedRoute);
    private supabaseService = inject(SupabaseService);
    private meta = inject(Meta);

    blockedDialogVisible = signal(
        this.route.snapshot.queryParamMap.get('blocked') === 'true' && this.supabaseService.isAuthenticated()
    );

    constructor() {
        if (this.blockedDialogVisible()) {
            this.supabaseService.signOut();
        }

        this.meta.updateTag({
            name: 'description',
            content: 'Credit-ia: plataforma inteligente de análisis crediticio y evaluación de riesgo para empresas en Colombia. Automatiza decisiones de crédito con scoring de riesgo, +10 indicadores financieros y reportes profesionales.'
        });
    }
}
