# Credit-ia NG

Angular application generated with [Angular CLI](https://github.com/angular/angular-cli) version 21.

## Build

### Environment variables

The files `src/environments/environment.ts` and `environment.prod.ts` are gitignored:

- **Local development**: create them manually (see [Local development](#local-development)).
- **CI**: they are generated automatically by the `scripts/generate-env.mjs` script (npm `prebuild` hook) from the following environment variables:

| Variable | Description | Example |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Supabase anon key | `eyJhbGci...` |
| `API_URL` | Backend URL (Railway) | `https://xxx.up.railway.app/api` |

If the files already exist, the script does not overwrite them.

### Compile

```bash
npm ci
npm run build
```

`npm run build` first runs `generate-env.mjs` and then `ng build` (production configuration by default). The build artifacts are output to:

```
dist/creditia-ng/browser
```

That directory contains the static SPA, ready to be served from any static file hosting. Since Angular handles routing on the client, the hosting must rewrite all routes to `index.html`.

### Local development

For local development, create the file `src/environments/environment.ts` manually:

```typescript
export const environment = {
    production: false,
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseKey: 'your-anon-key',
    apiUrl: 'http://localhost:3000/api',
};
```

This file is not committed to git.
