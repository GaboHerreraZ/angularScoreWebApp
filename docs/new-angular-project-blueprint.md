# Blueprint para un nuevo proyecto Angular (mismo backend, login y arquitectura)

> **Propósito de este documento.** Este es un manual de arranque dirigido a **otro agente de IA (Claude)** que deberá crear un proyecto Angular **nuevo y separado** que reutiliza el mismo backend, el mismo login (Supabase), los mismos `environment`/`environment.prod`, la misma estructura de carpetas, el mismo layout y la misma arquitectura que el proyecto actual (`creditia-ng`).
>
> El objetivo NO es copiar las features de negocio (clientes, estudio de crédito, etc.), sino replicar **la base técnica reutilizable**: bootstrap, configuración, autenticación, interceptores, guards, servicios core, layout y convenciones. Sobre esa base, el nuevo proyecto construirá sus propias features.
>
> Si encuentras una contradicción entre este documento y el código real del proyecto fuente, **el código fuente manda**. Este documento describe el estado al 2026-06-10.

---

## 1. Stack y versiones

Replica exactamente estas dependencias (ver `package.json` del proyecto fuente):

- **Angular 21+** — standalone components, **sin NgModules**, **zoneless** (`provideZonelessChangeDetection`).
- **PrimeNG 21** + `@primeuix/themes` (tema **Aura**, con dark mode vía selector `.app-dark`).
- **Tailwind CSS 4** (`@tailwindcss/postcss`, `tailwindcss-primeui`).
- **Supabase** (`@supabase/supabase-js` ^2.95) — backend, auth y sesión.
- **TypeScript** ~5.9 en **strict mode**.
- **RxJS** ~7.8.
- Utilidades opcionales presentes en el fuente: `chart.js`, `fuse.js`, `quill`, `primeicons`.
- **Testing:** Jest (`jest-preset-angular`) para unit, Playwright para e2e.
- **Lint/format:** ESLint 9 + Prettier 3.

`package.json` relevante:

```json
{
  "name": "<nuevo-nombre-proyecto>",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "format": "prettier --write \"**/*.{js,mjs,ts,mts,d.ts,html}\" --cache",
    "test": "jest",
    "test:ci": "jest --ci --coverage",
    "e2e": "playwright test"
  },
  "private": true
}
```

---

## 2. Convenciones (OBLIGATORIAS)

Estas son las reglas que el código nuevo debe seguir sí o sí:

1. **Sin sufijo `.component.ts`.** Los componentes usan `nombre.ts` + `nombre.html`. Ej: `login.ts` / `login.html`, no `login.component.ts`.
2. **Servicios** usan `nombre.service.ts`.
3. **Tipos/interfaces** viven en `src/app/types/` (un archivo por dominio: `profile.ts`, `customer.ts`, etc.).
4. **Standalone components** siempre (`standalone: true`, `imports: [...]`).
5. **Reactive forms** con **signals**: `signal()`, `computed()`, `effect()`, `resource()`. Nada de estado mutable suelto.
6. **Inyección con `inject()`** dentro del cuerpo de la clase (no constructor con parámetros), salvo servicios que ya usan constructor en el fuente.
7. **Locale `es-CO`** registrado en `app.config.ts` (incluye traducción completa de PrimeNG al español — copiar bloque `translation` tal cual).
8. **Alias de import `@/*` → `src/*`** (configurado en `tsconfig.json`). Todos los imports internos usan `@/app/...` y `@/environments/...`.
9. **Tema PrimeNG Aura** con dark mode mediante clase `.app-dark`.
10. **Notificaciones** exclusivamente vía `NotificationService` (`success()`, `error()`, `info()`, `warn()`) — envuelve el `MessageService` (Toast) de PrimeNG. No llamar a `MessageService` directamente desde features.
11. **Rutas en español** (`iniciar-sesion`, `clientes`, `administracion`, etc.).
12. **Estilos:** scss para componentes (configurado en `angular.json` schematics), más `styles.scss` global y `tailwind.css`.
13. **Componentes compartidos reutilizables** en `src/app/shared/components/`: tabla (`app-custom-table` con `TableSettings`), phone input (`app-phone-input`), notificación.

---

## 3. Estructura de carpetas

Reproduce esta jerarquía. Las carpetas `core/`, `shared/`, `layout/` y `types/` son la **base reutilizable** y deben copiarse casi tal cual. Las de `features/` son ejemplos; el nuevo proyecto define sus propias features siguiendo el mismo patrón.

