import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LayoutService } from '@/app/layout/service/layout.service';

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
    private layoutService = inject(LayoutService);

    /**
     * El logotipo se invierte segun el tema, igual que en el header.
     * Antes el pie fijaba siempre la version clara del logo porque su fondo era
     * oscuro en ambos modos; ahora que sigue los colores del tema, esa version
     * quedaria blanca sobre blanco en modo claro.
     */
    logo = computed(() => (this.layoutService.isDarkTheme() ? '/logo/creditia-logo-dark.svg' : '/logo/creditia-logo.svg'));

    scrollTo(id: string) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
