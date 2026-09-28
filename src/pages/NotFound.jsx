// src/pages/NotFound.jsx — page « introuvable » du site public.
//
// Le serveur renvoie index.html pour tout chemin (vercel.json), on ne peut
// donc pas répondre 404 : main.jsx pose `noindex`, retire le canonical et
// monte cette page pour tout chemin qui n'est ni l'accueil, ni une peau, ni
// une page connue. Palette officielle, aucune dépendance.

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '40px 16px', textAlign: 'center', background: '#F5F5F1', color: '#0D3B36', fontFamily: 'Montserrat, system-ui, sans-serif' }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#35705F' }}>Erreur 404</p>
      <h1 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800 }}>Page introuvable</h1>
      <p style={{ margin: 0, maxWidth: '48ch', color: '#5d6a62' }}>Cette adresse ne mène nulle part. Le menu, la livraison et la commande sont sur la page d'accueil.</p>
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 28px', borderRadius: 999, background: '#B7D94C', color: '#0D3B36', fontWeight: 700, fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase', textDecoration: 'none' }}>Retour à l'accueil</a>
    </main>
  );
}
