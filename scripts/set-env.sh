#!/bin/bash

# Generate environment files for Vercel build
# Uses Vercel environment variables to create Angular environment files

ENV_DIR="src/environments"

mkdir -p "$ENV_DIR"

# Generate environment.ts (required for build even in production)
cat > "$ENV_DIR/environment.ts" <<EOF
export const environment = {
    production: false,
    supabaseUrl: '${SUPABASE_URL}',
    supabaseKey: '${SUPABASE_KEY}',
    apiUrl: '${API_URL}',
    wompiPublicKey: '${WOMPI_PUBLIC_KEY}',
};
EOF

# Generate environment.prod.ts
cat > "$ENV_DIR/environment.prod.ts" <<EOF
export const environment = {
    production: true,
    supabaseUrl: '${SUPABASE_URL}',
    supabaseKey: '${SUPABASE_KEY}',
    apiUrl: '${API_URL}',
    wompiPublicKey: '${WOMPI_PUBLIC_KEY}',
};
EOF

echo "Environment files generated successfully"
