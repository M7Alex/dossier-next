# Dossier RP Pro — Template Next.js

## 🚀 Déploiement en 5 minutes

### 1. Fork & Configure
```bash
git clone https://github.com/M7Alex/dossier-rp
cd dossier-rp
```

Modifie **un seul fichier** : `src/lib/config.ts`
- Ton nom, poste, département
- Tes codes d'accès visiteur/admin
- Tout le contenu des slides

### 2. Ajoute ta voix
Remplace le fichier audio dans `src/lib/audio.ts` (variable `VOICE_B64`)
- Génère via [ElevenLabs](https://elevenlabs.io) → export MP3
- Convertis en base64 : `base64 -i voice.mp3 | tr -d '\n'`

### 3. Variables d'environnement Vercel
```
ANTHROPIC_API_KEY=sk-ant-...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

### 4. Deploy
```bash
vercel deploy --prod
```

## ✨ Features
- 🔐 Double accès : Visiteur (lecture) / Admin (édition)
- 💾 Sauvegarde temps réel via Vercel KV
- 🤖 Assistant IA intégré (Claude)
- 📊 Tableau de bord de consultations
- 🎭 Chibis holographiques par slide
- 🔗 Lien de partage avec contenu compressé
- 🖱️ Curseur crosshair personnalisé
- 🎬 Transitions Framer Motion
- 📄 Export PDF
- ➕ Ajout/suppression de pages dynamiques
