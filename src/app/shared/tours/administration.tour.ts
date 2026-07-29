import { TourDefinition } from '@/app/types/tour';

export const ADMIN_PROFILE_TOUR: TourDefinition = {
    id: 'administration.profile',
    title: 'Recorrido de Perfil',
    description: 'Qué puedes editar de tu cuenta y qué está bloqueado.',
    kind: 'overview',
    icon: 'pi pi-user',
    version: 1,
    routes: ['/app/administracion/perfil'],
    exactRoute: true,
    minutes: 2,
    steps: [
        {
            element: '[data-tour="admin-tabs"]',
            title: 'Secciones de Administración',
            description: 'Aquí cambias de sección. Cada una tiene su propia guía: al entrar, ábrela desde el botón del birrete abajo a la derecha.',
            side: 'bottom',
            align: 'start'
        },
        {
            element: '[data-tour="profile-avatar"]',
            title: 'Tu avatar',
            description: 'Se genera con las iniciales de tu nombre y apellido. <b>No hay que subir ninguna foto</b>: cambia solo cuando corriges tu nombre.',
            side: 'bottom'
        },
        {
            element: '[data-tour="profile-personal"]',
            title: 'Información personal',
            description: '<b>Nombre</b> y <b>apellido</b> son obligatorios. El documento y el teléfono son opcionales, pero conviene tenerlos completos porque aparecen en los documentos que genera la plataforma.',
            side: 'top'
        },
        {
            element: '[data-tour="profile-email"]',
            title: 'El correo no se edita',
            description: 'Es el que usas para iniciar sesión, así que está bloqueado. Si necesitas cambiarlo, escríbenos desde el <b>Centro de ayuda</b>.',
            side: 'bottom'
        },
        {
            element: '[data-tour="profile-work"]',
            title: 'Información laboral',
            description: '<b>Cargo en la empresa</b> lo escribes tú, es libre. <b>Rol en el sistema</b> aparece bloqueado porque define tus permisos y solo lo cambia un administrador desde la sección Empresa.',
            side: 'top'
        },
        {
            element: '[data-tour="profile-save"]',
            title: 'Guardar cambios',
            description: 'El botón se activa solo cuando hay algo modificado. Si lo ves gris, es que no tienes cambios pendientes.',
            side: 'left'
        }
    ]
};

export const ADMIN_SECURITY_TOUR: TourDefinition = {
    id: 'administration.security',
    title: 'Recorrido de Seguridad',
    description: 'Cómo cambiar tu contraseña de acceso.',
    kind: 'overview',
    icon: 'pi pi-lock',
    version: 1,
    routes: ['/app/administracion/seguridad'],
    exactRoute: true,
    minutes: 1,
    steps: [
        {
            element: '[data-tour="password-current"]',
            title: 'Confirma que eres tú',
            description: 'Primero tu contraseña <b>actual</b>. Es la verificación que impide que alguien cambie el acceso desde una sesión que dejaste abierta.',
            side: 'right'
        },
        {
            element: '[data-tour="password-new"]',
            title: 'La nueva contraseña',
            description: 'Al escribirla verás un indicador de qué tan fuerte es. El ícono del ojo te deja revisar lo que escribiste antes de confirmar.',
            side: 'right'
        },
        {
            element: '[data-tour="password-confirm"]',
            title: 'Repítela',
            description: 'Si las dos no coinciden te avisamos aquí mismo, antes de enviar nada.',
            side: 'right'
        },
        {
            element: '[data-tour="password-submit"]',
            title: 'Actualizar',
            description: 'Al confirmar, la contraseña cambia de inmediato. La próxima vez que inicies sesión será con la nueva.',
            side: 'right'
        }
    ]
};

export const ADMIN_COMPANY_TOUR: TourDefinition = {
    id: 'administration.company',
    title: 'Recorrido de Empresa',
    description: 'Datos, contrato, facturación y el equipo con acceso.',
    kind: 'overview',
    icon: 'pi pi-building',
    version: 1,
    routes: ['/app/administracion/empresa'],
    exactRoute: true,
    minutes: 3,
    steps: [
        {
            element: '[data-tour="company-logo"]',
            title: 'Logo de la empresa',
            description: 'Haz clic sobre la imagen o usa <b>Cambiar logo</b>. Acepta PNG, JPG o WebP de hasta <b>2 MB</b>.',
            side: 'bottom',
            align: 'start'
        },
        {
            element: '[data-tour="company-contract"]',
            title: 'Contrato de servicio',
            description: 'Aquí ves si tu contrato ya está firmado y desde cuándo. <b>Descargar documento</b> se habilita cuando el archivo firmado está disponible.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="company-data"]',
            title: 'Datos de la empresa',
            description: '<b>Nombre</b>, <b>ciudad</b> y <b>sector</b> son obligatorios. El sector importa más de lo que parece: influye en cómo se interpretan los estudios de crédito.',
            side: 'top'
        },
        {
            element: '[data-tour="company-financial"]',
            title: 'Datos financieros',
            description: 'La cuenta bancaria de tu empresa, para pagos y transferencias.',
            side: 'top'
        },
        {
            element: '[data-tour="company-billing"]',
            title: 'Datos de facturación',
            description: 'Con estos datos se emiten tus facturas cuando compras paquetes de análisis. Revísalos antes de tu primera compra.',
            side: 'top'
        },
        {
            element: '[data-tour="company-save"]',
            title: 'Un solo Guardar',
            description: 'Cubre a la vez los datos de la empresa y los de facturación, y se activa solo cuando hay cambios pendientes.',
            side: 'left'
        },
        {
            element: '[data-tour="company-users"]',
            title: 'Tu equipo',
            description: 'Aquí controlas quién entra a la plataforma: <b>invitas</b> por correo, <b>reenvías</b> la invitación si no llegó, y <b>activas o desactivas</b> usuarios. Desactivar le quita el acceso sin borrar su historial.',
            side: 'top'
        }
    ]
};

