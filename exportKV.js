import fs from 'fs';
import path from 'path';

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
  console.error('⚠️ Variables d’environnement KV manquantes !');
  process.exit(1);
}

async function getKV(key) {
  const res = await fetch(`${KV_REST_API_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
  });
  const j = await res.json();
  return j.result;
}

(async () => {
  try {
    const data = await getKV('dossier_content');
    if (!data) {
      console.error('⚠️ Aucun contenu trouvé dans KV !');
      process.exit(1);
    }
    const filePath = path.join(process.cwd(), 'dossier.json');
    fs.writeFileSync(filePath, data, 'utf-8');
    console.log('✅ dossier.json créé avec succès !');
  } catch (e) {
    console.error('❌ Erreur :', e);
  }
})();