```
src/
├── index.html
├── main.ts                       # bootstrapApplication(AppComponent, appConfig)
├── app.component.ts
├── app.config.ts                 # providers globales (router, http, primeng, locale)
├── app.routes.ts                 # rutas raíz
│
├── app/
│   ├── core/                     # ── BASE REUTILIZABLE ──
│   │   ├── constants/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts          # authGuard, noAuthGuard, emailProviderGuard
│   │   │   └── subscription.guard.ts  # (opcional según el dominio)
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts    # inyecta Bearer token + refresh en 401
│   │   │   └── error.interceptor.ts   # toast de errores + redirect a servicio-no-disponible
│   │   ├── services/
│   │   │   ├── api.service.ts         # wrapper HttpClient (get/post/put/patch/delete)
│   │   │   ├── auth.service.ts        # perfil de usuario (carga vía API)
│   │   │   └── supabase.service.ts    # cliente Supabase + sesión + métodos auth
│   │   └── tokens/
│   │
│   ├── features/                 # ── FEATURES (propias del nuevo proyecto) ──
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   └── component/
│   │   │       ├── login/        (login.ts + login.html)
│   │   │       ├── register/
│   │   │       ├── forgotpassword/
│   │   │       ├── newpassword/
│   │   │       ├── callback/     # callback OAuth (Google)
│   │   │       ├── accessdenied/
│   │   │       └── error/
│   │   ├── dashboard/
│   │   ├── landing/
│   │   └── not-found/
│   │
│   ├── layout/                   # ── LAYOUT REUTILIZABLE ──
│   │   ├── components/
│   │   │   ├── layout.ts / layout.html
│   │   │   ├── topbar/
│   │   │   ├── sidebar/
│   │   │   ├── menu/
│   │   │   ├── breadcrumb/
│   │   │   ├── footer/
│   │   │   └── configurator/     # selector de tema/menú/dark mode
│   │   └── service/
│   │       └── layout.service.ts  # estado del layout con signals
│   │
│   ├── shared/                   # ── COMPARTIDO REUTILIZABLE ──
│   │   ├── components/
│   │   │   ├── notification/     # NotificationService + componente Toast
│   │   │   ├── phone-input/      # app-phone-input
│   │   │   └── table/            # app-custom-table (TableSettings)
│   │   ├── directives/
│   │   ├── pipes/
│   │   └── validators/
│   │
│   └── types/                    # interfaces por dominio (profile.ts, table.ts, ...)
│
├── assets/
│   ├── styles.scss
│   ├── tailwind.css
│   └── layout/
│
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

---

## 4. Environments (mismo backend)

El nuevo proyecto consume **el mismo backend y el mismo Supabase**. Copia ambos archivos tal cual del proyecto fuente.

`src/environments/environment.ts` (desarrollo):

```ts
export const environment = {
    production: false,
    supabaseUrl: 'https://bjawxcnsjjobweucxfpf.supabase.co',
    supabaseKey: '<anon/service key del fuente>',
    apiUrl: 'http://localhost:3000/api',
};
```

`src/environments/environment.prod.ts` (producción):

```ts
export const environment = {
    production: true,
    supabaseUrl: 'https://rggavdujvohqxfgjzuyd.supabase.co',
    supabaseKey: '<key del fuente>',
    apiUrl: 'http://localhost:3000/api',
};
```

> ⚠️ **Importante:** copia los valores **exactos** del proyecto fuente (`src/environments/environment.ts` y `environment.prod.ts`), no los transcritos aquí, porque las llaves son largas y pueden cambiar. El reemplazo dev→prod se hace vía `fileReplacements` en `angular.json` (sección de build).

El swap de archivo está configurado en `angular.json`:

```json
"fileReplacements": [
  { "replace": "src/environments/environment.ts", "with": "src/environments/environment.prod.ts" }
]
```

---

## 5. Configuración de TypeScript

`tsconfig.json` (puntos clave — copiar tal cual):

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ES2022",
    "baseUrl": "./",
    "paths": { "@/*": ["src/*"] }    // <-- alias obligatorio
  },
  "angularCompilerOptions": {
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

---

## 6. Bootstrap y configuración de la app

`src/main.ts`:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
```

`src/app.config.ts` — providers globales. **Copiar tal cual**, incluido el bloque `translation` de PrimeNG en español:

```ts
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@/app/core/interceptors/auth.interceptor';
import { errorInterceptor } from '@/app/core/interceptors/error.interceptor';
import { ApplicationConfig, LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';

registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
    providers: [
        MessageService,
        { provide: LOCALE_ID, useValue: 'es-CO' },
        provideRouter(
            appRoutes,
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
            withEnabledBlockingInitialNavigation()
        ),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
        provideZonelessChangeDetection(),
        providePrimeNG({
            theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } },
            translation: { /* copiar el objeto completo de traducción es-CO del fuente */ }
        })
    ]
};
```

> El objeto `translation` (Comienza con / Contiene / nombres de días y meses en español, etc.) debe copiarse íntegro desde `src/app.config.ts` del proyecto fuente.

---

## 7. Autenticación (mismo login — Supabase)

Este es el corazón reutilizable. **Copiar los tres servicios y los guards tal cual.**

### 7.1 `SupabaseService` (`core/services/supabase.service.ts`)

Cliente Supabase central. Expone la sesión y los métodos de auth como **signals**.

- Crea el cliente con `createClient(environment.supabaseUrl, environment.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })`.
- Estado expuesto:
  - `session = signal<Session | null>(null)`
  - `isAuthenticated = computed(() => session() !== null)`
  - `currentUser = computed(...)` — usuario + `phoneFormatted`.
  - `hasEmailProvider = computed(...)` — `true` si el usuario tiene provider `email` (puede cambiar contraseña); `false` si solo entró por OAuth.
  - `loading = signal(true)` — true mientras se inicializa la sesión.