export const ADMIN_PACKS_TOUR: TourDefinition = {
    id: 'administration.packs',
    title: 'Recorrido de Análisis de Crédito',
    description: 'Comprar paquetes de consultas y seguir tu consumo.',
    kind: 'overview',
    icon: 'pi pi-box',
    version: 1,
    routes: ['/app/administracion/analisis-credito'],
    exactRoute: true,
    minutes: 3,
    steps: [
        {
            element: '[data-tour="packs-catalog"]',
            title: 'Comprar consultas',
            description: 'Cada análisis de crédito consume una consulta. Aquí compras paquetes: <b>pagas solo por lo que necesitas</b>, sin mensualidad. Al comprar puedes aplicar un código promocional.',
            side: 'bottom'
        },
        {
            element: '[data-tour="packs-included"]',
            title: 'Qué incluye cada análisis',
            description: 'Lo que obtienes por consulta es lo mismo en todos los paquetes: lo único que cambia es la cantidad y el precio por unidad.',
            side: 'top'
        },
        {
            element: '[data-tour="packs-history"]',
            title: 'Mis paquetes y consumo',
            description: 'El histórico de tus compras: cuántas consultas llevas usadas, cuántas te quedan, la vigencia del paquete y el estado del pago. <b>Los paquetes se suman</b>, comprar uno nuevo no anula los que ya tienes.',
            side: 'top'
        },
        {
            element: '[data-tour="packs-row-toggle"]',
            title: 'El detalle de cada paquete',
            description: 'La flecha despliega la fila y te muestra los <b>intentos de pago</b> y las <b>consultas realizadas</b> con ese paquete, con enlace directo al estudio y al cliente.',
            side: 'right'
        },
        {
            element: '[data-tour="packs-retry"]',
            title: 'Si un pago quedó pendiente',
            description: 'Cuando el pago no se completó aparece este botón para reintentarlo sin volver a armar la compra.',
            side: 'left'
        }
    ]
};

export const ADMIN_DIMENSIONS_TOUR: TourDefinition = {
    id: 'administration.dimensions',
    title: 'Recorrido de Configuración de Dimensiones',
    description: 'Qué pesa cada factor al calcular un estudio de crédito.',
    kind: 'overview',
    icon: 'pi pi-sliders-v',
    version: 1,
    routes: ['/app/administracion/configuracion-dimensiones'],
    exactRoute: true,
    minutes: 3,
    steps: [
        {
            element: '[data-tour="dimensions-person-type"]',
            title: 'Primero: tipo de cliente',
            description: 'La configuración es <b>independiente para cada tipo de persona</b>. Lo que ajustes aquí no afecta al otro tipo, así que revisa ambos.',
            side: 'bottom',
            align: 'start'
        },
        {
            element: '[data-tour="dimensions-edit"]',
            title: 'La pantalla arranca bloqueada',
            description: 'Se muestra en solo lectura para que no cambies por accidente algo que afecta a todos los estudios futuros. Pulsa <b>Editar dimensiones</b> para desbloquearla.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="dimensions-grid"]',
            title: 'Cada tarjeta es un factor',
            description: 'Decides <b>si se considera</b> y <b>cuánto pesa</b>. Algunas están marcadas como obligatorias y no se pueden desactivar porque el cálculo no funciona sin ellas.',
            side: 'top'
        },
        {
            element: '[data-tour="dimensions-total"]',
            title: 'Los pesos deben sumar 100 %',
            description: 'La barra te dice en vivo si te falta o te pasas, y cada dimensión activa tiene un peso mínimo. <b>Guardar sigue bloqueado hasta que el total sea válido.</b>',
            side: 'top'
        },
        {
            element: '[data-tour="dimensions-reset"]',
            title: 'Volver a empezar',
            description: '<b>Restaurar predeterminados</b> devuelve los valores con los que viene el sistema. Útil si tocaste demasiado y ya no sabes de dónde partiste.',
            side: 'bottom',
            align: 'end'
        },
        {
            element: '[data-tour="dimensions-history"]',
            title: 'Historial de configuraciones',
            description: 'Cada versión guardada queda registrada. Sirve para entender por qué un estudio antiguo dio un resultado distinto: se calculó con la configuración vigente en ese momento.',
            side: 'top'
        }
    ]
};
