import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { HeaderWidget } from './components/headerwidget';
import { HeroWidget } from './components/herowidget';
import { StatsWidget } from './components/statswidget';
import { FeaturesWidget } from './components/featureswidget';
import { SecurityWidget } from './components/securitywidget';
import { TestimonialsWidget } from './components/testimonialswidget';
import { JoinWidget } from './components/joinwidget';
import { PricingWidget } from './components/pricingwidget';
import { FaqWidget } from './components/faqwidget';
import { FooterWidget } from './components/footerwidget';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterModule, RippleModule, StyleClassModule, ButtonModule, DividerModule, DialogModule, HeaderWidget, HeroWidget, StatsWidget, FeaturesWidget, SecurityWidget, TestimonialsWidget, JoinWidget, PricingWidget, FaqWidget, FooterWidget],
    templateUrl: './landing.html'
})
export class Landing {
    private route = inject(ActivatedRoute);
    private supabaseService = inject(SupabaseService);

    blockedDialogVisible = signal(
        this.route.snapshot.queryParamMap.get('blocked') === 'true' && this.supabaseService.isAuthenticated()
    );

    constructor() {
        if (this.blockedDialogVisible()) {
            this.supabaseService.signOut();
        }
    }
}
