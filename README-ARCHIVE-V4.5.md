> Archive historique : pour la version active, lire README.md et SUPABASE.md.

# VOLTÉO V4.5 — interface responsive / pilote Les Ulis

La version 4.5 harmonise les écrans acheteurs, professionnels et administrateur : navigation mobile, menu accessible au clavier, formulaires associés à leurs libellés, simulateur par sections, recherche des demandes et thèmes clair/sombre. Voir **UI-UX-V4.5.md** pour les changements et les contrôles effectués. La version compilée est incluse.

Lire d’abord **PILOTE-LES-ULIS.md** pour la nouvelle version locale, puis **KIT-DEMONSTRATION.md** pour présenter le parcours, **SECURITE.md** pour les protections et l’hébergement privé, **LANCEMENT-PUBLICITAIRE.md** pour les conditions de passage au public.

Application React/Vite et serveur Python/SQLite. Cette livraison a été reconstruite à partir de `volteo.html` dans le ZIP fourni : les sources React V3 n’étaient pas dans l’archive. Les jeux historiques de véhicules, concessions et articles restent des données de démonstration. Les nouveaux partenaires et leurs offres locales disposent d’un circuit de validation séparé ; aucune offre partenaire réelle n’est préchargée.

## Démarrage immédiat (version compilée incluse)

Installez Python 3.11+ si nécessaire. Sur Windows, double-cliquez sur `START-WINDOWS.bat`. Sur macOS/Linux, lancez `sh START-MAC-LINUX.sh`. Puis ouvrez **http://localhost:8080** et gardez le terminal ouvert. Aucun compte externe, npm ou Node.js n’est nécessaire pour essayer la version compilée fournie.

## Installation des sources et développement

Prérequis : Node.js 20.19+ ou 22.12+, npm et Python 3.11+. Aucune dépendance Python à installer.

Dans le dossier du projet :

```bash
npm ci
npm run build
npm run serve
```

Ouvrir **http://localhost:8080**. Le même serveur sert React et l’API, et crée automatiquement `server/volteo.sqlite3`. Ce fichier contient vos données : sauvegardez-le et ne le publiez pas dans Git. Utiliser l’adresse `localhost` telle qu’indiquée : la vérification d’origine refuse les adresses différentes.

Pour développer, dans deux terminaux :

```bash
npm run api
```

```bash
npm run dev
```

Ouvrir **http://localhost:5173**. Vite transmet `/api` au serveur Python. La configuration `.env.example` documente les variables ; elle n’est pas chargée automatiquement, les variables serveur doivent être exportées dans le terminal.

## Essayer le parcours complet

1. Créer un compte (mot de passe de 12 à 128 caractères).
2. Remplir le diagnostic : profil sauvegardé côté serveur.
3. Ouvrir un véhicule ; ajouter un favori et une comparaison.
4. Ouvrir le simulateur, ajuster les hypothèses et sauvegarder.
5. Depuis la fiche véhicule, choisir une concession compatible et enregistrer une demande d’essai avec consentement.
6. Consulter favoris, simulations et demandes dans « Mon espace ».
7. Se déconnecter puis se reconnecter : les données restent en base.

## Activer les espaces professionnels

Créez un compte normal depuis le site, puis, sur la machine qui héberge le serveur :

```bash
python3 server/app.py --promote-admin votre-email@example.com
```

Reconnectez ce compte. Dans Administration, attribuez le rôle `dealer` à un autre compte inscrit et sélectionnez sa concession. Les sessions de ce compte sont révoquées : il doit se reconnecter. Ce professionnel voit uniquement les demandes de sa concession. L’administrateur voit l’ensemble des demandes. Une inscription publique ne peut jamais attribuer un rôle professionnel ou administrateur.

Le professionnel peut faire évoluer les statuts : Nouveau, Contacté, Essai planifié, Terminé, Fermé. L’historique est conservé et une modification concurrente est rejetée. Les demandes apparaissent dans le portail ; aucun email/SMS n’est envoyé.

## Ce qui fonctionne réellement

- React, composants, React Router, états de chargement et erreurs, page 404.
- Catalogue, recherche, budget, catégories, fiches, comparaison jusqu’à trois véhicules.
- Diagnostic sauvegardé ; recommandations expliquées avec filtres stricts budget/places/format.
- TCO : décote, énergie, pertes de recharge, entretien, assurance, installation, intérêts du crédit ; projection 1/3/5/8 ans.
- Profils, favoris, simulations et demandes en SQLite via API HTTP.
- Inscription, connexion, déconnexion, changement de mot de passe.
- Sessions en cookie HttpOnly/SameSite, jeton de session haché en base, expiration sept jours.
- Mots de passe hachés PBKDF2-SHA256 (600 000 itérations, sel aléatoire).
- Origine autorisée et jeton CSRF sur les écritures ; validation serveur, limites de taille et de fréquence.
- Permissions vérifiées au serveur ; affectation concessionnaire par administrateur.
- Mise à jour des données chiffrées et référence de source des véhicules depuis l’admin, sans modifier le code.
- Export de données et suppression de compte avec suppression en cascade.
- Aucune clé secrète dans React ; pas de publicité ni analytics.

