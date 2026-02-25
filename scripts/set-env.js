const fs = require('fs');
const path = require('path');

const envDir = path.join(__dirname, '..', 'src', 'environments');

if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const apiUrl = process.env.API_URL || '';
const wompiPublicKey = process.env.WOMPI_PUBLIC_KEY || '';

console.log('Generating environment files...');
console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('SUPABASE_KEY:', supabaseKey ? 'SET' : 'MISSING');
console.log('API_URL:', apiUrl ? 'SET' : 'MISSING');
console.log('WOMPI_PUBLIC_KEY:', wompiPublicKey ? 'SET' : 'MISSING');

const envContent = `export const environment = {
    production: false,
    supabaseUrl: '${supabaseUrl}',
    supabaseKey: '${supabaseKey}',
    apiUrl: '${apiUrl}',
    wompiPublicKey: '${wompiPublicKey}',
};
`;

const envProdContent = `export const environment = {
    production: true,
    supabaseUrl: '${supabaseUrl}',
    supabaseKey: '${supabaseKey}',
    apiUrl: '${apiUrl}',
    wompiPublicKey: '${wompiPublicKey}',
};
`;

fs.writeFileSync(path.join(envDir, 'environment.ts'), envContent);
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), envProdContent);

console.log('Environment files generated successfully');
