import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderWidget } from '@/app/features/landing/components/header-widget/header-widget';
import { FooterWidget } from '@/app/features/landing/components/footer-widget/footer-widget';

@Component({
    selector: 'app-privacy-policy',
    standalone: true,
    imports: [RouterModule, HeaderWidget, FooterWidget],
    templateUrl: './privacy-policy.html'
})
export class PrivacyPolicy {}
