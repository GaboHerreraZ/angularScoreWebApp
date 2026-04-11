import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    standalone: true,
    selector: 'footer-widget',
    imports: [RouterModule],
    templateUrl: './footer-widget.html'
})
export class FooterWidget {
    scrollTo(id: string) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
