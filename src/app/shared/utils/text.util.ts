/**
 * Normaliza texto para búsquedas tolerantes: minúsculas, sin tildes/diacríticos
 * (é → e, ñ → n) y con la puntuación (¿?¡!.,;:) tratada como espacio. Así el
 * usuario puede omitir acentos y signos y aun así encontrar coincidencias.
 *
 * El guion NO se trata como puntuación: sobrevive a la normalización, de modo
 * que "Credit-ia" indexa como "credit-ia" y no como "creditia".
 *
 * @example
 * normalizeText('¿Qué es Credit-ia?') // 'que es credit-ia'
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
