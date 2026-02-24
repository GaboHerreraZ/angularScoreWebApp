import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { HeaderWidget } from './components/headerwidget';
import { HeroWidget } from './components/herowidget';
import { StatsWidget } from './components/statswidget';
import { FeaturesWidget } from './components/featureswidget';
import { JoinWidget } from './components/joinwidget';
import { PricingWidget } from './components/pricingwidget';
import { FooterWidget } from './components/footerwidget';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterModule, RippleModule, StyleClassModule, ButtonModule, DividerModule, HeaderWidget, HeroWidget, StatsWidget, FeaturesWidget, JoinWidget, PricingWidget, FooterWidget],
    templateUrl: './landing.html'
})
export class Landing {}
