// ─── Palette des graphes Analyses ───────────────────────────
// Chaque segment est un dégradé à deux arrêts, pas un aplat : c'est ce qui
// donne aux donuts leur relief « Harvey ball » sans ombre portée.
//
// Les quatre premières entrées sont les accents de la charte admin définis
// dans index.css (lime, orange, vert, bleu) — le violet et le rose complètent
// la roue pour tenir six catégories sans deux voisins confondables. L'ordre
// est choisi pour que deux segments adjacents ne partagent jamais leur teinte.
export const SEGMENT_COLORS = [
  { from: '#d4ff6b', to: '#8fbf2e' }, // Citron Tahiti — accent de marque
  { from: '#c084fc', to: '#7c3aed' }, // Violet
  { from: '#ff9a4d', to: '#e05f10' }, // Orange
  { from: '#5be39b', to: '#0f9f6e' }, // Vert
  { from: '#7dcfff', to: '#2b7fd4' }, // Bleu
  { from: '#f472b6', to: '#be185d' }, // Rose
  { from: '#fde68a', to: '#d99a1a' }, // Sable
  { from: '#67e8f9', to: '#0e8fa8' }, // Cyan
  { from: '#a5b4fc', to: '#4f46e5' }, // Indigo
  { from: '#fca5a5', to: '#c53030' }, // Corail
];

// Gris neutre réservé au segment « Autres » : un fourre-tout ne doit pas
// attirer l'œil autant qu'une vraie catégorie.
export const MUTED_COLOR = { from: 'rgba(245,240,232,0.34)', to: 'rgba(245,240,232,0.16)' };

export const colorAt = (index, key) =>
  key === '__autres__' || key === 'autres' || key === 'hors'
    ? MUTED_COLOR
    : SEGMENT_COLORS[index % SEGMENT_COLORS.length];
