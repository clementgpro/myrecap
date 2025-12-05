# 📂 Dossier Public - Site Web

Ce dossier contient tous les fichiers du site web qui seront servis par GitHub Pages.

## 📄 Fichiers

- **index.html** - Page principale du site
- **style.css** - Tous les styles CSS
- **script.js** - Logique JavaScript (mot de passe + animations)
- **recap.json** - **À PERSONNALISER** : vos images/vidéos et textes
- **recap.example.json** - Exemple de référence
- **INSTRUCTIONS.html** - Guide visuel (ouvrir dans un navigateur)

## 🚀 Pour commencer

1. **Ouvrez INSTRUCTIONS.html** dans votre navigateur pour un guide complet
2. **Personnalisez recap.json** avec vos URLs Google Drive
3. **Testez en local** avec un serveur (voir ci-dessous)

## 💻 Tester en local

### Option 1 : Python (recommandé)
```bash
cd public
python -m http.server 8000
```

### Option 2 : Node.js
```bash
cd public
npx serve
```

### Option 3 : Direct
Double-cliquez sur `index.html` (peut avoir des problèmes CORS)

Puis ouvrez : **http://localhost:8000**

## 🔑 Mot de passe par défaut

**moncadeau**

Pour changer : modifiez `script.js` ligne 13

## 📝 Format recap.json

```json
[
  {
    "type": "image",
    "src": "https://drive.google.com/uc?export=view&id=VOTRE_FILE_ID",
    "text": "Votre texte ici"
  },
  {
    "type": "video",
    "src": "https://drive.google.com/uc?export=download&id=VOTRE_FILE_ID",
    "text": "Description vidéo"
  }
]
```

## 📚 Documentation complète

Consultez le fichier **README.md** à la racine du projet pour la documentation complète.