- En el constructor: `initializeSession()` (lee `getSession()`) y se suscribe a `onAuthStateChange` para mantener `session` sincronizada. Desuscribe en `ngOnDestroy`.
- Métodos de auth a replicar:
  - `signInWithPassword(email, password)`
  - `signUp(email, password)`
  - `signInWithGoogle(invitationId?, token?, customRedirectTo?)` — OAuth Google, `redirectTo` por defecto `window.location.origin + '/auth/callback'`.
  - `signInWithOtp(phone)` / `verifyOtp(phone, token)` — SMS OTP (presente pero comentado en el login; mantener disponible).
  - `resetPasswordForEmail(email)` — `redirectTo: '${origin}/auth/nueva-contrasena'`.
  - `updatePassword(password)` — sirve para recuperación y para cambio desde perfil.
  - `getToken()` — devuelve el `access_token` de la sesión actual.
  - `refreshSession()` — refresca la sesión.
  - `signOut()` — cierra sesión y limpia el perfil (`authService.clearProfile()`).

### 7.2 `AuthService` (`core/services/auth.service.ts`)

Gestiona el **perfil de aplicación** del usuario (no la sesión Supabase, sino los datos de negocio que vienen del backend).

- `currentProfile = signal<Profile | null>(null)`.
- `loadProfile(userId)` — `GET profiles/{userId}` vía `ApiService` con header `X-Silent-Error: true` (no muestra toast si falla). Deduplicación con `loadProfilePromise` para evitar llamadas concurrentes.
- `clearProfile()` / `updateCurrentProfile(partial)`.

### 7.3 `ApiService` (`core/services/api.service.ts`)

Wrapper de `HttpClient` sobre `environment.apiUrl`. Métodos `get/post/put/patch/delete<T>(endpoint, ...)` con helper `buildParams`. Todos los endpoints se llaman como `apiUrl + '/' + endpoint`.

### 7.4 Interceptores

**`auth.interceptor.ts`** — inyecta el token y maneja refresh:
- Si la URL es de Supabase o **no** empieza con `environment.apiUrl`, pasa sin tocar.
- Si no, obtiene el token (`getToken()`) y clona el request con `Authorization: Bearer <token>`.
- Si la respuesta es **401**: intenta `refreshSession()`. Si falla, `signOut()` + redirect a `/auth/iniciar-sesion`. Si tiene éxito, reintenta el request con el nuevo token.

**`error.interceptor.ts`** — manejo global de errores:
- Respeta el header `X-Silent-Error` (si está presente, no muestra toast y lo elimina del request).
- Si `status === 0` y el usuario está autenticado → redirige a `/servicio-no-disponible` (backend caído).
- En otros casos muestra `NotificationService.error(...)` con el mensaje del backend o un mensaje por defecto según el código HTTP (mapa 400/401/403/404/409/422/500/503).

### 7.5 Guards (`core/guards/auth.guard.ts`)

- `authGuard` — espera a que `loading` termine; si autenticado, carga el perfil si falta y permite; si no, redirige a `/auth/iniciar-sesion` con `returnUrl`.
- `noAuthGuard` — para rutas de auth: si ya está autenticado, redirige a `/app`.
- `emailProviderGuard` — solo permite a usuarios con credenciales email (los de OAuth no gestionan contraseña); si no, redirige al perfil.
- `subscriptionGuard` (opcional, depende del dominio) — valida que el perfil tenga compañía/suscripción activa; redirige a flujo de suscripción si no.

Todos usan el helper `waitForLoading(service)` que hace polling de `service.loading()` cada 50ms.

### 7.6 Patrón del componente Login (referencia)

El `login.ts` del fuente es la plantilla de cómo se escribe un componente en este proyecto:
- `standalone: true`, `templateUrl: './login.html'`, imports de PrimeNG (`ButtonModule`, `InputTextModule`, `PasswordModule`, `FloatLabelModule`, `CardModule`, `MessageModule`) + `ReactiveFormsModule` + `RouterModule`.
- Dependencias con `inject()`.
- Estado con signals: `loading`, `googleLoading`, `errorMessage`.
- `loginForm = new FormGroup({ email, password })` con validadores.
- `signIn()` → `supabaseService.signInWithPassword()`, maneja errores (`email_not_confirmed`, credenciales inválidas), carga el perfil y navega a `/app`.
- `signInWithGoogle()` → OAuth.
- El bloque de **SMS OTP** está presente comentado para uso futuro — conservarlo.

---

## 8. Rutas

`app.routes.ts` raíz (adaptar las features al nuevo dominio, **mantener el esqueleto**):

```ts
import { Routes } from '@angular/router';
import { Layout } from '@/app/layout/components/layout';
import { authGuard } from '@/app/core/guards/auth.guard';

export const appRoutes: Routes = [
    { path: '', loadComponent: () => import('@/app/features/landing/landing').then(c => c.Landing) },
    {
        path: 'app',
        component: Layout,
        canActivate: [authGuard /*, subscriptionGuard si aplica */],
        children: [
            { path: '', data: { breadcrumb: 'Dashboard' }, loadComponent: () => import('@/app/features/dashboard/dashboard').then(c => c.Dashboard) },
            // ...features del nuevo proyecto con loadChildren / loadComponent
        ]
    },
    { path: 'auth', loadChildren: () => import('@/app/features/auth/auth.routes') },
    { path: 'servicio-no-disponible', loadComponent: () => import('@/app/features/service-unavailable/service-unavailable').then(c => c.ServiceUnavailable) },
    { path: 'no-encontrado', loadComponent: () => import('@/app/features/not-found/not-found').then(c => c.NotFound) },
    { path: '**', redirectTo: '/no-encontrado' }
];
```

