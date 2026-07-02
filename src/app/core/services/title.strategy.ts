import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** Nombre de marca que se antepone/pospone al título de cada página. */
const BRAND = 'Creditia';

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
