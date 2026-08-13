import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@/app/core/interceptors/auth.interceptor';
import { errorInterceptor } from '@/app/core/interceptors/error.interceptor';
import { ApplicationConfig, inject, LOCALE_ID, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { AnalyticsService } from '@/app/core/services/analytics.service';

registerLocaleData(localeEsCo);
import { provideRouter, TitleStrategy, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { AppTitleStrategy } from '@/app/core/services/title.strategy';

export const appConfig: ApplicationConfig = {
    providers: [
        MessageService,
        { provide: TitleStrategy, useClass: AppTitleStrategy },
        { provide: LOCALE_ID, useValue: 'es-CO' },
        provideAppInitializer(() => inject(AnalyticsService).init()),
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
        provideZonelessChangeDetection(),
        providePrimeNG({
            theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } },
            // Monta los overlays (select, autocomplete, datepicker, etc.) en el body.
            // Por defecto PrimeNG v21 usa 'self', lo que hace que el desplegable quede
            // atrapado dentro de contenedores con overflow-hidden y se recorte por debajo del card.
            overlayAppendTo: 'body',
            translation: {
                startsWith: 'Comienza con',
                contains: 'Contiene',
                notContains: 'No contiene',
                endsWith: 'Termina con',
                equals: 'Igual a',
                notEquals: 'No igual a',
                noFilter: 'Sin filtro',
                lt: 'Menor que',
                lte: 'Menor o igual que',
                gt: 'Mayor que',
                gte: 'Mayor o igual que',
                is: 'Es',
                isNot: 'No es',
                before: 'Antes',
                after: 'Despues',
                dateIs: 'Fecha es',
                dateIsNot: 'Fecha no es',
                dateBefore: 'Fecha antes de',
                dateAfter: 'Fecha despues de',
                clear: 'Limpiar',
                apply: 'Aplicar',
                matchAll: 'Coincidir todo',
                matchAny: 'Coincidir cualquiera',
                addRule: 'Agregar regla',
                removeRule: 'Eliminar regla',
                accept: 'Aceptar',
                reject: 'Rechazar',
                choose: 'Elegir',
                upload: 'Subir',
                cancel: 'Cancelar',
                dayNames: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
                dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
                dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
                monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
                monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                today: 'Hoy',
                weekHeader: 'Sem',
                firstDayOfWeek: 1,
                dateFormat: 'dd/mm/yy',
                weak: 'Debil',
                medium: 'Medio',
                strong: 'Fuerte',
                passwordPrompt: 'Ingrese una contrasena',
                emptyMessage: 'No se encontraron resultados',
                emptyFilterMessage: 'No se encontraron resultados'
            }
        })
    ]
};