`auth.routes.ts` (default export, lazy-loaded):

```ts
import { Routes } from '@angular/router';
import { noAuthGuard } from '@/app/core/guards/auth.guard';
import { Login } from './component/login/login';
import { Register } from './component/register/register';
import { Callback } from './component/callback/callback';
import { ForgotPassword } from './component/forgotpassword/forgotpassword';
import { NewPassword } from './component/newpassword/newpassword';

export default [
    { path: 'iniciar-sesion', component: Login, canActivate: [noAuthGuard] },
    { path: 'registro', component: Register, canActivate: [noAuthGuard] },
    { path: 'recuperar-contrasena', component: ForgotPassword },
    { path: 'nueva-contrasena', component: NewPassword },
    { path: 'callback', component: Callback },
    { path: '', redirectTo: 'iniciar-sesion', pathMatch: 'full' as const },
    { path: '**', redirectTo: '/no-encontrado' }
] as Routes;
```

**Convención de rutas:** todas las rutas protegidas cuelgan de `/app` bajo el `Layout` con `authGuard`. Las rutas de auth usan `noAuthGuard`. Las rutas públicas (landing, legal, errores) van al nivel raíz.

---

## 9. Layout

Replicar `layout/`:
- `Layout` (`layout.ts`) — componente contenedor standalone que compone `Topbar`, `Sidebar`, `Footer`, `Configurator`, `Breadcrumb`, `Notification` (+ otros como notification-center, search-palette, quick-actions si se desean).
- `LayoutService` (`layout/service/layout.service.ts`) — estado del layout con signals: `layoutConfig` (menuMode: static/slim/slim-plus/overlay, darkTheme, layoutTheme, etc.) y `layoutState` (menús activos).
- `containerClass = computed(...)` que mapea config/estado a clases CSS (`layout-static`, `layout-slim`, `layout-dark`, etc.).
- `effect()` que añade/quita `blocked-scroll` del `body` cuando hay menú móvil/overlay activo.

El `Configurator` permite cambiar tema, modo de menú y dark mode en runtime (clase `.app-dark`).

---

## 10. Componentes y servicios compartidos (shared)

Esta sección documenta **cómo construir cada componente/servicio compartido**, su API pública y los `types` que requieren. Todos siguen los mismos patrones, así que conviene entenderlos como una familia:

### Patrones transversales (aplican a casi todos)

1. **Controles de formulario = `ControlValueAccessor` (CVA).** Todos los componentes que son "un campo de formulario" (`phone-input`, `sector-select`, `auto-complete`, `city-control`, `state-control`) implementan `ControlValueAccessor` y se registran con:
   ```ts
   providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NombreComponente), multi: true }]
   ```
   Esto permite usarlos con `formControlName` / `[formControl]` / `[(ngModel)]` como cualquier input nativo.
2. **Patrón CVA estándar.** Mantienen un `innerControl = new FormControl(...)`, propagan cambios con `this.innerControl.valueChanges.subscribe(v => this.onChange(v))`, e implementan `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`. **Siempre usar `{ emitEvent: false }`** dentro de `writeValue`/`setDisabledState` para no disparar `onChange` en bucle. `onBlur()` llama a `onTouched()`.
3. **Inputs como signals.** Usar `input<T>()` / `input.required<T>()`, nunca `@Input()` decorator. Outputs con `output<T>()`.
4. **Datos remotos con `resource()`.** Los selects que cargan listas (sectores, departamentos, ciudades) usan `resource({ params, loader })` y leen `.value()` / `.isLoading()` en el template. El `params` reactivo dispara recarga automática cuando cambia un input.
5. **PrimeNG + FloatLabel.** Los campos se envuelven en `<p-floatlabel [variant]="variant()">` con `<label [for]="inputId()">`. Inputs comunes: `label`, `inputId`, `invalid`, `variant` (`'on' | 'over' | 'in'`), `styleClass`.

---

### 10.1 `app-phone-input` (`shared/components/phone-input/`)

Input telefónico con prefijo de país (addon) + número. CVA que expone un `string`.

**Inputs:** `label` (def. `'Numero de telefono'`), `placeholder` (def. `'3001234567'`), `countryCode` (def. `'+57'`), `inputId`, `invalid`, `variant` (def. `'over'`), `styleClass`.
**Valor:** `string` (el número, sin prefijo).
**Imports:** `InputTextModule`, `InputGroupModule`, `InputGroupAddonModule`, `FloatLabelModule`, `ReactiveFormsModule`.

`phone-input.ts`:
```ts
import { Component, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
    selector: 'app-phone-input',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, InputGroupModule, InputGroupAddonModule, FloatLabelModule],
    templateUrl: './phone-input.html',
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInput), multi: true }]
})
export class PhoneInput implements ControlValueAccessor {
    label = input<string>('Numero de telefono');
    placeholder = input<string>('3001234567');
    countryCode = input<string>('+57');
    inputId = input<string>('phone-number');
    invalid = input<boolean>(false);
    variant = input<'on' | 'over' | 'in'>('over');
    styleClass = input<string>('');

    innerControl = new FormControl('', { nonNullable: true });
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        this.innerControl.valueChanges.subscribe(value => this.onChange(value));
    }
    writeValue(value: string): void { this.innerControl.setValue(value ?? '', { emitEvent: false }); }
    registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
    registerOnTouched(fn: () => void): void { this.onTouched = fn; }
    setDisabledState(isDisabled: boolean): void {
        isDisabled ? this.innerControl.disable({ emitEvent: false }) : this.innerControl.enable({ emitEvent: false });
    }
    onBlur(): void { this.onTouched(); }
}
```