La comparaison seule est conservée dans `localStorage` ; l’authentification et les données personnelles sont côté serveur.

## Hypothèses du moteur de recommandation

Budget, places et format sont des filtres stricts. Autonomie cible : maximum de deux fois le trajet quotidien et 250 km (400 km pour l’autoroute). Score : 55 % autonomie, 25 % recharge DC, 20 % marge de budget. Cet indice n’est pas une probabilité de satisfaction et dépend des informations non vérifiées du catalogue.

## Hypothèses économiques

Le TCO compare la conservation d’un thermique déjà détenu à l’achat d’un électrique : valeur de départ moins revente, frais annuels, installation, intérêts du crédit au prorata de la période retenue. Le capital emprunté n’est pas recompté en plus de la décote. Les mensualités sont hors frais et assurance du crédit. Les intérêts sont répartis de façon simplifiée, pas suivant un échéancier de remboursement détaillé.

Les prix d’énergie, reventes, assurances et entretiens sont des hypothèses éditables. Pertes de recharge : 10 %. Le tableau 1/3/5/8 ans utilise des reventes calculées séparément avec une décote annuelle de 12 % thermique et 15 % électrique. Pas d’aides, fiscalité, inflation, stationnement ou péages. Cette estimation n’est pas une offre de crédit ni une garantie d’économie.

## Vérifications

```bash
npm test
npm run build
```

Les tests couvrent les filtres de recommandation, l’absence de double comptage du financement, le mix de recharge, la séparation des données, les rôles, les accès concessionnaires, le CSRF, la validation des leads, leur historique, les conflits de modification, la persistance, l’export/suppression, les mots de passe et la limitation des tentatives.

## Structure

- `src/main.jsx` : parcours et composants React.
- `src/api.js` : client HTTP, erreurs et CSRF.
- `src/engine.js` : matching et calcul de coût.
- `src/style.css` : interface responsive, illustrations SVG génériques.
- `server/app.py` : API, stockage et autorisations.
- `server/*.json` : données initiales du prototype ; les modifications admin sont sauvegardées en base.
- `tests/` : tests métier et API.
- `dist/` : version compilée fournie ; régénérable avec `npm run build`.

## Limites avant une exploitation publique

Cette V4 est une application full stack locale, **pas une plateforme Supabase déployée**. La couche API isole l’interface du stockage pour une future migration, mais aucun adaptateur Supabase ou schéma RLS n’est livré. Pour utiliser Supabase, il faut un projet, migrer la persistance et les sessions vers PostgreSQL/Auth et vérifier les policies.

Restent à brancher ou finaliser :

- Données constructeur vérifiées, versions exactes, photos sous licence, dates et sources.
- Flux géographique de bornes, tarifs et éventuelle disponibilité en temps réel. La page recharge propose une estimation et un lien vers une carte externe, sans simuler de disponibilités.
- Service email : confirmation, récupération de mot de passe, notifications des demandes ; OAuth si souhaité.
- Hébergement HTTPS, configuration d’origine publique, cookies Secure, supervision, sauvegardes et serveur adapté à la production. `http.server` est ici destiné à un lancement local, pas à une exposition publique directe.
- Politique juridique adaptée à l’exploitant, durées de conservation et process de traitement des droits.
- SEO complet (rendu/prérendu, sitemap, données structurées), analytics avec choix de consentement, stock réel des concessions, créneaux d’essai, partenariats et facturation.
- Gestion éditoriale des articles, création/suppression de modèles ou concessions depuis l’admin ; le présent admin permet l’édition des chiffres du catalogue et des permissions.

Aucun contact de démonstration ne reçoit de message. Les données de test, comptes et bases SQLite ne sont pas inclus dans la livraison.

## Nouveautés de cette version

- Interface sombre électrique, thème clair, transitions, menu mobile, états de chargement et cache public de 60 secondes. Les comptes ne sont jamais mis en cache.
- Photos réelles pour les 37 modèles, en WebP avec variantes légères. Sources Wikimedia Commons, auteurs, licences et transformations dans `/credits-photos`. Les finitions visibles peuvent différer du véhicule décrit.
- Vidéo fournie et approuvée par l’utilisateur, Full HD 1920×1080, 30 images/s, 12,6 secondes. MP4 local avec démarrage silencieux et bouton son, première arrivée sur l’accueil par session, aucune boucle, bouton passer/Escape et possibilité de revoir. Composition intégrale conservée sur mobile, signature incluse dans le film, aucun ancien texte superposé. Désactivée au premier affichage si réduction des animations demandée. `creative/` conserve les sources de l’ancien film conceptuel à titre d’archive.
- Page « Autour de moi » : géolocalisation sur action explicite, code postal français et choix de commune, carte Leaflet/OpenStreetMap, rayons 5/10/25/50 km, concessions par marque et carburants par type.
- Prix déclarés issus du flux officiel du ministère de l’Économie ; date du relevé visible, avertissement après sept jours. Un prix choisi devient une hypothèse modifiable du simulateur et sa provenance est sauvegardée.
- Concessions issues des données OpenStreetMap : disponibilité électrique et essais à confirmer. Les recommandations proches figurent aussi sur la fiche modèle après une recherche locale. Les distances sont à vol d’oiseau ; les itinéraires routiers s’ouvrent dans Google Maps.

