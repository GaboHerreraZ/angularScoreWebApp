import { TourDefinition } from '@/app/types/tour';

export const DASHBOARD_OVERVIEW_TOUR: TourDefinition = {
    id: 'dashboard.overview',
    title: 'Recorrido del Dashboard',
    description: 'Qué mide cada indicador y de dónde sale.',
    kind: 'overview',
    icon: 'pi pi-chart-bar',
    version: 1,
    routes: ['/app', '/app/panel'],
    exactRoute: true,
    minutes: 3,
    steps: [
        {
            element: '[data-tour="dashboard-kpis"]',
            title: 'Resumen general',
            description: 'Tu foto del momento: cuántos clientes tienes registrados y cuántos estudios llevas <b>este mes</b>. La flecha de cada tarjeta compara contra el periodo anterior.',
            side: 'bottom'
        },
        {
            element: '[data-tour="dashboard-credits"]',
            title: 'Créditos de análisis',
            description: 'Las consultas que te quedan y <b>cuándo vence el paquete más próximo</b>. Las consultas no consumidas se pierden al vencer, así que conviene tener este dato a la vista.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="dashboard-quota"]',
            title: 'Cupo solicitado vs. viable',
            description: 'Cuánto dinero te pidieron tus clientes este mes y cuánto resultó viable según los estudios. La diferencia entre ambos es, en la práctica, el riesgo que estás evitando.',
            side: 'bottom'
        },
        {
            element: '[data-tour="dashboard-charts"]',
            title: 'Gráficos de actividad',
            description: '<b>Pipeline</b> muestra en qué etapa están tus estudios; <b>Estudios por mes</b>, cómo evoluciona tu volumen de análisis.',
            side: 'top'
        },
        {
            element: '[data-tour="dashboard-chart-help"]',
            title: 'Cada gráfico explica su cálculo',
            description: 'Este ícono aparece junto a cada título: pasa el cursor por encima y te dice exactamente qué está midiendo y con qué datos.',
            side: 'bottom',
            align: 'start'
        },
        {
            element: '[data-tour="dashboard-recent"]',
            title: 'Estudios recientes',
            description: 'Los últimos análisis con su score y su veredicto. Es el atajo para revisar lo que acaba de procesarse sin ir al listado completo.',
            side: 'top'
        },
        {
            element: '[data-tour="dashboard-advanced"]',
            title: 'Análisis del periodo',
            description: 'A partir de aquí el detalle profundo: tasa de aprobación, distribución de veredictos, riesgo de Datacredito y tus clientes con mayor cupo. Esta sección aparece cuando ya tienes suficientes estudios para comparar.',
            side: 'bottom',
            align: 'start'
        },
        {
            element: '[data-tour="dashboard-refresh"]',
            title: 'Datos al día',
            description: 'Te decimos cuándo se calcularon estas cifras. Si acabas de crear un estudio y no lo ves reflejado, refresca aquí.',
            side: 'left'
        },
        {
            title: '¿Y el menú y la barra superior?',
            description: 'Eso lo cubre el recorrido <b>Primeros pasos en Credit-ia</b>, que también está en este mismo botón de guías.'
        }
    ]
};
