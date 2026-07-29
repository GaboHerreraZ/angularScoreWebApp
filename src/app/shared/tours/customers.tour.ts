import { TourDefinition } from '@/app/types/tour';

const ROUTE = '/app/clientes';

export const CUSTOMERS_OVERVIEW_TOUR: TourDefinition = {
    id: 'customers.overview',
    title: 'Recorrido de Clientes',
    description: 'Qué muestra el listado y cómo llegar al detalle de un cliente.',
    kind: 'overview',
    icon: 'pi pi-address-book',
    version: 1,
    routes: [ROUTE],
    exactRoute: true,
    minutes: 2,
    steps: [
        {
            element: '[data-tour="table-title"]',
            title: 'Gestión de clientes',
            description: 'Aquí vive el directorio de todos tus clientes. <b>No se crean a mano</b>: se registran solos cuando generas un estudio de crédito.',
            side: 'bottom',
            align: 'start'
        },
        {
            element: '[data-tour="table-search"]',
            title: 'Buscar un cliente',
            description: 'Escribe razón social, identificación o correo. La búsqueda consulta todos los registros, no solo la página actual.',
            side: 'left'
        },
        {
            element: '[data-tour="table-filters"]',
            title: 'Filtros por columna',
            description: 'El ícono de cada encabezado abre un filtro específico de esa columna. Puedes combinar varios a la vez.',
            side: 'bottom',
            align: 'start'
        },
        {
            element: '[data-tour="table-actions-cell"]',
            title: 'Ver el detalle',
            description: 'El botón del ojo abre la ficha del cliente: su información, sus estudios de crédito y sus estadísticas.',
            side: 'left'
        },
        {
            element: '[data-tour="table-export"]',
            title: 'Exportar a Excel',
            description: 'Descarga el listado completo respetando los filtros que tengas aplicados.',
            side: 'bottom',
            align: 'end'
        }
    ]
};

export const CUSTOMERS_FIND_TOUR: TourDefinition = {
    id: 'customers.find',
    title: 'Cómo encontrar un cliente',
    description: 'Buscador, filtros por columna y cómo limpiarlos.',
    kind: 'task',
    icon: 'pi pi-search',
    version: 1,
    routes: [ROUTE],
    exactRoute: true,
    minutes: 1,
    steps: [
        {
            element: '[data-tour="table-search"]',
            title: '1. Busca por texto',
            description: 'Es la vía más rápida: razón social, número de identificación, correo o ciudad.',
            side: 'left'
        },
        {
            element: '[data-tour="table-filters"]',
            title: '2. Afina por columna',
            description: 'Si la búsqueda devuelve demasiado, usa el filtro del encabezado de la columna que te interese.',
            side: 'bottom',
            align: 'start'
        },
        {
            element: '[data-tour="table-clear"]',
            title: '3. Vuelve al listado completo',
            description: '<b>Limpiar</b> quita de una vez el texto buscado y todos los filtros de columna.',
            side: 'right'
        }
    ]
};