Internet est nécessaire pour les communes, stations, concessions et tuiles de carte. La disponibilité des API publiques et leur couverture peuvent varier ; les erreurs sont affichées sans résultats fictifs. Au plus 100 établissements/stations par recherche. La géolocalisation nécessite localhost ou HTTPS. La position n’est pas enregistrée dans SQLite ; le prix choisi peut être sauvegardé avec la simulation.

Les photographies sont authentiques, mais prix d’achat et caractéristiques du catalogue restent des données de démonstration à vérifier. Le formulaire d’essai conserve ses concessions fictives et n’envoie aucune demande aux établissements réels. Les skills Supabase ont été installés dans l’environnement de travail ; aucun projet Supabase n’est connecté et le serveur conserve SQLite.

## Prochaine étape acheteurs et concessions

Voir `PROCHAINE-ETAPE.md` : proposition de parcours pour les deux publics, pilote partenaires, stocks vérifiés et confirmation des essais. Cette feuille de route distingue les fonctionnalités existantes des évolutions à construire.

## Parcours acheteurs et professionnels — V4.1.1

Accueil avec deux entrées, visuel issu du film accepté, page publique `/partenaires` et accès à l’espace professionnel protégé. Aucun réseau partenaire ou stock réel n’est annoncé. Interface React/Vite existante conservée, sans nouvelle dépendance d’animation. Astra demandé n’a pas pu intervenir (quota) ; modifications réalisées par l’assistant principal.

## Correctif vidéo V4.1.2

La copie MP4 intégrée en V4.1.1 était tronquée et provoquait une erreur de décodage vers 7,4 secondes. Elle est remplacée par une copie complète de la vidéo originale, sous une nouvelle URL pour éviter le cache. Durée de lecture réellement observée : 12,631655 secondes. En cas de blocage de lecture, l’intro propose de reprendre au lieu de se fermer.

## V4.3 — inscription et parcours cohérents

- Choix acheteur / professionnel dès l’inscription. Confirmation du mot de passe, affichage/masquage, téléphone et code postal ; établissement et SIREN/SIRET pour le professionnel.
- Un professionnel inscrit reste sans privilège concessionnaire jusqu’à validation administrative et rattachement manuel à une concession. Les informations déclarées ne sont pas vérifiées automatiquement auprès d’un registre.
- Navigation, accueil et compte adaptés au type d’utilisateur. Les outils publics restent consultables par les professionnels, mais les demandes d’essai et le dossier personnel sont réservés au parcours acheteur.
- Un contexte partagé relie dossier, diagnostic, catalogue, recharge et calcul courant. Les simulations déjà enregistrées restent des instantanés indépendants et sont présentées comme telles.
- Brouillons conservés dans sessionStorage pour cet onglet, séparés par compte et effacés à la déconnexion. Inscription : coordonnées conservées, mots de passe et cases d’autorisation exclus. Les données explicitement enregistrées restent dans SQLite.
- Barre de localisation accessible partout. Le choix d’une commune suit la navigation ; les coordonnées GPS précises ne sont pas persistées. Changer de zone invalide les résultats et l’ancien prix local. Les tarifs électriques restent des hypothèses saisies, pas un tarif automatiquement déduit du lieu.
- La carte publique reprend le rayon dans la limite de 50 km ; le dossier peut prévoir jusqu’à 200 km. Le catalogue reste national : aucune disponibilité locale fictive n’est affichée.
- Si le dossier a été modifié sans sauvegarde, la demande d’essai invite à enregistrer ces changements avant de joindre une copie.

Une base existante est migrée automatiquement au démarrage ; sauvegardez-la avant remplacement. Les anciens comptes conservent leurs permissions. Aucune publication en ligne effectuée.

## Nouveautés V4.4

Page `/pilote` centrée sur Les Ulis (20 km réglables), `/passeport`, nouveau plan de recharge, `/offres-locales`, `/stock`, confirmation de présence, bilans privés ou partagés et statistiques professionnelles. Lire `PILOTE-LES-ULIS.md` pour les parcours, limites des données et préparation du lancement local. La base existante est migrée de manière additive au démarrage. Sauvegarder avant de remplacer une installation utilisée. Aucune base de données ou session de test n’est incluse dans le ZIP.
