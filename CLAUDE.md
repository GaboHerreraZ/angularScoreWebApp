# Project Context

## Stack
- Angular 19+ (standalone components, no NgModules)
- PrimeNG (UI components)
- Tailwind CSS 4
- Supabase (backend/auth)
- TypeScript strict mode

## Conventions
- Components use `.ts` and `.html` (no `.component.ts` suffix)
- Services use `.service.ts`
- Types/interfaces in `src/app/types/`
- Locale: es-CO (registered in app.config.ts)
- PrimeNG Aura theme with dark mode support
- Reactive forms with Angular signals (`signal()`, `computed()`, `resource()`, `effect()`)
- Shared reusable table component: `app-custom-table` with `TableSettings` config
- Shared phone input component: `app-phone-input` (international phone input with country selector)
- Notifications via `NotificationService` (`success()`, `error()`, `info()`, `warn()`) — uses PrimeNG Toast

## Project Structure

```
src/
|-- index.html
|-- main.ts
|-- app.component.ts
|-- app.config.ts
|-- app.routes.ts
|
|-- app/
|   |-- core/
|   |   |-- constants/
|   |   |-- guards/
|   |   |   +-- auth.guard.ts
|   |   |-- interceptors/
|   |   |   |-- auth.interceptor.ts
|   |   |   +-- error.interceptor.ts
|   |   |-- services/
|   |   |   |-- api.service.ts
|   |   |   |-- parameter.service.ts
|   |   |   +-- supabase.service.ts
|   |   +-- tokens/
|   |
|   |-- features/
|   |   |-- administration/
|   |   |   |-- administration.html
|   |   |   |-- administration.routes.ts
|   |   |   |-- administration.ts
|   |   |   +-- components/
|   |   |       |-- analysis-parameters/
|   |   |       |   +-- analysis-parameters.ts
|   |   |       |-- company/
|   |   |       |   |-- company.html
|   |   |       |   |-- company.service.ts
|   |   |       |   +-- company.ts
|   |   |       |-- plan-billing/
|   |   |       |   +-- plan-billing.ts
|   |   |       +-- profile/
|   |   |           |-- profile.html
|   |   |           |-- profile.service.ts
|   |   |           +-- profile.ts
|   |   |
|   |   |-- auth/
|   |   |   |-- auth.routes.ts
|   |   |   +-- component/
|   |   |       |-- accessdenied.ts
|   |   |       |-- error.ts
|   |   |       |-- forgotpassword.ts
|   |   |       |-- lockscreen.ts
|   |   |       |-- login.html
|   |   |       |-- login.ts
|   |   |       |-- newpassword.ts
|   |   |       |-- otp-input.ts
|   |   |       |-- register.ts
|   |   |       +-- verification.ts
|   |   |
|   |   |-- credit-study/
|   |   |   |-- credit-study.html
|   |   |   |-- credit-study.routes.ts
|   |   |   |-- credit-study.service.ts
|   |   |   |-- credit-study.ts
|   |   |   +-- credit-study-detail/
|   |   |       |-- credit-study-detail.html
|   |   |       +-- credit-study-detail.ts
|   |   |
|   |   |-- customers/
|   |   |   |-- customers.html
|   |   |   |-- customers.routes.ts
|   |   |   |-- customers.service.ts
|   |   |   |-- customers.ts
|   |   |   +-- customer-detail/
|   |   |       |-- customer-detail.html
|   |   |       +-- customer-detail.ts
|   |   |
|   |   |-- dashboard/
|   |   |   |-- dashboard.html
|   |   |   +-- dashboard.ts
|   |   |
|   |   |-- landing/
|   |   |   |-- landing.html
|   |   |   |-- landing.ts
|   |   |   +-- components/
|   |   |       |-- featureswidget.ts
|   |   |       |-- footerwidget.ts
|   |   |       |-- headerwidget.ts
|   |   |       |-- herowidget.ts
|   |   |       |-- joinwidget.ts
|   |   |       |-- pricingwidget.ts
|   |   |       +-- statswidget.ts
|   |   |
|   |   +-- not-found/
|   |       |-- not-found.html
|   |       +-- not-found.ts
|   |
|   |-- layout/
|   |   |-- components/
|   |   |   |-- layout.html
|   |   |   |-- layout.ts
|   |   |   |-- breadcrumb/
|   |   |   |-- configurator/
|   |   |   |-- footer/
|   |   |   |-- menu/
|   |   |   |-- sidebar/
|   |   |   +-- topbar/
|   |   +-- service/
|   |       +-- layout.service.ts
|   |
|   |-- shared/
|   |   |-- components/
|   |   |   |-- notification/
|   |   |   |   |-- notification.html
|   |   |   |   |-- notification.service.ts
|   |   |   |   +-- notification.ts
|   |   |   |-- phone-input/
|   |   |   |   |-- phone-input.html
|   |   |   |   +-- phone-input.ts
|   |   |   +-- table/
|   |   |       |-- table.html
|   |   |       +-- table.ts
|   |   |-- directives/
|   |   |-- pipes/
|   |   +-- validators/
|   |
|   +-- types/
|       |-- company.ts
|       |-- credit-study.ts
|       |-- customer.ts
|       |-- parameter.ts
|       |-- profile.ts
|       |-- table.ts
|       |-- user.ts
|       +-- (other domain types)
|
|-- assets/
|   |-- styles.scss
|   |-- tailwind.css
|   +-- layout/
|
+-- environments/
    |-- environment.ts
    +-- environment.prod.ts
```
