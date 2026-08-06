import { TourDefinition } from '@/app/types/tour';

export const WELCOME_TOUR: TourDefinition = {
    id: 'welcome',
    title: 'Primeros pasos en Credit-ia',
    description: 'Conoce las zonas principales de la plataforma en un minuto.',
    kind: 'welcome',
    icon: 'pi pi-sparkles',
    version: 2,
    routes: ['*'],
    minutes: 1,
    steps: [
        {
            title: '¡Bienvenido a Credit-ia!',
            description: 'Te mostramos en 30 segundos dónde está cada cosa. Puedes salir cuando quieras y retomar la guía desde el botón de guías, en la esquina inferior derecha.'
        },
        {
            element: '[data-tour="sidebar-menu"]',
            title: 'Menú principal',
            description: 'Tus tres áreas de trabajo: <b>Dashboard</b> con el resumen, <b>Créditos</b> para los estudios y <b>Clientes</b> para el directorio.',
            side: 'right',
            align: 'start',
            desktopOnly: true
        },
        {
            element: '[data-tour="topbar-search"]',
            title: 'Búsqueda global',
            description: 'Encuentra clientes, estudios y secciones sin salir de donde estás. También se abre con <b>Ctrl + K</b>.',
            side: 'bottom'
        },
        {
            element: '[data-tour="topbar-credits"]',
            title: 'Tus consultas disponibles',
            description: 'Cada estudio de crédito consume una consulta de tu paquete. Aquí ves cuántas te quedan en todo momento.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="topbar-help"]',
            title: 'Centro de ayuda',
            description: 'Preguntas frecuentes y contacto con soporte. Si algo no funciona, este es el camino más corto.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="topbar-appearance"]',
            title: 'Apariencia',
            description: 'Ajusta la plataforma a tu gusto: <b>modo claro u oscuro</b>, color primario, tipo de menú y densidad. Recuerda pulsar <b>Guardar</b> para conservar los cambios.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="topbar-notifications"]',
            title: 'Notificaciones',
            description: 'Te avisamos cuando un estudio termina de procesarse o cuando hay novedades en tu cuenta.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="topbar-profile"]',
            title: 'Tu cuenta y la Administración',
            description: 'Al abrir tu perfil llegas a <b>Administración</b>: datos de la empresa, usuarios, parámetros de análisis y tu plan. También es donde cierras sesión.',
            side: 'bottom',
            align: 'end'
        },
        {
            // El SpeedDial no se renderiza si el usuario no tiene permisos de
            // creación; el paso se salta solo en ese caso.
            element: '[data-tour="quick-actions"]',
            title: 'Acciones rápidas',
            description: 'Desde cualquier pantalla, el botón <b>+</b> te deja crear un estudio de crédito o invitar a un usuario sin navegar hasta la sección.',
            side: 'left',
            align: 'end'
        },
        {
            element: '[data-tour="tour-fab"]',
            title: 'Y aquí están las guías',
            description: 'Este botón te muestra los recorridos disponibles en la pantalla en la que estés. Puedes repetir esta bienvenida o abrir una guía puntual cuando no recuerdes cómo hacer algo.',
            side: 'left',
            align: 'end'
        }
    ]
};
