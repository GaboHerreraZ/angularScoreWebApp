import { TourDefinition } from '@/app/types/tour';

const ROUTE = '/app/estudio-credito';

export const CREDIT_STUDY_OVERVIEW_TOUR: TourDefinition = {
    id: 'credit-study.overview',
    title: 'Recorrido de Estudios de crédito',
    description: 'Qué contiene el listado y qué significa cada columna.',
    kind: 'overview',
    icon: 'pi pi-credit-card',
    version: 2,
    routes: [ROUTE],
    exactRoute: true,
    minutes: 2,
    steps: [
        {
            element: '[data-tour="table-title"]',
            title: 'Estudios de crédito',
            description: 'El histórico de todos los análisis que has generado, del más reciente al más antiguo.',
            side: 'bottom',
            align: 'start'
        },
        {
            element: '[data-tour="table-add"]',
            title: 'Crear un estudio',
            description: 'Desde aquí arranca un análisis nuevo. <b>Cada estudio consume una consulta</b> de tu paquete disponible.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="table-col-status.label"]',
            desktopOnly: true,
            title: 'Estado del estudio',
            description: '<b>En revisión</b> significa que aún se está procesando. <b>Estudio realizado</b> es que ya tiene resultado consultable.',
            side: 'bottom'
        },
        {
            element: '[data-tour="table-col-result.score"]',
            desktopOnly: true,
            title: 'Score',
            description: 'Puntaje de riesgo del cliente según la central de riesgo. A mayor puntaje, mejor comportamiento crediticio.',
            side: 'bottom'
        },
        {
            element: '[data-tour="table-col-result.statusLabel"]',
            desktopOnly: true,
            title: 'Viabilidad',
            description: 'La recomendación final: <b>Viable</b>, <b>Viable con condiciones</b> o <b>No viable</b>, calculada con los parámetros de análisis de tu empresa.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="table-actions-cell"]',
            desktopOnly: true,
            title: 'Abrir el estudio',
            description: 'El botón del ojo lleva al detalle completo: información financiera, central de riesgo y las sugerencias del análisis.',
            side: 'left'
        },
        {
            element: '[data-tour="table-export"]',
            title: 'Exportar a Excel',
            description: 'Descarga el listado con todas sus columnas —score y viabilidad incluidos— respetando los filtros que tengas puestos. Útil para reportes o para cruzar con tus propios datos.',
            side: 'bottom',
            align: 'end'
        }
    ]
};

export const CREDIT_STUDY_CREATE_TOUR: TourDefinition = {
    id: 'credit-study.create',
    title: 'Cómo crear un estudio',
    description: 'Los pasos para generar un análisis nuevo y qué consume.',
    kind: 'task',
    icon: 'pi pi-plus-circle',
    version: 1,
    routes: [ROUTE],
    exactRoute: true,
    minutes: 1,
    steps: [
        {
            element: '[data-tour="topbar-credits"]',
            title: '1. Revisa tus consultas',
            description: 'Cada estudio descuenta una consulta. Si el contador está en cero, el botón de creación no aparece.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="table-add"]',
            title: '2. Nuevo estudio',
            description: 'Abre el formulario. También lo tienes en el botón <b>+</b> de la esquina inferior derecha desde cualquier pantalla.',
            side: 'bottom',
            align: 'end'
        },
        {
            title: '3. Completa los datos',
            description: 'Identifica al cliente e indica el <b>cupo</b> y el <b>plazo en días</b> que te solicitó. Si el cliente es nuevo, queda registrado automáticamente en Clientes.'
        },
        {
            title: '4. Consulta el resultado',
            description: 'El estudio queda <b>En revisión</b> mientras se procesa. Al terminar te llega una notificación y la fila muestra score y viabilidad. La guía completa del formulario está dentro de esa pantalla.'
        }
    ]
};

/**
 * Solo en creación: la ruta de detalle lleva `/:id`, así que con `exactRoute` no
 * hereda esta guía. En modo detalle la pantalla muestra otra cosa (perfil en
 * centrales, resultado, pagaré) y merece su propio recorrido.
 */
