import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

interface FaqItem {
    question: string;
    answer: string;
    category: string;
}

const FAQ_DATA: FaqItem[] = [
    // General
    {
        category: 'General',
        question: '¿Qué es Riskia?',
        answer: 'Riskia es una plataforma de gestión de clientes y estudios de crédito diseñada para agilizar el análisis financiero de sus clientes, centralizar la información y facilitar la toma de decisiones.'
    },
    {
        category: 'General',
        question: '¿Cómo cambio mi contraseña?',
        answer: 'Dirígete a Administración → Perfil y utiliza la opción "Cambiar contraseña". También puedes hacerlo desde la pantalla de inicio de sesión con la opción "¿Olvidé mi contraseña?".'
    },
    {
        category: 'General',
        question: '¿Puedo personalizar la apariencia de la plataforma?',
        answer: 'Sí. Haz clic en el ícono de paleta (🎨) en la barra superior para cambiar el tema, el modo oscuro/claro y el esquema de colores. Puedes guardar tus preferencias para que se apliquen en cada sesión.'
    },
    // Clientes
    {
        category: 'Clientes',
        question: '¿Cómo agrego un nuevo cliente?',
        answer: 'Ve al módulo "Clientes" en el menú lateral y haz clic en el botón "Agregar Cliente". Completa el formulario con la información requerida y guarda los cambios.'
    },
    {
        category: 'Clientes',
        question: '¿Puedo buscar un cliente por nombre o identificación?',
        answer: 'Sí. En la pantalla principal de Clientes encontrarás una barra de búsqueda. Puedes ingresar el nombre, razón social o número de identificación para filtrar los resultados en tiempo real.'
    },
    {
        category: 'Clientes',
        question: '¿Cómo edito la información de un cliente?',
        answer: 'En la tabla de clientes, haz clic en el ícono de edición (✏️) en la fila del cliente que deseas modificar. Se abrirá el formulario con los datos actuales que puedes actualizar y guardar.'
    },
    // Estudio de Crédito
    {
        category: 'Estudio de Crédito',
        question: '¿Cómo creo un estudio de crédito?',
        answer: 'Desde el módulo "Estudio de Crédito", haz clic en "Nuevo Estudio". Selecciona el cliente, completa la información financiera requerida y guarda. El sistema calculará automáticamente los indicadores de análisis.'
    },
    {
        category: 'Estudio de Crédito',
        question: '¿Qué información se analiza en el estudio de crédito?',
        answer: 'El estudio evalúa ingresos, egresos, activos, pasivos y referencias financieras del cliente. Los parámetros de análisis pueden configurarse desde Administración → Parámetros de Análisis.'
    },
    {
        category: 'Estudio de Crédito',
        question: '¿Puedo ver el historial de estudios de un cliente?',
        answer: 'Sí. Ingresa al detalle del cliente y selecciona la pestaña "Estudios de Crédito". Allí verás el historial completo de estudios realizados con sus fechas y resultados.'
    },
    // Facturación
    {
        category: 'Facturación',
        question: '¿Cómo veo mi plan actual?',
        answer: 'Ve a Administración → Plan y Facturación para ver los detalles de tu plan actual, fecha de renovación y opciones de actualización.'
    },
    {
        category: 'Facturación',
        question: '¿Cómo cancelo mi suscripción?',
        answer: 'Para cancelar tu suscripción comunícate con nuestro equipo de soporte a través del formulario de esta sección o escríbenos directamente. Te guiaremos en el proceso.'
    },
    {
        category: 'Facturación',
        question: '¿Puedo cambiar de plan en cualquier momento?',
        answer: 'Sí. Los cambios de plan se aplican al inicio del siguiente ciclo de facturación. Contacta a nuestro equipo de soporte para gestionar el cambio.'
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
        const query = this.searchQuery().toLowerCase().trim();
        if (!query) return FAQ_DATA;
        return FAQ_DATA.filter((f) => f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query));
    });

    faqsByCategory(category: string): FaqItem[] {
        return this.filteredFaqs().filter((f) => f.category === category);
    }

    visibleCategories = computed(() => this.categories().filter((cat) => this.faqsByCategory(cat).length > 0));
}
