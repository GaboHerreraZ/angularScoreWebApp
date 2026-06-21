import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { HeaderWidget } from './components/header-widget/header-widget';
import { HeroWidget } from './components/hero-widget/hero-widget';
import { OverviewWidget } from './components/overview-widget/overview-widget';
import { HowItWorksWidget } from './components/how-it-works-widget/how-it-works-widget';
import { FeaturesWidget } from './components/features-widget/features-widget';
import { JoinWidget } from './components/join-widget/join-widget';
import { HowToStartWidget } from './components/how-to-start-widget/how-to-start-widget';
import { ContactSalesWidget } from './components/contact-sales-widget/contact-sales-widget';
import { FaqWidget } from './components/faq-widget/faq-widget';
import { FooterWidget } from './components/footer-widget/footer-widget';
import { FloatingCtaWidget } from './components/floating-cta-widget/floating-cta-widget';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterModule, RippleModule, StyleClassModule, ButtonModule, DividerModule, DialogModule, HeaderWidget, HeroWidget, OverviewWidget, HowItWorksWidget, FeaturesWidget, JoinWidget, HowToStartWidget, ContactSalesWidget, FaqWidget, FooterWidget, FloatingCtaWidget],
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
