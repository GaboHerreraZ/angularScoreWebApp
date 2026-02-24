import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderWidget } from '@/app/features/landing/components/headerwidget';
import { FooterWidget } from '@/app/features/landing/components/footerwidget';

@Component({
    selector: 'app-terms-conditions',
    standalone: true,
    imports: [RouterModule, HeaderWidget, FooterWidget],
    templateUrl: './terms-conditions.html'
})
export class TermsConditions {}
