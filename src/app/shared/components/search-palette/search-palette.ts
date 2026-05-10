import { Component, ElementRef, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SearchService } from '@/app/shared/services/search.service';
import type { SearchItem } from '@/app/types/search';

@Component({
    selector: 'app-search-palette',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, InputTextModule],
    templateUrl: './search-palette.html'
})
export class SearchPalette {
    searchService = inject(SearchService);

    inputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

    activeIndex = signal<number>(0);

    flatResults = computed<SearchItem[]>(() => this.searchService.results());

    constructor() {
        effect(() => {
            this.searchService.query();
            this.activeIndex.set(0);
        });

        effect(() => {
            if (this.searchService.isOpen()) {
                queueMicrotask(() => this.inputRef()?.nativeElement.focus());
            }
        });
    }

    @HostListener('window:keydown', ['$event'])
    handleGlobalShortcut(event: KeyboardEvent): void {
        const isCmdK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
        if (isCmdK) {
            event.preventDefault();
            this.searchService.toggle();
            return;
        }

        if (!this.searchService.isOpen()) return;

        const total = this.flatResults().length;

        if (event.key === 'Escape') {
            event.preventDefault();
            this.searchService.close();
            return;
        }

        if (!total) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();
            this.activeIndex.update((i) => (i + 1) % total);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();
            this.activeIndex.update((i) => (i - 1 + total) % total);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            const item = this.flatResults()[this.activeIndex()];
            if (item) this.searchService.selectItem(item);
        }
    }

    onQueryChange(value: string): void {
        this.searchService.query.set(value);
    }

    onItemClick(item: SearchItem): void {
        this.searchService.selectItem(item);
    }

    onHover(item: SearchItem): void {
        const idx = this.flatResults().indexOf(item);
        if (idx >= 0) this.activeIndex.set(idx);
    }

    onVisibleChange(visible: boolean): void {
        if (!visible) this.searchService.close();
    }

    isActive(item: SearchItem): boolean {
        return this.flatResults()[this.activeIndex()] === item;
    }
}