`phone-input.html`:
```html
<p-inputgroup [styleClass]="styleClass()">
    <p-inputgroup-addon><span class="font-semibold text-m">{{ countryCode() }}</span></p-inputgroup-addon>
    <p-floatlabel [variant]="variant()">
        <input [id]="inputId()" pInputText type="tel" [formControl]="innerControl"
               [class.ng-invalid]="invalid()" [class.ng-dirty]="invalid()" class="w-full" (blur)="onBlur()" />
        <label [for]="inputId()">{{ label() }}</label>
    </p-floatlabel>
</p-inputgroup>
```

---

### 10.2 `app-sector-select` (`shared/components/sector-select/`)

Autocomplete de sectores económicos cargados desde `ParameterService.getByType('sector')`. CVA cuyo valor es un `Parameter`. Muestra cada opción como `"<code> - <label>"`.

**Depende de:** `types/parameter.ts` (`Parameter`) y `core/services/parameter.service.ts`.
**Inputs:** `label` (def. `'Sector'`), `inputId`, `invalid`, `variant`, `styleClass` (def. `'w-full'`).
**Valor:** `Parameter | null`.

Puntos clave de implementación:
- Tipo interno `SectorOption = Parameter & { codeLabel: string }`; `toOption()` arma `codeLabel = "${code} - ${label}"` (usado como `optionLabel`).
- `sectorsResource = resource({ params: () => ({}), loader: () => firstValueFrom(parameterService.getByType('sector')).then(m => m.map(toOption)) })`.
- `filtered = signal<SectorOption[]>([])`; `onSearch(event)` filtra `sectorsResource.value()` por `codeLabel.includes(query)`.
- **Resolución diferida por id:** `pendingId = signal<number|null>(null)`. Si `writeValue` recibe un `Parameter` completo (tiene `label` y `code`), lo setea de inmediato; si recibe solo `{ id }`, guarda el id en `pendingId`. Un `effect()` observa `pendingId()` + `sectorsResource.value()` y, cuando la lista carga, resuelve la opción completa. Esto soporta el caso "editar registro" donde solo llega el id antes de que carguen los sectores.
- Template: `<p-autoComplete optionLabel="codeLabel" [dropdown]="true" [forceSelection]="true" [suggestions]="filtered()" (completeMethod)="onSearch($event)">` dentro de `<p-floatlabel>`.

> Es la plantilla canónica de "autocomplete contra un parámetro de catálogo". Para otro catálogo, duplicar cambiando `'sector'` por el tipo correspondiente.

---

### 10.3 `app-auto-complete` (`shared/components/auto-complete/`)

Autocomplete **genérico contra un endpoint del backend** (búsqueda remota por término). Usa `[(ngModel)]` internamente y CVA hacia afuera. Trabaja con `AutoCompleteService` que mapea claves → URLs.

**Type asociado (`auto-complete.service.ts`):**
```ts
export interface AutoCompleteOption { id: number; name: string; }
```

**`AutoCompleteService`** — `providedIn: 'root'`. Mantiene un registro de endpoints y reemplaza placeholders `{param}` en la URL:
```ts
@Injectable({ providedIn: 'root' })
export class AutoCompleteService {
  private readonly apiService = inject(ApiService);
  private readonly endpoints: Record<string, string> = {
    customers: 'companies/{companyId}/customers/autocomplete',
    // agregar más endpoints aquí
  };
  search(key: string, searchTerm: string, params?: Record<string, string | number>): Observable<AutoCompleteOption[]> {
    let url = this.endpoints[key];
    if (!url) throw new Error(`Endpoint key "${key}" not found in AutoCompleteService`);
    if (params) Object.entries(params).forEach(([k, v]) => { url = url.replace(`{${k}}`, String(v)); });
    return this.apiService.get<AutoCompleteOption[]>(url, { params: { search: searchTerm } });
  }
}
```

**`AutoCompleteComponent`** (`selector: 'app-auto-complete'`):
- Inputs: `endpointKey` (`input.required<string>()`), `urlParams` (`Record<string,string|number>`), `placeholder`, `disabled`, `forceSelection` (def. `true`), `dropdown` (def. `true`), `minLength` (def. `1`), `delay` (def. `300`), `showEmptyMessage`, `emptyMessage` (def. `'No se encontraron resultados'`), `styleClass`, `inputStyleClass`, `panelStyleClass`.
- Output: `valueChange = output<AutoCompleteOption | null>()`.
- Estado: `suggestions = signal<AutoCompleteOption[]>([])`, `loading = signal(false)`, `selectedValue: AutoCompleteOption | null`.
- `onSearch(event)`: si `query.length < minLength()` limpia; si no, llama `autoCompleteService.search(endpointKey(), query, urlParams())` y vuelca en `suggestions`.
- CVA + `valueChange.emit()` en `onValueChange`.
- Template: `<p-autocomplete optionLabel="name" appendTo="body" [(ngModel)]="selectedValue" (ngModelChange)="onValueChange($event)" (completeMethod)="onSearch($event)" ...>`.

