import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LayoutService } from '@/app/layout/service/layout.service';
import packageJson from '../../../../../package.json';

@Component({
    standalone: true,
    selector: '[app-footer]',
    imports: [RouterModule],
    templateUrl: './footer.html',
    host: {
        class: 'layout-footer'
    }
})
export class Footer {
    layoutService = inject(LayoutService);
    currentYear = new Date().getFullYear();
    appVersion = packageJson.version;
}
