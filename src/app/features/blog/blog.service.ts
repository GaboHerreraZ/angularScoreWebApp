import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { BlogPost, BlogPostsResponse } from '@/app/types/blog';

/** Consume el blog público. Todo el contenido lo sirve el backend (solo published). */
@Injectable({ providedIn: 'root' })
export class BlogService {
    private api = inject(ApiService);

    /** Listado paginado de artículos. `category` filtra por slug de categoría. */
    getPosts(page = 1, limit = 9, category?: string, search?: string): Observable<BlogPostsResponse> {
        const params: Record<string, string | number> = { page, limit };
        if (category) params['category'] = category;
        if (search) params['search'] = search;
        return this.api.get<BlogPostsResponse>('blog', { params });
    }

    /** Artículo completo por slug. El backend responde 404 si no existe o no está published. */
    getPostBySlug(slug: string): Observable<BlogPost> {
        return this.api.get<BlogPost>(`blog/${slug}`, { headers: { 'X-Silent-Error': 'true' } });
    }
}