> Diferencia clave vs `sector-select`: `auto-complete` **busca en el servidor** por término (datos grandes/paginados); `sector-select` carga **todo el catálogo una vez** y filtra en cliente.

---

### 10.4 `app-state-control` (`shared/components/state-control/`)

Select de **departamentos de Colombia** (API pública `api-colombia.com`). CVA cuyo valor es `{ id, name }`.

**Type interno:** `interface DepartmentOption { id: number; name: string; }`.
**Inputs:** `label` (def. `'Departamento'`), `inputId`, `invalid`, `variant` (def. `'on'`).
**Implementación:** inyecta `HttpClient` directo (no `ApiService`, porque es una API externa). `departmentsResource = resource({ loader: () => firstValueFrom(http.get<...>('https://api-colombia.com/api/v1/Department').pipe(map(d => d.map(x => ({id, name})).sort(localeCompare)))) })`. Template: `<p-select optionLabel="name" [filter]="true" filterBy="name" [options]="departmentsResource.value() ?? []" [loading]="departmentsResource.isLoading()">`.

---

### 10.5 `app-city-control` (`shared/components/city-control/`)

Select de **ciudades** dependiente del departamento seleccionado. Igual que `state-control` pero con un input `departmentId` que dispara la recarga del `resource`.

**Type interno:** `interface CityOption { id: number; name: string; }`.
**Inputs:** `departmentId = input<number | null>(null)` (driver), `label` (def. `'Ciudad'`), `inputId`, `invalid`, `variant` (def. `'on'`).
**Implementación clave — `resource` con params reactivos:**
```ts
citiesResource = resource<CityOption[], { departmentId: number | null }>({
    params: () => ({ departmentId: this.departmentId() }),
    loader: ({ params }) => {
        if (!params.departmentId) return Promise.resolve([]);
        return firstValueFrom(this.http.get<...>(`https://api-colombia.com/api/v1/Department/${params.departmentId}/cities`)
            .pipe(map(c => c.map(x => ({ id: x.id, name: x.name })).sort((a,b) => a.name.localeCompare(b.name)))));
    }
});
```
El select se deshabilita con `[disabled]="!departmentId()"`.

> **Patrón de uso state + city:** en el form padre, enlazar el `value().id` de `state-control` al input `[departmentId]` de `city-control`. Al cambiar el departamento, el `resource` de ciudades recarga solo.

---

### 10.6 `app-custom-table` (`shared/components/table/`)

Tabla genérica reutilizable, configurada **por completo vía un objeto `TableSettings`**. Soporta tipos de columna, filtros por columna, búsqueda global, acciones por fila, botones de añadir/exportar, paginación y empty state enriquecido.

**Type asociado (`types/table.ts`) — copiar íntegro:**
```ts
export type TableColumnType = 'text' | 'number' | 'currency' | 'date' | 'avatar' | 'status' | 'boolean' | 'image';
export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface TableColumn {
    header: string; field: string; type: TableColumnType; minWidth?: string;
    // avatar / image
    imageField?: string; textField?: string; imagePrefix?: string; imageSuffix?: string;
    imageClass?: string; imageDynamicClass?: boolean; imageWidth?: number;
    currencyCode?: string;            // currency
    dateFormat?: string;              // date
    severityMap?: Record<string, TagSeverity>; defaultSeverity?: TagSeverity;  // status
    filterable?: boolean; filterOptions?: { label: string; value: string }[];  // filtering
}
export interface TableAction { id: string; icon: string; severity?: TagSeverity; tooltip?: string; visibleField?: string; }
export interface TableActionEvent { action: string; row: any; }
export interface TableEmptyState { icon?: string; title?: string; description?: string; actionLabel?: string; actionIcon?: string; actionSeverity?: TagSeverity; }
export interface TableSettings {
    columns: TableColumn[]; dataKey?: string; rows?: number; rowsPerPageOptions?: number[];
    showGridlines?: boolean; rowHover?: boolean; searchPlaceholder?: string;
    emptyMessage?: string; emptyState?: TableEmptyState; loadingMessage?: string;
    title?: string; titleIcon?: string; showSearch?: boolean; showColumnFilters?: boolean;
    actions?: TableAction[]; actionsHeader?: string;
    addButton?: { label: string; icon: string; severity?: TagSeverity; disabled?: boolean; };
    exportButton?: { label: string; icon: string; severity?: TagSeverity; disabled?: boolean; loading?: boolean; };
}
export interface TablePageChangeEvent { first: number; rows: number; page: number; }
export interface TableSearchEvent { query: string; }
```
> Nota: en el fuente, `TableAction`/`TableEmptyState`/botones repiten la unión de severidad inline; arriba se referencia `TagSeverity` por brevedad — ambas formas son equivalentes.

**`CustomTable`** (`selector: 'app-custom-table'`):
- Inputs: `tableSettings = input.required<TableSettings>()`, `data = input<any[]>([])`, `totalRecords = input<number>(0)`, `loading = input<boolean>(false)`.
- Outputs: `pageChange`, `search`, `actionClick` (emite `TableActionEvent`), `addClick`, `exportClick`.
- Todo lo configurable se deriva con `computed()` desde `tableSettings()` aplicando defaults (`rows ?? 10`, `showGridlines ?? true`, etc.).
- `resolveField(row, 'a.b.c')` resuelve campos anidados por path.
- `getSeverity(value, col)` mapea valor → `TagSeverity` usando `col.severityMap` (case-insensitive) con fallback a `defaultSeverity`.
- El template (`table.html`) usa `@switch (col.type)` para renderizar cada tipo (text/number/currency/date/avatar/image/status/boolean), genera el `p-columnFilter` apropiado por tipo, una columna de acciones con botones tooltip (visibles según `action.visibleField`), y un empty state que distingue "sin resultados de búsqueda" vs "tabla vacía" (con CTA opcional).
- Imports PrimeNG: `TableModule`, `TagModule`, `SelectModule`, `InputTextModule`, `IconFieldModule`, `InputIconModule`, `ButtonModule`, `TooltipModule`.

**Ejemplo de uso:**
```ts
settings: TableSettings = {
  title: 'Clientes', titleIcon: 'pi pi-users',
  columns: [
    { header: 'Nombre', field: 'name', type: 'text' },
    { header: 'Estado', field: 'status', type: 'status',
      severityMap: { activo: 'success', inactivo: 'danger' } },
    { header: 'Creado', field: 'createdAt', type: 'date', dateFormat: 'dd/MM/yyyy' },
  ],
  actions: [{ id: 'edit', icon: 'pi pi-pencil', tooltip: 'Editar' }],
  addButton: { label: 'Nuevo', icon: 'pi pi-plus' },
  emptyState: { icon: 'pi pi-users', title: 'Sin clientes', description: 'Crea el primero', actionLabel: 'Crear cliente' },
};
```
```html
<app-custom-table [tableSettings]="settings" [data]="rows()" [loading]="loading()"
                  (actionClick)="onAction($event)" (addClick)="onAdd()" />
