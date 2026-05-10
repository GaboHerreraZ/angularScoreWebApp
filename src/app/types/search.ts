export type SearchCategory = 'page' | 'action' | 'help' | 'customer' | 'credit-study';

export interface SearchItem {
    id: string;
    title: string;
    description?: string;
    route: string;
    icon: string;
    category: SearchCategory;
    keywords?: string[];
    queryParams?: Record<string, any>;
    requiresRole?: string[];
    action?: () => void;
}

export interface SearchGroup {
    category: SearchCategory;
    label: string;
    items: SearchItem[];
}
