import { Component, computed, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { HeaderWidget } from '@/app/features/landing/components/header-widget/header-widget';
import { FooterWidget } from '@/app/features/landing/components/footer-widget/footer-widget';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';
import { BlogCard } from './components/blog-card/blog-card';
import { BlogService } from './blog.service';
import { BlogPostsResponse } from '@/app/types/blog';

const PAGE_SIZE = 9;

/**
 * Blog público (SEO): listado paginado de artículos en tarjetas. Reutiliza el
 * header y footer del landing para mantener la identidad. El contenido lo sirve
 * el backend (solo artículos published).
 */
@Component({
    selector: 'app-blog',
    standalone: true,
    imports: [
        PaginatorModule,
        SkeletonModule,
        ButtonModule,
        HeaderWidget,
        FooterWidget,
        BlogCard,
        ScrollAnimateDirective
    ],
    templateUrl: './blog.html'
})
export class Blog {
    private blogService = inject(BlogService);

    readonly pageSize = PAGE_SIZE;

    /** Página actual (0-based para el paginador de PrimeNG). */
    page = signal(0);

    /** Carga el listado según la página activa. */
    postsResource = resource<BlogPostsResponse, { page: number }>({
        params: () => ({ page: this.page() }),
        loader: ({ params }) => firstValueFrom(this.blogService.getPosts(params.page + 1, PAGE_SIZE))
    });

    posts = computed(() => this.postsResource.value()?.data ?? []);
    total = computed(() => this.postsResource.value()?.meta.total ?? 0);

    /** Placeholders para el estado de carga (una grilla de skeletons). */
    readonly skeletons = Array.from({ length: PAGE_SIZE }, (_, i) => i);

    onPageChange(event: PaginatorState): void {
        this.page.set(event.page ?? 0);
        // Al cambiar de página, subimos para que el usuario vea el inicio del listado.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    retry(): void {
        this.postsResource.reload();
    }
}
