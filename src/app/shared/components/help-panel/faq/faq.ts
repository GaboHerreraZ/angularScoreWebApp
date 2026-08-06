import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { normalizeText } from '@/app/shared/utils/text.util';

interface FaqItem {
    question: string;
    answer: string;
    category: string;
}

const FAQ_DATA: FaqItem[] = [
    // General
    {
        category: 'General',
        question: '¿Qué es Credit-ia?',
        answer: 'Credit-ia es una plataforma de análisis de crédito para empresas que otorgan crédito a sus clientes. A partir de la información financiera de tu cliente, calcula indicadores de viabilidad, capacidad de pago y riesgo que apoyan tu decisión de otorgamiento, y te permite formalizar el crédito mediante un pagaré con firma electrónica.'
    },
    {
        category: 'General',
        question: '¿Cómo busco rápidamente dentro de la plataforma?',
        answer: 'Usa la búsqueda global presionando Ctrl + K (o el ícono de búsqueda en la barra superior). Desde ahí puedes encontrar clientes y análisis de crédito sin navegar por los menús.'
    },
    {
        category: 'General',
        question: '¿Puedo personalizar la apariencia de la plataforma?',
        answer: 'Sí. Haz clic en el ícono de paleta en la barra superior para cambiar entre modo claro y oscuro, el esquema de colores y el estilo del menú. Tus preferencias quedan guardadas en tu perfil.'
    },
    {
        category: 'General',
        question: '¿Dónde edito mis datos o los de mi empresa?',
        answer: 'En el menú de Administración encontrarás tu Perfil (datos personales y de contacto) y los datos de la Empresa. Allí también gestionas tu plan, la compra de paquetes y los parámetros de análisis.'
    },
    // Clientes
    {
        category: 'Clientes',
        question: '¿Cómo se crea un cliente?',
        answer: 'Los clientes se crean automáticamente al realizar un análisis de crédito: cuando registras los datos del cliente dentro del análisis, queda guardado en tu Gestión de Clientes. No existe una opción para crear clientes de forma manual o independiente; siempre nacen a partir de un análisis.'
    },
    {
        category: 'Clientes',
        question: '¿Puedo editar o eliminar un cliente?',
        answer: 'No. La información del cliente se registra al momento del análisis de crédito y no es editable ni eliminable desde la Gestión de Clientes. Esto mantiene la trazabilidad: cada cliente queda asociado a los análisis con los que se registró.'
    },
    {
        category: 'Clientes',
        question: '¿Cómo busco un cliente?',
        answer: 'En la pantalla de Gestión de Clientes usa la barra de búsqueda para filtrar por razón social, número de identificación, teléfono o correo. La lista muestra estos datos junto con la ciudad de cada cliente.'
    },
    {
        category: 'Clientes',
        question: '¿Qué información veo en el detalle de un cliente?',
        answer: 'El detalle del cliente reúne sus datos generales (razón social, identificación, actividad económica, contacto y ubicación) y, en la pestaña "Estudios de Crédito", el historial de todos los análisis realizados a ese cliente con su fecha, cupo, plazo y estado.'
    },
    {
        category: 'Clientes',
        question: '¿Puedo exportar mi lista de clientes?',
        answer: 'Sí. En la Gestión de Clientes encontrarás el botón "Exportar", que descarga la lista de clientes en un archivo de Excel.'
    },
    // Análisis de Crédito
    {
        category: 'Análisis de Crédito',
        question: '¿Cómo creo un análisis de crédito?',
        answer: 'Ve a "Estudios de Crédito" y haz clic en "Nuevo Estudio". Registra los datos del cliente y los del crédito solicitado (cupo, plazo y fecha), ingresa la información financiera y ejecuta el análisis con "Realizar Estudio". Al guardar el análisis, el cliente queda registrado automáticamente en tu Gestión de Clientes.'
    },
    {
        category: 'Análisis de Crédito',
        question: '¿Qué información necesito para hacer un análisis?',
        answer: 'Necesitas los datos del cliente, el cupo y el plazo solicitados, y los estados financieros: el balance general (activos, pasivos y patrimonio) y el estado de resultados (ingresos, costos y gastos). Puedes ingresar las cifras manualmente o cargarlas desde un PDF de estados financieros.'
    },
    {
        category: 'Análisis de Crédito',
        question: '¿Puedo cargar los estados financieros desde un PDF?',
        answer: 'Sí, si tu plan lo incluye. Con la opción "Cargar Estados Financieros" subes el PDF y la plataforma extrae las cifras automáticamente. El documento debe ser un PDF digital legible (no fotos, capturas ni copias escaneadas) y pesar máximo 10 MB. La extracción crea el análisis con los datos ya cargados.'
    },
    {
        category: 'Análisis de Crédito',
        question: '¿Qué resultados entrega el análisis?',
        answer: 'El análisis entrega un puntaje de viabilidad con su estado (aprobado, condicional o rechazado), la capacidad de pago mensual y anual, el cupo y plazo recomendados, indicadores financieros (rotaciones de cartera, inventario y proveedores, EBITDA, servicio de la deuda) y alertas de confiabilidad que destacan los puntos a revisar antes de decidir.'
    },
    {
        category: 'Análisis de Crédito',
        question: '¿Qué es el análisis con IA y cómo lo uso?',
        answer: 'Si tu plan lo incluye, sobre un estudio ya realizado puedes generar un análisis con IA que interpreta los indicadores y resume la situación del cliente. Cada análisis con IA consume una solicitud de tu plan y queda guardado en el estudio para consultarlo después.'
    },
    {
        category: 'Análisis de Crédito',
        question: '¿Qué estados puede tener un estudio?',
        answer: 'Un estudio inicia "En Revisión" al crearse; pasa a "Estudio Realizado" cuando ejecutas el análisis; y queda "Aprobado" o "Rechazado" según tu decisión. Una vez aprobado y generado el pagaré, el estudio queda en modo solo lectura.'
    },
    {
        category: 'Análisis de Crédito',
        question: '¿Qué pasa cuando apruebo un crédito?',
        answer: 'Al aprobar, la plataforma genera el pagaré y te muestra una vista previa para que lo revises. Al confirmar, el pagaré se envía al cliente por correo para su firma electrónica. Mientras tanto verás el estado "Pagaré pendiente de firma"; cuando el cliente firme, podrás descargar el documento firmado.'
    },
    {
        category: 'Análisis de Crédito',
        question: '¿Puedo ver el historial de análisis de un cliente?',
        answer: 'Sí. Entra al detalle del cliente y abre la pestaña "Estudios de Crédito" para ver todos los análisis realizados a ese cliente con su fecha, cupo, plazo y estado. Desde allí también puedes iniciar un nuevo estudio para ese mismo cliente.'
    },
    // Paquetes de análisis
    {
        category: 'Paquetes de análisis',
        question: '¿Cuándo se consume un análisis de mi paquete?',
        answer: 'Se descuenta un análisis al crear un nuevo estudio de crédito (incluida la carga por PDF, que crea el estudio). Editar un estudio existente o volver a calcular sus indicadores no consume análisis. El análisis con IA, si tu plan lo incluye, consume aparte una solicitud de ese plan.'
    },
    {
        category: 'Paquetes de análisis',
        question: '¿Cómo compro más análisis de crédito?',
        answer: 'Ve a Administración → Análisis de Crédito. Allí verás los paquetes disponibles; elige uno, revisa el resumen de compra y realiza el pago a través de la pasarela. Los paquetes que compras se suman a los análisis que ya tengas disponibles, sin reemplazarlos.'
    },
    {
        category: 'Paquetes de análisis',
        question: '¿Dónde veo cuántos análisis me quedan?',
        answer: 'En la barra superior se muestra el indicador de análisis disponibles, que corresponde a la suma de las consultas no consumidas de todos tus paquetes activos. Se actualiza automáticamente cada vez que realizas o compras análisis.'
    },
    {
        category: 'Paquetes de análisis',
        question: '¿Puedo usar un código promocional al comprar?',
        answer: 'Sí. En el resumen de compra puedes ingresar tu código promocional y validarlo; si es válido, verás el total con el descuento aplicado antes de pagar. El código se confirma al momento del pago.'
    },
    {
        category: 'Paquetes de análisis',
        question: 'Mi pago quedó pendiente, ¿qué hago?',
        answer: 'En el historial de paquetes (Administración → Análisis de Crédito), los paquetes con pago pendiente muestran la opción "Reintentar pago" para completar la transacción. Allí también puedes revisar los intentos de pago y su estado.'
    }
];

@Component({
    selector: 'app-help-faq',
    standalone: true,
    imports: [CommonModule, FormsModule, AccordionModule, InputTextModule, IconFieldModule, InputIconModule],
    templateUrl: './faq.html'
})
export class HelpFaq {
    searchQuery = signal<string>('');

    categories = computed(() => [...new Set(FAQ_DATA.map((f) => f.category))]);

    filteredFaqs = computed(() => {
        const query = normalizeText(this.searchQuery());
        if (!query) return FAQ_DATA;
        return FAQ_DATA.filter(
            (f) => normalizeText(f.question).includes(query) || normalizeText(f.answer).includes(query)
        );
    });

    faqsByCategory(category: string): FaqItem[] {
        return this.filteredFaqs().filter((f) => f.category === category);
    }

    visibleCategories = computed(() => this.categories().filter((cat) => this.faqsByCategory(cat).length > 0));
}
