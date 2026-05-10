import { Injectable, signal } from '@angular/core';

export interface RecentItem {
    id: string;
    label: string;
    route: string;
    visitedAt: number;
}

const STORAGE_KEY = 'creditia.recent-items.v1';

interface RecentItemsState {
    customer: RecentItem | null;
    creditStudy: RecentItem | null;
}

const EMPTY_STATE: RecentItemsState = { customer: null, creditStudy: null };

@Injectable({ providedIn: 'root' })
export class RecentItemsService {
    private state = signal<RecentItemsState>(this.loadFromStorage());

    readonly customer = () => this.state().customer;
    readonly creditStudy = () => this.state().creditStudy;
    readonly hasAny = () => !!(this.state().customer || this.state().creditStudy);

    setCustomer(id: string, label: string): void {
        if (!id || !label) return;
        const item: RecentItem = { id, label, route: `/app/clientes/detalle-cliente/${id}/informacion`, visitedAt: Date.now() };
        this.state.update((s) => ({ ...s, customer: item }));
        this.persist();
    }

    setCreditStudy(id: string, label: string): void {
        if (!id || !label) return;
        const item: RecentItem = { id, label, route: `/app/estudio-credito/detalle-estudio/${id}`, visitedAt: Date.now() };
        this.state.update((s) => ({ ...s, creditStudy: item }));
        this.persist();
    }

    clear(): void {
        this.state.set(EMPTY_STATE);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
    }

    private loadFromStorage(): RecentItemsState {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return EMPTY_STATE;
            const parsed = JSON.parse(raw);
            return {
                customer: parsed.customer ?? null,
                creditStudy: parsed.creditStudy ?? null
            };
        } catch {
            return EMPTY_STATE;
        }
    }

    private persist(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
        } catch {
            // ignore quota / privacy mode
        }
    }
}
