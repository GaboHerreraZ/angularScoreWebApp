import { FlowDefinition } from '@/app/types/tour';

const LIST_ROUTE = '^/app/estudio-credito$';
const NEW_ROUTE = '^/app/estudio-credito/detalle-estudio$';
const STUDY_ROUTE = '^/app/estudio-credito/detalle-estudio/[^/]+$';

/**
 * Tarea guiada de punta a punta: desde el listado hasta el resultado del
 * estudio. Los pasos accionables avanzan cuando la acción real ocurre
 * (navegación o aparición del siguiente elemento), no con "Siguiente".
 */
export const CREDIT_STUDY_CREATE_FLOW: FlowDefinition = {
    id: 'flow.credit-study.create',
    title: 'Crear un estudio de crédito',
    description: 'Hazlo de verdad, acompañado: la guía avanza contigo hasta obtener el resultado.',
    icon: 'pi pi-credit-card',
    version: 1,
    startRoute: '/app/estudio-credito',
    minutes: 5,
    steps: [
        {
            route: LIST_ROUTE,
            element: '[data-tour="topbar-credits"]',
            title: 'Tus consultas disponibles',
            description: 'Cada estudio consume <b>una consulta</b>. Verifica que tengas al menos una; si estás en cero, primero compra un paquete en <b>Administración → Análisis de Crédito</b>.',
            side: 'bottom',
            align: 'end',
            advance: { on: 'next' }
        },
        {
            route: LIST_ROUTE,
            element: '[data-tour="table-add"]',
            title: 'Abre un estudio nuevo',
            description: 'Haz click en este botón para iniciar el formulario del estudio.',
            side: 'bottom',
            align: 'end',
            advance: { on: 'route', pattern: NEW_ROUTE }
        },
        {
            route: NEW_ROUTE,
            element: '[data-tour="study-form"]',
            title: 'Identifica al cliente',
            description: 'Completa <b>tipo y número de identificación</b>, razón social y correo del titular. Con estos datos se consulta al cliente en las centrales de riesgo: revisa que el número sea exacto.',
            side: 'top',
            advance: { on: 'next' }
        },
        {
            route: NEW_ROUTE,
            element: '[data-tour="study-amount"]',
            title: 'El cupo solicitado',
            description: 'El monto que el cliente te está pidiendo. No es un límite tuyo: es la cifra contra la que se evaluará la viabilidad.',
            side: 'top',
            advance: { on: 'next' }
        },
        {
            route: NEW_ROUTE,
            element: '[data-tour="study-term"]',
            title: 'El plazo, en días',
            description: 'El tiempo en que el cliente propone pagar, <b>expresado en días</b>. Junto con el cupo define el esfuerzo financiero del cliente y pesa en el resultado.',
            side: 'top',
            advance: { on: 'next' }
        },
        {
            route: NEW_ROUTE,
            element: '[data-tour="study-stepper"]',
            title: 'Crea el estudio',
            description: 'Termina de diligenciar el formulario y haz click en <b>Crear Estudio</b>. Se abrirá un resumen para que confirmes antes de gastar la consulta.',
            side: 'top',
            advance: { on: 'appear', element: '[data-tour="study-confirm"]' }
        },
        {
            route: NEW_ROUTE,
            element: '[data-tour="study-confirm"]',
            title: 'Confirma la creación',
            description: 'Revisa el resumen: al confirmar <b>se consume una consulta</b> de tu paquete. Si el titular aún no ha firmado la autorización de consulta, la app te pedirá gestionarla y la guía continuará cuando el estudio quede creado.',
            side: 'top',
            advance: { on: 'route', pattern: STUDY_ROUTE }
        },
        {
            route: STUDY_ROUTE,
            element: '[data-tour="study-upload"]',
            title: 'Carga los estados financieros',
            description: 'Haz click y selecciona el <b>PDF digital</b> de los estados financieros del cliente (sin escaneos ni fotos). La plataforma extrae los periodos automáticamente; puede tardar un momento.',
            side: 'top',
            advance: { on: 'appear', element: '[data-tour="study-next-2"]' }
        },
        {
            route: STUDY_ROUTE,
            element: '[data-tour="study-next-2"]',
            title: 'Revisa y continúa',
            description: 'Verifica que los periodos extraídos sean correctos y pulsa <b>Siguiente</b> para pasar al estudio.',
            side: 'top',
            advance: { on: 'appear', element: '[data-tour="study-perform"]' }
        },
        {
            route: STUDY_ROUTE,
            element: '[data-tour="study-perform"]',
            title: 'Realiza el estudio',
            description: 'Haz click en <b>Realizar Estudio</b>: se calculan el score, el cupo viable y las condiciones de crédito contrastando las cifras con las centrales de riesgo.',
            side: 'top',
            advance: { on: 'appear', element: '[data-tour="study-result"]' }
        },
        {
            route: STUDY_ROUTE,
            element: '[data-tour="study-result"]',
            title: '¡Estudio completado!',
            description: 'Este es el resultado: <b>score</b>, <b>cupo viable</b> y condiciones de crédito. Desde aquí puedes descargar el PDF del estudio y, si aplica, gestionar el pagaré.',
            side: 'bottom',
            advance: { on: 'next' }
        }
    ]
};
