# Verona NG

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Supabase Edge Functions

### Send SMS (Infobip)

La funcion `send-sms` es una Edge Function que envia codigos OTP via SMS usando la API de Infobip. Supabase Auth la invoca automaticamente a traves del hook `send_sms` cuando un usuario solicita login por telefono.

#### Estructura

```
supabase/
  functions/
    send-sms/
      index.ts       # Logica de envio SMS via Infobip
      deno.json       # Configuracion de Deno e import map
  .env.local          # Variables de entorno locales (no se sube a git)
  .env.example        # Plantilla de variables de entorno
  config.toml         # Configuracion de Supabase
```

#### Variables de entorno requeridas

| Variable | Descripcion |
|---|---|
| `INFOBIP_BASE_URL` | Dominio de tu cuenta Infobip (ej: `xxxxx.api.infobip.com`) |
| `INFOBIP_API_KEY` | API Key de Infobip |
| `INFOBIP_SENDER` | Nombre del remitente (por defecto: `VERONA`) |

#### Configuracion inicial

1. Copia el archivo de ejemplo y completa tus credenciales:
   ```bash
   cp supabase/.env.example supabase/.env.local
   ```

2. Instala Supabase CLI (no soporta instalacion global con npm):
   ```bash
   npx supabase --version
   ```

3. Login y vincula tu proyecto:
   ```bash
   npx supabase login
   npx supabase link --project-ref <tu-project-ref>
   ```

#### Despliegue

1. Configura los secrets en Supabase Cloud:
   ```bash
   npx supabase secrets set INFOBIP_BASE_URL=<tu-base-url> INFOBIP_API_KEY=<tu-api-key> INFOBIP_SENDER=VERONA
   ```

2. Despliega la funcion:
   ```bash
   npx supabase functions deploy send-sms --no-verify-jwt
   ```

3. Configura el hook en el dashboard de Supabase:
   - Ve a **Authentication > Hooks**
   - Habilita **Send SMS**
   - Tipo: **HTTPS**
   - URL: `https://<tu-project-ref>.supabase.co/functions/v1/send-sms`

#### Flujo de autenticacion

1. El usuario ingresa su numero de telefono en el login
2. Se llama a `signInWithOtp()` del cliente Supabase
3. Supabase Auth genera el OTP y dispara el hook `send_sms`
4. El hook llama a la Edge Function `send-sms`
5. La funcion envia el SMS usando la API de Infobip
6. El usuario recibe el codigo y lo verifica para completar el login

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.