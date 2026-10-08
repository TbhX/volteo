# Déployer VOLTÉO sur GitHub et Cloudflare Pages

## 1. Préparer le dépôt GitHub

Dans le dossier `VOLTEO-V4` :

```bash
git init
git add .
git commit -m "VOLTÉO 4.9.0 ready for Cloudflare Pages"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/volteo.git
git push -u origin main
```

Créer auparavant un dépôt vide nommé `volteo` sur GitHub. Ne pas ajouter de README ou de licence depuis GitHub afin d’éviter un conflit au premier push.

## 2. Connecter Cloudflare Pages

Dans Cloudflare : **Workers & Pages → Create application → Pages → Connect to Git → GitHub**.

Paramètres du projet :

| Paramètre | Valeur |
|---|---|
| Framework preset | Vite |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | `20` ou plus récent |
|

Le build génère un HTML par route connue, les pages SEO, le sitemap et une page 404. Lire **DASHBOARDS-SEO-SEA.md** pour les variables de domaine et de mesure.

## 3. Variables Cloudflare

La configuration publique Supabase est déjà intégrée dans `src/supabase-config.json`. Elle ne contient pas de clé secrète.

Ne jamais publier :

- une clé `service_role` Supabase ;
- un mot de passe administrateur ;
- un fichier `.env` réel ;
- une clé privée de paiement ou de concessionnaire.

Les secrets serveur doivent rester dans Supabase Edge Functions ou dans les variables secrètes Cloudflare Workers, jamais dans le bundle Vite.

## 4. Domaine personnalisé

Dans Cloudflare Pages : **Custom domains → Set up a custom domain**. Si le domaine est acheté chez Cloudflare, le DNS est automatique. Sinon, ajouter l’enregistrement demandé par Cloudflare.

## 5. Vérification après publication

```bash
npm run build
```

Tester ensuite :

- l’accueil et chaque route en navigation directe ;
- la connexion acheteur et professionnel ;
- le simulateur et la conservation des données ;
- la carte bornes/concessions ;
- le formulaire de contact ;
- l’affichage desktop avec défilement uniquement dans le bloc de contenu ;
- l’affichage mobile.

Le catalogue véhicule contient encore des données de démonstration ; les flux temps réel déjà raccordés concernent les bornes, carburants et offres.
