import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** Nombre de marca que se antepone/pospone al título de cada página. */
const BRAND = 'Credit-ia';

/** Origen canónico del sitio público (sin barra final). */
const CANONICAL_ORIGIN = 'https://creditia.co';

/**
 * Estrategia de título por ruta: toma el `title` de la ruta (o, como respaldo,
 * su `data.breadcrumb`) y le agrega el sufijo de marca. Si la ruta no define
 * ninguno, usa solo la marca con su tagline.
 *
 * Para dar título a una ruta basta con:
 *   { path: 'clientes', title: 'Clientes', ... }
 * o reutilizar el breadcrumb existente:
 *   { path: 'clientes', data: { breadcrumb: 'Clientes' }, ... }
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
    private readonly document = inject(DOCUMENT);

    constructor(private readonly title: Title) {
        super();
    }

    override updateTitle(snapshot: RouterStateSnapshot): void {
        const pageTitle = this.buildTitle(snapshot) ?? this.deepestBreadcrumb(snapshot);

        this.title.setTitle(
            pageTitle
                ? `${pageTitle} · ${BRAND}`
                : `${BRAND} | Plataforma de Análisis Crediticio Inteligente`
        );

        this.updateCanonical(snapshot.url);
    }

    /**
     * Canonical por ruta: el estático de index.html apuntaba siempre a `/`,
     * lo que le decía a Google que todas las páginas eran duplicados del home.
     */
    private updateCanonical(url: string): void {
        const path = url.split('?')[0].split('#')[0];
        let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!link) {
            link = this.document.createElement('link');
            link.rel = 'canonical';
            this.document.head.appendChild(link);
        }
        link.href = `${CANONICAL_ORIGIN}${path === '/' ? '/' : path}`;
    }

    /** Busca el breadcrumb de la ruta activa más profunda cuando no hay `title`. */
    private deepestBreadcrumb(snapshot: RouterStateSnapshot): string | undefined {
        let route = snapshot.root;
        let breadcrumb: string | undefined;
        while (route) {
            breadcrumb = route.data?.['breadcrumb'] ?? breadcrumb;
            if (!route.firstChild) break;
            route = route.firstChild;
        }
        return breadcrumb;
    }
}
