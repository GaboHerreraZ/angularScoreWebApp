import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderWidget } from '@/app/features/landing/components/headerwidget';
import { FooterWidget } from '@/app/features/landing/components/footerwidget';

@Component({
    selector: 'app-privacy-policy',
    standalone: true,
    imports: [RouterModule, HeaderWidget, FooterWidget],
    templateUrl: './privacy-policy.html'
})
export class PrivacyPolicy {}
