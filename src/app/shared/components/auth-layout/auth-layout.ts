import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-auth-layout',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './auth-layout.html',
    styles: [
        `
            .auth-bg {
                position: absolute;
                inset: 0;
                overflow: hidden;
                pointer-events: none;
            }

            .auth-glow {
                position: absolute;
                border-radius: 9999px;
                filter: blur(80px);
            }

            .auth-glow--top {
                top: -18rem;
                left: 50%;
                transform: translateX(-50%);
                width: 58rem;
                height: 38rem;
                background: radial-gradient(closest-side, var(--p-primary-400), transparent);
                opacity: 0.2;
            }

            .auth-glow--bottom {
                right: -14rem;
                bottom: -16rem;
                width: 42rem;
                height: 32rem;
                background: radial-gradient(closest-side, var(--p-primary-600), transparent);
                opacity: 0.16;
            }

            /*
              Reticula de puntos: es textura, no dibujo. A este paso y esta
              opacidad no se lee como patron, solo evita que el fondo se
              perciba plano. La mascara la desvanece hacia los bordes para que
              no choque contra el pie.
            */
            .auth-grid {
                position: absolute;
                inset: 0;
                color: var(--p-primary-500);
                background-image: radial-gradient(currentColor 1px, transparent 1px);
                background-size: 28px 28px;
                opacity: 0.06;
                -webkit-mask-image: radial-gradient(70% 60% at 50% 40%, #000, transparent);
                mask-image: radial-gradient(70% 60% at 50% 40%, #000, transparent);
            }

            .auth-ring {
                position: absolute;
                border-radius: 9999px;
                border: 1px solid var(--p-primary-500);
                opacity: 0.12;
            }

            .auth-ring--lg {
                width: 34rem;
                height: 34rem;
                top: -9rem;
                left: -11rem;
            }

            .auth-ring--sm {
                width: 18rem;
                height: 18rem;
                right: 5rem;
                bottom: 5rem;
            }

            /* Sobre fondo oscuro el mismo verde rinde menos: se sube un punto. */
            :host-context(.app-dark) .auth-glow--top {
                opacity: 0.26;
            }

            :host-context(.app-dark) .auth-glow--bottom {
                opacity: 0.2;
            }

            :host-context(.app-dark) .auth-grid {
                opacity: 0.08;
            }
        `
    ]
})
export class AuthLayout {
    /**
     * Titulo de la tarjeta. Se llama `heading` y no `title` porque `title` es
     * un atributo global de HTML: Angular lo reflejaria al DOM y el navegador
     * mostraria un tooltip sobre toda la pantalla.
     *
     * Es opcional: las pantallas con encabezado propio no lo pasan.
     */
    heading = input<string>();

    /** Linea de apoyo bajo el titulo. Se omite el parrafo si no se pasa. */
    description = input<string>();

    readonly year = new Date().getFullYear();
}
