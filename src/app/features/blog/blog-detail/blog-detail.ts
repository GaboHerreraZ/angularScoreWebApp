import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { HeaderWidget } from '@/app/features/landing/components/header-widget/header-widget';
import { FooterWidget } from '@/app/features/landing/components/footer-widget/footer-widget';
import { BlogService } from '../blog.service';
import { BlogPost } from '@/app/types/blog';

const BRAND = 'Creditia';

/**
 * Detalle de un artículo del blog (público, SEO). Renderiza el HTML del
 * artículo con tipografía cuidada y actualiza título + meta tags (Open Graph)
 * para que se vea bien al compartir. Maneja 404 si el slug no existe.
 */
@Component({
    selector: 'app-blog-detail',
    standalone: true,
    imports: [RouterModule, DatePipe, ButtonModule, SkeletonModule, HeaderWidget, FooterWidget],
    templateUrl: './blog-detail.html'
})
export class BlogDetail {
    private blogService = inject(BlogService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private title = inject(Title);
    private meta = inject(Meta);

    /** Espacio irrompible (&nbsp;) que algunos editores insertan en lugar de un espacio normal. */
    private static readonly NBSP = String.fromCharCode(160);

    /** Slug del artículo, tomado de la ruta (se actualiza al navegar entre artículos). */
    slug = signal(this.route.snapshot.paramMap.get('slug') ?? '');

    /** No encontrado (404) u otro error de carga. */
    notFound = false;

    postResource = resource<BlogPost, { slug: string }>({
        params: () => ({ slug: this.slug() }),
        loader: async ({ params }) => {
            try {
                return await firstValueFrom(this.blogService.getPostBySlug(params.slug));
            } catch (error) {
                this.notFound = (error as HttpErrorResponse)?.status === 404;
                throw error;
            }
        }
    });

    /**
     * HTML del artículo listo para renderizar. Algunos editores guardan todos los
     * espacios como `&nbsp;` (espacio irrompible), lo que impide el salto de línea
     * y hace que el navegador parta las palabras por la mitad. Los convertimos a
     * espacios normales para que el texto fluya bien.
     */
    articleHtml = computed(() => {
        const content = this.postResource.value()?.content ?? '';
        return content.split(BlogDetail.NBSP).join(' ');
    });

    constructor() {
        // Si se navega de un artículo a otro (mismo componente), refrescamos el slug.
        this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
            this.notFound = false;
            this.slug.set(params.get('slug') ?? '');
        });

        // Al cargar el artículo, actualizamos título y meta tags para SEO/compartir.
        effect(() => {
            const post = this.postResource.value();
            if (post) this.applySeo(post);
        });
    }

    private applySeo(post: BlogPost): void {
        const metaTitle = post.metaTitle ?? post.title;
        const metaDescription = post.metaDescription ?? post.excerpt;

        this.title.setTitle(`${metaTitle} · ${BRAND}`);
        this.meta.updateTag({ name: 'description', content: metaDescription });
        this.meta.updateTag({ property: 'og:title', content: metaTitle });
        this.meta.updateTag({ property: 'og:description', content: metaDescription });
        this.meta.updateTag({ property: 'og:type', content: 'article' });
        if (post.coverImageUrl) {
            this.meta.updateTag({ property: 'og:image', content: post.coverImageUrl });
        }
    }

    goToRegister(): void {
        this.router.navigateByUrl('/onboarding/registro');
    }
}