```

---

### 10.7 `app-notification` + `NotificationService` (`shared/components/notification/`)

Sistema de toasts. **El componente solo monta el Toast; toda interacción va por el servicio.**

**`Notification`** (componente) — únicamente renderiza el contenedor:
```ts
@Component({ selector: 'app-notification', standalone: true, imports: [ToastModule], templateUrl: './notification.html' })
export class Notification {}
```
```html
<p-toast position="top-center" />
```
Incluir `<app-notification />` una vez en el `Layout` y en las pantallas de auth.

**`NotificationService`** (`providedIn: 'root'`) — envuelve el `MessageService` de PrimeNG. Requiere que `MessageService` esté en los providers globales (ya está en `app.config.ts`). `life` por severidad: success 3500, info 4000, warn 5000, error 6000.
```ts
@Injectable({ providedIn: 'root' })
export class NotificationService {
    constructor(private messageService: MessageService) {}
    success(detail: string, summary = 'Éxito'): void { this.messageService.add({ severity: 'success', summary, detail, life: 3500 }); }
    info(detail: string, summary = 'Información'): void { this.messageService.add({ severity: 'info', summary, detail, life: 4000 }); }
    warn(detail: string, summary = 'Atención'): void { this.messageService.add({ severity: 'warn', summary, detail, life: 5000 }); }
    error(detail: string, summary = 'Error'): void { this.messageService.add({ severity: 'error', summary, detail, life: 6000 }); }
    clear(): void { this.messageService.clear(); }
}
```

---

### 10.8 `app-help-tooltip` (`shared/components/help-tooltip/`)

Ícono de ayuda circular (`?`) con tooltip. Componente con **template inline** (sin archivo `.html`).

**Inputs:** `text = input.required<string>()`, `position = input<'top'|'bottom'|'left'|'right'>('top')`.
```ts
@Component({
    selector: 'app-help-tooltip',
    standalone: true,
    imports: [TooltipModule],
    template: `
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40
                     text-blue-600 dark:text-blue-300 cursor-help hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
              [pTooltip]="text()" [tooltipPosition]="position()" [tooltipOptions]="{ showDelay: 150, hideDelay: 100 }">
            <i class="pi pi-question-circle text-[11px]"></i>
        </span>`
})
export class HelpTooltip {
    text = input.required<string>();
    position = input<'top' | 'bottom' | 'left' | 'right'>('top');
}
```
Uso: `<app-help-tooltip text="Explicación del campo" position="right" />` junto a labels.

---

### 10.9 `ConfirmService` (`shared/services/confirm.service.ts`)

Servicio de diálogos de confirmación tipados, sobre el `ConfirmationService` de PrimeNG.

**Types asociados:**
```ts
export type ConfirmKind = 'danger' | 'warn' | 'info';
export interface ConfirmOptions {
    title: string; message: string; kind?: ConfirmKind;
    acceptLabel?: string; rejectLabel?: string; icon?: string;
    onAccept: () => void; onReject?: () => void;
}
```

**Particularidades importantes:**
- **NO es `providedIn: 'root'`.** Se registra con el helper `provideConfirm()` (que provee `ConfirmationService` + `ConfirmService`), y requiere un `<p-confirmDialog />` en el template del componente/host que lo use.
  ```ts
  export const provideConfirm = (): Provider[] => [ConfirmationService, ConfirmService];
  ```
- Cada `kind` tiene defaults (icono, label de aceptar, severidad): `danger` → trash/Eliminar/danger; `warn` → triangle/Continuar/warn; `info` → info-circle/Aceptar/info. `rejectLabel` por defecto `'Cancelar'`.
- API:
  ```ts
  confirm(options: ConfirmOptions): void              // genérico
  delete(itemName, onAccept, customMessage?): void     // atajo para borrar (kind danger + mensaje estándar)
  ```
- Uso típico:
  ```ts
  this.confirmService.delete('este cliente', () => this.remove(id));
  ```

---

### Otros artefactos de `shared/`

- `directives/` — p. ej. `scroll-animate.directive.ts`.
- `pipes/` — p. ej. `time-ago` (en layout/notification-center).
- `validators/` — validadores reactivos reutilizables (p. ej. `card.validators.ts`).

> **Regla de oro al portar:** copiar primero los `types` (`types/parameter.ts`, `types/table.ts`) y los servicios core de los que dependen (`ParameterService`, `ApiService`), luego los componentes. Verificar que `MessageService` y, donde se use confirmación, `provideConfirm()` + `<p-confirmDialog />` estén disponibles.

---

## 11. Estilos y assets

- `angular.json` → `styles`: `["src/assets/styles.scss", "src/assets/tailwind.css"]`.
- Schematics de componentes con `style: "scss"`.
- `tailwind.css` integra Tailwind 4 + `tailwindcss-primeui`.
- Carpeta `src/assets/layout/` con los estilos del layout (sass del tema).
- `public/` se copia tal cual como assets (`{ "glob": "**/*", "input": "public" }`).
- Budgets de producción: initial warning 1mb / error 5mb; component style warning 2kb / error 4kb.

---

## 12. Pasos sugeridos para el agente que cree el proyecto

1. `ng new <nombre> --standalone --style scss --routing` (o crear estructura manual) con Angular 21.
2. Ajustar `package.json` con las dependencias del fuente (PrimeNG 21, @primeuix/themes, supabase-js, tailwind 4, etc.) y los scripts. `npm install`.
3. Configurar `tsconfig.json` (strict + alias `@/*`).
4. Configurar `angular.json` (styles, scss, fileReplacements, budgets, analytics off).
5. Copiar `src/environments/environment.ts` y `environment.prod.ts` **con los valores exactos del fuente**.
6. Copiar `main.ts`, `app.component.ts`, `app.config.ts` (incluida la traducción es-CO completa).
7. Copiar **íntegramente** `core/` (services, interceptors, guards, constants, tokens) — es la base de auth y API.
8. Copiar `shared/` (notification, table, phone-input, directives, pipes, validators).
9. Copiar `layout/` completo y `assets/` (styles.scss, tailwind.css, layout/).
10. Copiar `types/` que sean transversales (`profile.ts`, `table.ts`, `user.ts`). Crear los nuevos tipos del dominio.
11. Copiar `features/auth/` completo (login, register, forgot/new password, callback) — el login es idéntico.
12. Crear `app.routes.ts` con el esqueleto (`/app` + `authGuard` + `Layout`, `/auth`, rutas públicas) y añadir las features nuevas.
13. Crear las features propias del nuevo proyecto siguiendo el patrón de componentes (signals, reactive forms, `ApiService`, `NotificationService`).
14. Verificar: `npm start` levanta, el login contra Supabase funciona, los requests llevan `Bearer` token y los 401 refrescan sesión.

---

## 13. Checklist de "lo que debe quedar idéntico al fuente"

- [ ] Mismo `supabaseUrl` / `supabaseKey` / `apiUrl` en ambos environments.
- [ ] Mismo `SupabaseService`, `AuthService`, `ApiService`.
- [ ] Mismos `auth.interceptor` y `error.interceptor` registrados en `app.config.ts`.
- [ ] Mismos guards (`authGuard`, `noAuthGuard`, `emailProviderGuard`).
- [ ] Mismo flujo de login (email/password + Google OAuth, SMS OTP comentado).
- [ ] Mismo `LOCALE_ID = 'es-CO'` + traducción PrimeNG.
- [ ] Mismo tema Aura + dark mode `.app-dark`.
- [ ] Mismo alias `@/*`, mismas convenciones de nombres (sin `.component.ts`).
- [ ] Mismo `NotificationService` + `<app-notification>` para toasts.
- [ ] Mismo Layout (Topbar/Sidebar/Menu/Breadcrumb/Footer/Configurator) + `LayoutService`.
- [ ] Mismos componentes shared con su API y types (ver §10): `app-phone-input`, `app-sector-select`, `app-auto-complete` (+`AutoCompleteService`/`AutoCompleteOption`), `app-state-control`, `app-city-control`, `app-custom-table` (+`types/table.ts`), `app-notification`, `app-help-tooltip`.
- [ ] Mismo `ConfirmService` (+`provideConfirm()` + `<p-confirmDialog>`) y sus types (`ConfirmKind`, `ConfirmOptions`).
- [ ] Mismos types base: `types/parameter.ts`, `types/table.ts`.

---

**Resumen:** el nuevo proyecto es un "clon de la base técnica" del proyecto `creditia-ng`. Reutiliza backend, Supabase, environments, auth, interceptores, guards, layout y convenciones; solo cambian las **features de negocio**, que se construyen siguiendo exactamente los mismos patrones (standalone components, signals, reactive forms, `ApiService`, `NotificationService`).
