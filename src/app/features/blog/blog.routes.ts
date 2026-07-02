import { Routes } from '@angular/router';

export default [
    { path: '', title: 'Blog', loadComponent: () => import('./blog').then((c) => c.Blog) },
    // El título del detalle lo pone el propio componente (metaTitle/title del artículo).
    { path: ':slug', loadComponent: () => import('./blog-detail/blog-detail').then((c) => c.BlogDetail) }
] as Routes;
