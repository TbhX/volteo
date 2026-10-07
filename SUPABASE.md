# VOLTÉO 4.6 — raccordement Supabase

## Projet connecté

Projet : `gmwcnafoowmeqryqpcpn` (Europe / Irlande). La configuration publique du navigateur se trouve dans `src/supabase-config.json`. Elle contient uniquement l’URL et une clé **publishable**, prévue pour être publique. Aucune clé `service_role`, aucun secret serveur et aucun mot de passe de base ne doivent être ajoutés au navigateur ou au ZIP.

Les migrations SQL présentes dans `supabase/migrations/` sont appliquées à ce projet. La fonction `volteo-services` est déployée. Les fichiers servent également de sources pour réinstaller l’application sur un autre projet ; ne pas réappliquer les migrations manuellement sur le projet déjà configuré.

## Données et opérations

| Élément | Service |
|---|---|
| Inscription, connexion, confirmation d’email, mot de passe | Supabase Auth |
| Catalogue, références de concessions et guides | PostgreSQL Supabase |
| Diagnostic, dossier, passeport, favoris et simulations | PostgreSQL Supabase |
| Partenaires, offres, consentements, essais et bilans | PostgreSQL Supabase |
| Rôles et affectation des professionnels | Table privée contrôlée par l’administration |
| Recherche de communes, carburants, concessions et bornes | Edge Function `volteo-services`, puis sources publiques |
| Suppression de compte avec preuve du mot de passe | Edge Function et Supabase Auth ; suppression en cascade des données |
| Photos, vidéo et fichiers de l’interface | Fichiers statiques du site, inclus dans le ZIP |

La base locale examinée ne contenait aucun compte ni demande à reprendre. Le catalogue de démonstration a été importé ; aucun partenaire réel n’est préchargé. Les anciens mots de passe SQLite ne sont pas des comptes Supabase. Si une autre installation possède des données réelles, conserver sa sauvegarde : cette livraison ne les importe pas automatiquement.

## Premier administrateur

1. Créer son compte depuis VOLTÉO et confirmer son email.
2. Dans le SQL Editor du projet Supabase, exécuter la commande ci-dessous en remplaçant l’adresse par celle du propriétaire.

```sql
update volteo_private.users
set role = 'admin', dealer_id = null
where id = (select id from auth.users where lower(email) = lower('VOTRE-EMAIL'));
```

3. Recharger son espace. L’écran Administration permet ensuite d’attribuer les rôles et de rattacher chaque professionnel à sa concession. Ne pas attribuer un rôle depuis les métadonnées publiques d’Auth : l’application ne les utilise pas pour autoriser l’accès.

## Domaine et emails — configuration restante

Le domaine n’a pas encore été fourni et aucun hébergement public de l’interface n’a été déployé.

Dans **Supabase → Authentication → URL Configuration**, définir le `Site URL` sur l’origine HTTPS définitive et autoriser les URL suivantes :

- `https://VOTRE-DOMAINE/connexion`
- `https://VOTRE-DOMAINE/connexion?recuperation=1`
- Pour les tests locaux : `http://localhost:8080/**` et, si nécessaire, `http://localhost:5173/**`.

La confirmation d’email est activée sur le projet. Configurer un expéditeur et un SMTP adapté avant d’accueillir des inscriptions publiques : le service email de test intégré à Supabase impose des restrictions. Les fonctions d’inscription et de récupération sont intégrées, mais leur délivrabilité et le retour vers le domaine final restent à tester avec ce domaine et cet expéditeur. Les liens PKCE doivent être ouverts dans le navigateur qui a lancé la demande.

Dans **Authentication → configuration des mots de passe**, régler également le minimum serveur à 12 caractères, en cohérence avec les formulaires, et activer la protection contre les mots de passe compromis si disponible. L’advisor signale actuellement cette dernière comme désactivée. Les paramètres Auth du projet n’ont pas été modifiés par le patch.

## Héberger l’interface

`npm ci` puis `npm run build` produit `dist/`. Publier son contenu sur un hébergement statique HTTPS avec retour vers `index.html` pour les routes React telles que `/projet`, `/compte` et `/connexion`. Conserver les vrais fichiers JS, images et vidéo servis comme fichiers, sans réécriture.

Autoriser `https://gmwcnafoowmeqryqpcpn.supabase.co` dans `connect-src` de la CSP et `https://tile.openstreetmap.org` dans `img-src`. Le serveur Python fourni le fait déjà pour les essais locaux. La fonction géographique possède un CORS public car elle sert aussi les visiteurs ; toute suppression de compte vérifie le jeton, la session active et le mot de passe côté serveur.

La commande `npm run serve` et les fichiers START servent uniquement l’interface sur localhost. L’ancienne API métier SQLite répond désormais 410 ; elle ne crée pas de deuxième jeu de comptes. Le mode SQLite reste explicitement disponible pour les tests historiques, pas pour l’interface livrée.

## Maintenance

- Exporter et sauvegarder la base distante avec les outils Supabase ; vérifier les possibilités de restauration du plan choisi.
- Garder les migrations dans le suivi de versions. Les validations locales se lancent avec `npm test`.
- Le test SQL `tests/cloud-security.sql` crée des données temporaires et les annule intégralement. Ne jamais réutiliser les comptes de test comme comptes commerciaux.
- Les données géographiques restent dépendantes des services publics et d’OpenStreetMap ; aucune disponibilité en temps réel des bornes n’est inventée.
- Le schéma `volteo_private` n’est pas exposé à la Data API. Ne pas lui ajouter de droits directs ni l’exposer : les règles métier et d’isolation passent par l’API transactionnelle.
