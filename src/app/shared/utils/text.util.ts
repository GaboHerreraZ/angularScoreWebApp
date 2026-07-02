/**
 * Normaliza texto para búsquedas tolerantes: minúsculas, sin tildes/diacríticos
 * (é → e, ñ → n) y con la puntuación (¿?¡!.,;:) tratada como espacio. Así el
 * usuario puede omitir acentos y signos y aun así encontrar coincidencias.
 *
 * @example
 * normalizeText('¿Qué es Creditia?') // 'que es creditia'
 */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')   // quita marcas de acento (é → e, ñ → n)
        .replace(/[¿?¡!.,;:]/g, ' ')      // trata la puntuación como espacio
        .replace(/\s+/g, ' ')
        .trim();
}
