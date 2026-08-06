import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    standalone: true,
    selector: 'footer-widget',
    imports: [RouterModule],
    templateUrl: './footer-widget.html',
    styles: [
        `
            /*
              El icono del sello lleva su propio tamano aca y no con una utilidad
              text-*: primeicons.css se importa fuera de capas y define
              .pi { font-size }, que en la cascada le gana a @layer utilities.
            */
            .trust i {
                font-size: 1.05rem;
                line-height: 1;
            }
        `
    ]
})
export class FooterWidget {

    readonly logo = '/logo/logo-creditia-vertical.svg';

    scrollTo(id: string) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
