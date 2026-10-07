# VOLTÉO 4.8.0 — connecté à Supabase

Les comptes, dossiers acheteurs, simulations, favoris, demandes, offres et espaces professionnels utilisent désormais le projet Supabase configuré. Les recherches locales passent par une Edge Function Supabase. La refonte UI/UX 4.5 et la vidéo complète sont conservées.

Version 4.8 : navigation latérale persistante et contenu central avec défilement indépendant. Voir **VALIDATION-V4.8.md**.

Données 4.7 : base nationale IRVE et flux dynamique raccordés, actualisation automatique des carburants et offres affichées, page Sources et fraîcheur. Les prix véhicules et les guides restent de démonstration : aucun flux constructeur ou stock concessionnaire n’est raccordé. Voir **VALIDATION-V4.7.md**.

## Essayer le site

Sur Windows, lancer **START-WINDOWS.bat**. Sur macOS/Linux : `sh START-MAC-LINUX.sh`. Ouvrir **http://localhost:8080**. Python 3.11+ suffit pour servir la version compilée fournie ; une connexion Internet est nécessaire pour Supabase. Les données enregistrées sont distantes, même si le site est ouvert sur localhost.

Le projet Supabase est raccordé et ses migrations sont appliquées. L’interface n’est pas encore publiée sur un domaine. Les URL de retour Auth et l’expéditeur email doivent être configurés avant les inscriptions publiques : lire **SUPABASE.md**.

## Sources

Avec Node.js 20.19+ ou 22.12+ :

```bash
npm ci
npm run dev
```

Ouvrir http://localhost:5173. L’interface appelle Supabase directement ; aucun serveur API Python n’est nécessaire en développement. `npm run build` produit les fichiers à héberger dans `dist/`.

```bash
npm test
```

Cette commande vérifie les moteurs JavaScript et applique toutes les migrations à un PostgreSQL isolé (PGlite), puis teste les parcours et les droits d’accès. Les anciens tests SQLite se lancent séparément avec `npm run test:legacy` ; ils ne valident pas l’authentification Supabase.

## À lire

- **SUPABASE.md** : architecture, premier administrateur, domaine et emails.
- **SECURITE-SUPABASE.md** : protections effectives et réglages restants.
- **VALIDATION-V4.6.md** : tests et limites de la livraison.
- **PILOTE-LES-ULIS.md** : parcours pilote local.
- **UI-UX-V4.5.md** : interface conservée dans cette version.

Les documents marqués archive décrivent les anciennes versions. Les photos et la vidéo restent dans les fichiers statiques du site ; aucune clé serveur n’est incluse dans le ZIP. Le catalogue conserve des prix et caractéristiques de démonstration, séparés des offres datées des partenaires validés.
