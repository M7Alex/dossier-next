import fs from 'fs';
import fetch from 'node-fetch';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function main() {
  const res = await fetch(`${url}/get/dossier_content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const content = data.result || {};
  fs.writeFileSync('dossier.json', JSON.stringify(content, null, 2));
  console.log('✅ dossier.json créé avec succès !');
}

main();
