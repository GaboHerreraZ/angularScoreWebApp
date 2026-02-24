export type TableColumnType = 'text' | 'number' | 'currency' | 'date' | 'avatar' | 'status' | 'boolean' | 'image';

export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface TableColumn {
    header: string;
    field: string;
    type: TableColumnType;
    minWidth?: string;

    // avatar / image
    imageField?: string;
    textField?: string;
    imagePrefix?: string;
    imageSuffix?: string;
    imageClass?: string;
    imageDynamicClass?: boolean;
    imageWidth?: number;

    // currency
    currencyCode?: string;

    // date
    dateFormat?: string;

    // status
    severityMap?: Record<string, TagSeverity>;
    defaultSeverity?: TagSeverity;

    // filtering
    filterable?: boolean;
    filterOptions?: { label: string; value: string }[];
}

export interface TableAction {
    id: string;
    icon: string;
    severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
    tooltip?: string;
    visibleField?: string;
}

export interface TableActionEvent {
    action: string;
    row: any;
}

export interface TableSettings {
    columns: TableColumn[];
    dataKey?: string;
    rows?: number;
    rowsPerPageOptions?: number[];
    showGridlines?: boolean;
    rowHover?: boolean;
    searchPlaceholder?: string;
    emptyMessage?: string;
    loadingMessage?: string;
    title?: string;
    titleIcon?: string;
    showSearch?: boolean;
    showColumnFilters?: boolean;
    actions?: TableAction[];
    actionsHeader?: string;
    addButton?: {
        label: string;
        icon: string;
        severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
        disabled?: boolean;
    };
}

export interface TablePageChangeEvent {
    first: number;
    rows: number;
    page: number;
}

export interface TableSearchEvent {
    query: string;
}
