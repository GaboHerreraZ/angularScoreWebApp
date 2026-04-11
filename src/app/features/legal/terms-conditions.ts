import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderWidget } from '@/app/features/landing/components/header-widget/header-widget';
import { FooterWidget } from '@/app/features/landing/components/footer-widget/footer-widget';

@Component({
    selector: 'app-terms-conditions',
    standalone: true,
    imports: [RouterModule, HeaderWidget, FooterWidget],
    templateUrl: './terms-conditions.html'
})
export class TermsConditions {}