export const CREDIT_STUDY_NEW_TOUR: TourDefinition = {
    id: 'credit-study.new',
    title: 'Recorrido de Nuevo estudio',
    description: 'Los tres pasos del formulario y cuándo se consume la consulta.',
    kind: 'overview',
    icon: 'pi pi-file-edit',
    version: 1,
    routes: ['/app/estudio-credito/detalle-estudio'],
    exactRoute: true,
    minutes: 2,
    steps: [
        {
            element: '[data-tour="study-stepper"]',
            title: 'Son tres pasos',
            description: '<b>1. Datos de la solicitud</b> → <b>2. Estados financieros</b> → <b>3. Estudio de crédito</b>. Se desbloquean en orden: cada uno necesita lo del anterior.',
            side: 'bottom',
            align: 'start'
        },
        {
            element: '[data-tour="study-form"]',
            title: 'Identifica al cliente',
            description: 'Tipo y número de identificación, razón social y correo del titular. Con estos datos se consulta al cliente en las <b>centrales de riesgo</b>, así que el número debe ser exacto.',
            side: 'top'
        },
        {
            element: '[data-tour="study-amount"]',
            title: 'El cupo solicitado',
            description: 'Lo que el cliente te está pidiendo. No es un límite tuyo: es el monto contra el que se va a evaluar la viabilidad.',
            side: 'top'
        },
        {
            element: '[data-tour="study-term"]',
            title: 'El plazo, en días',
            description: 'El tiempo en que el cliente propone pagar, <b>expresado en días</b>. Junto con el cupo define el esfuerzo financiero que tendrá que sostener, y por eso pesa en el resultado.',
            side: 'top'
        },
        {
            element: '[data-tour="study-create"]',
            title: 'Aquí se consume la consulta',
            description: 'Al crear el estudio se consulta a las centrales de riesgo y <b>se descuenta una consulta de tu paquete</b>. Hasta este momento no has gastado nada, así que revisa los datos antes de pulsar.',
            side: 'right'
        },
        {
            title: 'Lo que viene después',
            description: 'Creado el estudio se abre el paso 2: cargas el <b>PDF de estados financieros</b> y la plataforma extrae los periodos sola. En el paso 3 pulsas <b>Realizar Estudio</b> y obtienes el resultado, que podrás descargar en PDF y, si aplica, firmar el pagaré.'
        }
    ]
};

export const CREDIT_STUDY_RESULTS_TOUR: TourDefinition = {
    id: 'credit-study.results',
    title: 'Cómo leer el resultado',
    description: 'Diferencia entre score, viabilidad y estado.',
    kind: 'task',
    icon: 'pi pi-chart-line',
    version: 1,
    routes: [ROUTE],
    exactRoute: true,
    minutes: 1,
    steps: [
        {
            element: '[data-tour="table-col-status.label"]',
            desktopOnly: true,
            title: 'Estado ≠ resultado',
            description: 'El <b>estado</b> solo dice si el análisis terminó de procesarse. No es una recomendación.',
            side: 'bottom'
        },
        {
            element: '[data-tour="table-col-result.score"]',
            desktopOnly: true,
            title: 'El score es del cliente',
            description: 'Viene de la central de riesgo y describe su comportamiento de pago histórico. No depende del monto que te pidió.',
            side: 'bottom'
        },
        {
            element: '[data-tour="table-col-result.statusLabel"]',
            desktopOnly: true,
            title: 'La viabilidad sí es del negocio',
            description: 'Cruza el score con el cupo y plazo solicitados y con los <b>parámetros de análisis</b> que configuraste en Administración. Cambiar esos parámetros cambia esta columna en estudios futuros.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="table-actions-cell"]',
            desktopOnly: true,
            title: 'El porqué está en el detalle',
            description: 'Abre el estudio para ver las obligaciones reportadas, el desglose del score y las sugerencias concretas del análisis.',
            side: 'left'
        }
    ]
};
