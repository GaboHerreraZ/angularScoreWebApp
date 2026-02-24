import { Component, inject } from '@angular/core';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    standalone: true,
    selector: '[app-footer]',
    templateUrl: './footer.html',
    host: {
        class: 'layout-footer'
    }
})
export class Footer {
    layoutService = inject(LayoutService);
}
