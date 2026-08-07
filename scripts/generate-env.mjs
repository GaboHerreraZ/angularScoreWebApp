// Genera src/environments/*.ts en CI (Cloudflare) a partir de variables de entorno.
// Localmente los archivos ya existen (gitignoreados) y no se tocan.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envDir = resolve(root, 'src/environments');

const targets = [
    { file: 'environment.ts', production: false },
    { file: 'environment.prod.ts', production: true },
];

const missing = targets.filter((t) => !existsSync(resolve(envDir, t.file)));
if (missing.length === 0) {
    console.log('[generate-env] environment files already exist, skipping.');
    process.exit(0);
}

const { SUPABASE_URL, SUPABASE_KEY, API_URL, EPAYCO_TEST } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY || !API_URL) {
    console.error('[generate-env] Missing env vars. Required: SUPABASE_URL, SUPABASE_KEY, API_URL');
    process.exit(1);
}

// Modo pruebas de ePayco: por defecto activo, solo el literal "false" lo apaga.
// Así un ambiente al que se le olvidó la variable nunca cobra de verdad.
const epaycoTest = EPAYCO_TEST !== 'false';
console.log(
    epaycoTest
        ? '[generate-env] EPAYCO_TEST=true -> checkout en modo PRUEBAS (no cobra)'
        : '[generate-env] EPAYCO_TEST=false -> checkout en modo PRODUCCION (cobra de verdad)'
);

mkdirSync(envDir, { recursive: true });
for (const t of missing) {
    const content = `export const environment = {
    production: ${t.production},
    supabaseUrl: '${SUPABASE_URL}',
    supabaseKey: '${SUPABASE_KEY}',
    apiUrl: '${API_URL}',
    epaycoTest: ${epaycoTest},
};
`;
    writeFileSync(resolve(envDir, t.file), content);
    console.log(`[generate-env] wrote src/environments/${t.file}`);
}
