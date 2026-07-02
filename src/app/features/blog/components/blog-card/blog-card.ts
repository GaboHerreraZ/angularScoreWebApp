import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogPostSummary } from '@/app/types/blog';

/**
 * Tarjeta de artículo para la grid del blog. Muestra portada (o un placeholder
 * de marca si no hay), categoría, título, resumen, autor, fecha y tiempo de
 * lectura. Toda la tarjeta enlaza al detalle por slug.
 */
@Component({
    selector: 'app-blog-card',
    standalone: true,
    imports: [RouterModule, DatePipe],
    templateUrl: './blog-card.html'
})
export class BlogCard {
    post = input.required<BlogPostSummary>();

    /** Iniciales del autor para el avatar cuando no hay foto. */
    authorInitials = computed(() => {
        const name = this.post().author.name.trim();
        return name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
    });
}
