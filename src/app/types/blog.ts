/** Tipos del blog público (contenido educativo sobre crédito y finanzas PYME). */

/** Estado de publicación. El endpoint público solo devuelve 'published'. */
export type BlogPostStatus = 'draft' | 'published' | 'archived';

/** Autor del artículo (derivado del PlatformAdmin). */
export interface BlogAuthor {
    name: string;
    /** Etiqueta del rol, ej. "Administrador". */
    role: string;
    avatarUrl: string | null;
}

/** Categoría/tema (derivado de un Parameter: name=label, slug=code). */
export interface BlogCategory {
    id: number;
    name: string;
    slug: string;
}

/**
 * Resumen de artículo — lo que devuelve el LISTADO (GET /blog).
 * Versión ligera para la grid: sin content ni campos de detalle.
 */
export interface BlogPostSummary {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    coverImageUrl: string | null;
    category: BlogCategory;
    author: BlogAuthor;
    readingMinutes: number;
    /** ISO 8601. */
    publishedAt: string;
    tags: string[];
}

/**
 * Artículo completo — lo que devuelve el DETALLE (GET /blog/:slug).
 * Extiende el resumen con el cuerpo HTML y los metadatos de SEO.
 */
export interface BlogPost extends BlogPostSummary {
    /** HTML sanitizado del artículo. */
    content: string;
    status: BlogPostStatus;
    /** ISO 8601. */
    updatedAt: string;
    /** SEO; si es null, el front usa `title`. */
    metaTitle: string | null;
    /** SEO; si es null, el front usa `excerpt`. */
    metaDescription: string | null;
    /** URL de la fuente original (o null). */
    sourceUrl: string | null;
}

/** Paginación (mismo shape que el resto de la app). */
export interface BlogMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Respuesta del listado paginado: GET /blog?page=1&limit=9&category=...&search=... */
export interface BlogPostsResponse {
    data: BlogPostSummary[];
    meta: BlogMeta;
}
