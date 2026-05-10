import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { AuthService } from '@/app/core/services/auth.service';
import type { SearchCategory, SearchGroup, SearchItem } from '@/app/types/search';

const CATEGORY_LABELS: Record<SearchCategory, string> = {
    page: 'Páginas',
    action: 'Acciones',
    help: 'Ayuda',
    customer: 'Clientes',
    'credit-study': 'Estudios de crédito'
};

const FUSE_OPTIONS: IFuseOptions<SearchItem> = {
    keys: [
        { name: 'title', weight: 2 },
        { name: 'description', weight: 1 },
        { name: 'keywords', weight: 1.2 }
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2
};

@Injectable({ providedIn: 'root' })
export class SearchService {
    private router = inject(Router);
    private authService = inject(AuthService);

    readonly query = signal<string>('');
    readonly isOpen = signal<boolean>(false);

    private staticItems: SearchItem[] = [
        { id: 'page-dashboard', title: 'Dashboard', description: 'Panel principal con resumen general', route: '/app/panel', icon: 'pi pi-desktop', category: 'page', keywords: ['inicio', 'home', 'panel', 'resumen'] },
        { id: 'page-customers', title: 'Clientes', description: 'Gestión de clientes', route: '/app/clientes', icon: 'pi pi-address-book', category: 'page', keywords: ['contactos', 'personas'] },
        { id: 'page-credit-study', title: 'Estudios de crédito', description: 'Listado de estudios de crédito', route: '/app/estudio-credito', icon: 'pi pi-credit-card', category: 'page', keywords: ['creditos', 'analisis', 'evaluacion'] },
        { id: 'page-profile', title: 'Perfil', description: 'Información personal y preferencias', route: '/app/administracion/perfil', icon: 'pi pi-user', category: 'page', keywords: ['cuenta', 'usuario'] },
        { id: 'page-company', title: 'Empresa', description: 'Configuración de la empresa', route: '/app/administracion/empresa', icon: 'pi pi-building', category: 'page', keywords: ['organizacion', 'compañia'] },
        { id: 'page-billing', title: 'Suscripción y facturación', description: 'Plan actual y pagos', route: '/app/administracion/suscripcion', icon: 'pi pi-wallet', category: 'page', keywords: ['plan', 'pagos', 'facturacion', 'billing'] },

        { id: 'action-new-customer', title: 'Crear nuevo cliente', description: 'Registrar un cliente nuevo', route: '/app/clientes/detalle-cliente', icon: 'pi pi-user-plus', category: 'action', keywords: ['nuevo', 'agregar', 'registrar'] },
        { id: 'action-new-credit-study', title: 'Nuevo estudio de crédito', description: 'Iniciar un estudio de crédito', route: '/app/estudio-credito/detalle-estudio', icon: 'pi pi-plus-circle', category: 'action', keywords: ['nuevo', 'crear', 'analisis'] }
    ];

    private dynamicGroups = signal<Record<string, SearchItem[]>>({});

    private allItems = computed<SearchItem[]>(() => {
        const profile = this.authService.currentProfile();
        const role = profile?.role;
        const dyn = Object.values(this.dynamicGroups()).flat();
        return [...this.staticItems, ...dyn].filter((item) => {
            if (!item.requiresRole?.length) return true;
            return role ? item.requiresRole.includes(role) : false;
        });
    });

    private fuse = computed(() => new Fuse(this.allItems(), FUSE_OPTIONS));

    readonly results = computed<SearchItem[]>(() => {
        const q = this.query().trim();
        if (!q) return this.allItems().slice(0, 8);
        return this.fuse()
            .search(q)
            .slice(0, 20)
            .map((r) => r.item);
    });

    readonly groupedResults = computed<SearchGroup[]>(() => {
        const buckets = new Map<SearchCategory, SearchItem[]>();
        for (const item of this.results()) {
            const list = buckets.get(item.category) ?? [];
            list.push(item);
            buckets.set(item.category, list);
        }
        return Array.from(buckets.entries()).map(([category, items]) => ({
            category,
            label: CATEGORY_LABELS[category],
            items
        }));
    });

    open(): void {
        this.isOpen.set(true);
    }

    close(): void {
        this.isOpen.set(false);
        this.query.set('');
    }

    toggle(): void {
        this.isOpen() ? this.close() : this.open();
    }

    selectItem(item: SearchItem): void {
        if (item.action) {
            item.action();
        } else {
            this.router.navigate([item.route], { queryParams: item.queryParams });
        }
        this.close();
    }

    registerItems(key: string, items: SearchItem[]): void {
        this.dynamicGroups.update((current) => ({ ...current, [key]: items }));
    }

    clearItems(key: string): void {
        this.dynamicGroups.update((current) => {
            const next = { ...current };
            delete next[key];
            return next;
        });
    }
}
