import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, take } from 'rxjs';

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
    private router = inject(Router);

    readonly logo = '/logo/logo-creditia-vertical.svg';

    scrollTo(id: string) {
        // Si ya estamos en el home, la sección existe en el DOM: scrolleamos directo.
        if (this.router.url.split('#')[0].split('?')[0] === '/') {
            this.scrollToElement(id);
            return;
        }

        // Desde otra página (precios, demo, blog…), navegamos al home y esperamos
        // a que termine la navegación antes de scrollear a la sección.
        this.router.events.pipe(
            filter((e) => e instanceof NavigationEnd),
            take(1)
        ).subscribe(() => this.scrollToElement(id));
        this.router.navigateByUrl('/');
    }

    private scrollToElement(id: string) {
        // Pequeño defer para asegurar que la sección esté en el DOM tras renderizar.
        setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    }
}
