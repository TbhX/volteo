# VOLTÉO — Tableaux de bord et acquisition

## Accès

- `/tableau-de-bord` : compte concessionnaire validé ou administrateur.
- `/admin` : vue globale, réseau, comptes à examiner et onglet SEO & SEA.
- `/admin/gestion` : outils existants de gestion des comptes, rôles, catalogue et partenaires.
- `/professionnel` : traitement des demandes ; `?lead=ID` ouvre la demande sélectionnée depuis le dashboard.
- `/stock` : édition et reconfirmation des offres.

La connexion dirige un administrateur vers `/admin` et un concessionnaire validé vers `/tableau-de-bord`. Un professionnel en attente reste sur son compte. Les données proviennent des API existantes, qui vérifient le rôle et le rattachement à la concession côté serveur. Les dashboards ne nécessitent aucune modification des comptes réels. La migration `attendance_code_zero_padding` corrige séparément les codes de présence à six chiffres : les zéros initiaux remplacent les espaces et les anciens codes concernés sont normalisés.

### Démonstration locale

Lancer `npm ci`, puis `npm run dev`, et ouvrir `http://localhost:5173/demo-pro.html`.

Identifiant : `admin`. Mot de passe : `admin`.

Cette page utilise uniquement des données fictives, permet de basculer entre pro et admin et ne crée aucune session Supabase. Elle n’est pas une authentification de production. Elle n’est ni une entrée du build, ni importée par l’application publiée ; `dist/demo-pro.html` doit rester absent. Les vrais comptes restent soumis à Supabase Auth et aux rôles serveur existants. Les actions de gestion ne sont pas simulées dans cette démo.

## Lecture des indicateurs

- Périodes glissantes de 7, 30 ou 90 jours, comparées à la période précédente de même durée.
- Demandes de démonstration exclues par défaut ; aucune croissance calculée sur une base précédente nulle.
- Statuts : répartition actuelle de la cohorte, pas un entonnoir de conversion historique.
- Relances : demandes nouvelles/contactées sans évolution depuis 48 heures, toutes dates de création confondues.
- Agenda : essais futurs planifiés ; alertes sur essais passés non confirmés.
- Offres : publiées mais expirées ou expirant sous 48 heures. Leur visibilité publique dépend aussi des règles du pilote.
- Le graphique quotidien affiche au maximum 30 jours. La période de 90 jours reste appliquée aux compteurs.
- Export CSV : indicateurs agrégés, sans coordonnées de contacts.
- Aucun chiffre d’affaires, ROAS, trafic ou résultat Google Ads n’est inventé. Les achats déclarés ne sont pas des ventes vérifiées.

## SEO

Trois pages éditoriales sont pré-rendues en HTML et immédiatement lisibles sans requête Supabase :

- `/economies-voiture-electrique` — comparaison du budget et coût total ;
- `/recharge-voiture-electrique` — préparation de la recharge ;
- `/essai-electrique-les-ulis` — préparation d’une demande d’essai locale.

Les composants React affichés sont les mêmes au build et dans le navigateur. Les pages comportent un H1, des contenus distincts, des questions/réponses, des liens internes et des appels à l’action. Aucune page par commune générée en série.

Le build produit des titres et descriptions par route, canonical sans paramètres de campagne, Open Graph, Twitter Card et JSON-LD WebSite/WebPage/BreadcrumbList. Pas de faux avis ni d’offres ou de prix non vérifiés dans les données structurées. Les fiches véhicule de démonstration et les espaces privés sont en `noindex`. `noindex` ne remplace jamais le contrôle d’accès.

`dist/sitemap.xml` liste uniquement les URL indexables. Les routes connues disposent de leur propre fichier HTML et Cloudflare Pages les sert sans extension. `404.html` fournit un vrai statut 404 pour les URL inconnues ; le catch-all `/* /index.html 200` est supprimé. Un nouveau véhicule ajouté hors du dépôt demande un rebuild pour sa route directe et ses métadonnées statiques.

### Configuration Cloudflare Pages

Build : `npm run build`. Dossier de sortie : `dist`. Node : version compatible avec `package.json`.

| Variable | Valeur attendue |
| --- | --- |
| `VITE_SITE_URL` | Domaine HTTPS canonique, sans chemin, paramètre ni identifiant ; par exemple votre domaine réel |
| `SEO_REQUIRE_ORIGIN` | `true` pour faire échouer un build public sans domaine canonique |
| `VITE_GA4_ID` | Identifiant public GA4 `G-…`, facultatif |
| `VITE_GOOGLE_ADS_ID` | Identifiant public Ads `AW-…`, facultatif |
| `VITE_GOOGLE_ADS_LEAD_LABEL` | Label de conversion « demande partenaire enregistrée », facultatif |

Sans domaine configuré, les pages restent `noindex`, robots bloque le crawl et le sitemap est vide. Configurer les variables uniquement pour le domaine de production ; garder `VITE_SITE_URL` vide dans les previews pour éviter leur indexation. Une variable Vite est publique : ne jamais y placer une clé secrète.

Après déploiement : vérifier Search Console par DNS, soumettre `/sitemap.xml`, inspecter les trois URL, vérifier leur HTML rendu, leur canonical et les redirections. Les autres parcours applicatifs restent rendus côté client. Les résultats enrichis et le positionnement ne sont pas garantis.

## SEA et consentement

L’onglet admin SEO & SEA prépare trois groupes d’intention avec mots-clés exacts/expressions, exclusions de départ, annonces et URL UTM. Les paramètres `utm_campaign` autorisés sont `budget`, `recharge`, `essai_ulis`.

Les calculs de budget/CPC/taux de demande sont des scénarios saisis par l’administrateur, pas des prévisions ni des données de compte Ads. Le patch ne crée ni campagne ni dépense publicitaire.

Deux consentements indépendants : audience (GA4), conversions publicitaires (Ads). Aucun tag externe n’est chargé avant accord pour un service configuré. Les boutons de refus et d’acceptation sont accessibles au même niveau. Le choix est conservé six mois ; « Confidentialité et cookies » permet de le modifier. Révoquer un consentement recharge la page pour arrêter les tags précédemment chargés. La personnalisation publicitaire reste refusée.

Événements secondaires : `landing_cta`, `budget_open`, `diagnostic_open`, `view_catalogue`. La conversion principale `generate_lead` est émise après un POST `/leads` réussi avec un identifiant de demande et une offre partenaire. Aucun clic n’est compté comme demande. L’identifiant de transaction évite les doublons ; les événements excluent les coordonnées, le contenu du dossier, les paramètres privés d’URL et les données de compte. Aucun événement refusé n’est rejoué rétroactivement.

Avant activation : configurer les identifiants, désactiver dans GA4 les mesures automatiques non souhaitées (formulaires/recherche/navigation historique), tester le consentement et les conversions dans Tag Assistant/DebugView, puis vérifier la réception réelle dans Ads. Les tests locaux interceptent les tags et n’envoient pas de trafic à Google. L’attribution publicitaire réelle et les retours hors ligne ne sont pas validés : ne pas activer une stratégie d’enchères fondée sur ces signaux avant cette recette.

Ciblage initial : uniquement le territoire réellement servi, avec présence géographique plutôt qu’intérêt seul ; budget plafonné choisi dans Ads. Examiner les termes de recherche, les demandes valides et les rendez-vous. Aucun élargissement automatique de zone ou budget n’est réalisé par le site.

## Vérification

```bash
npm test
npm run build
node tests/seo-build.mjs
```

Les tests couvrent les filtres, limites de période, relances, confidentialité CSV, métadonnées, origine canonique et nettoyage des événements. La recette navigateur couvre connexion de démo, vues pro/admin, filtres, rendu mobile, session simulée et déconnexion, consentement indépendant et conversions dédupliquées. Les pages statiques sont contrôlées avant livraison. Les performances réelles, la délivrabilité Auth, l’indexation et les comptes Google doivent être vérifiés sur le domaine public.

## Références techniques

- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/tag-platform/security/guides/consent
- https://developers.cloudflare.com/pages/configuration/serving-pages/


## Vérification du correctif de présence

Migration appliquée sur Supabase le 8 octobre 2026 ; version locale alignée sur la version distante `20261008164446`. Aucun code non numérique détecté après correction. Le parcours cloud teste également un code commençant par plusieurs zéros.

Le contrôle Supabase signale toujours la protection contre les mots de passe compromis désactivée dans Auth. Configuration à activer selon le forfait du projet : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Interface professionnelle et vue acheteur

Les comptes professionnels disposent d’une navigation dédiée : accueil opérationnel, demandes clients, agenda et relances, stock et offres, performance, établissement et sécurité. L’accueil concessionnaire met les actions à traiter avant les statistiques. Les données proviennent des API existantes ; aucun chiffre ou dossier fictif n’est injecté dans les comptes réels.

Le bouton « Vue acheteur » ouvre les outils publics avec un bandeau de démonstration. « Retour espace pro » retrouve la dernière rubrique professionnelle, y compris l’onglet agenda. La dernière page de chaque vue est mémorisée dans la session du navigateur, par compte. Les critères de simulation et la sélection de comparaison sont conservés lors de la bascule.

La vue acheteur permet d’explorer le diagnostic, le projet, le passeport, le comparateur et le budget. Elle ne transforme pas le compte pro en acheteur : les enregistrements de profils, favoris et demandes restent indisponibles. Les routes professionnelles conservent leurs contrôles d’accès ; la bascule ne modifie aucun rôle en base. Les comptes pros non validés restent sur leur page d’activation.

Contrôles réalisés : navigation concessionnaire, aller-retour entre les vues, restauration de l’onglet et de la sélection, rechargement, formulaire de passeport sans écriture en aperçu, absence de débordement et défilement intérieur à 1440, 1024 et 390 pixels. Tests de données et règles de navigation : `node --test tests/professional-view.test.js tests/dashboard.test.js`.

## Simulation guidée et repères énergie — 9 octobre 2026

Le simulateur commence par un choix explicite de véhicule. Sans modèle sélectionné, il invite à feuilleter le catalogue ou à préciser ses besoins dans le diagnostic. Un modèle choisi ou une simulation sauvegardée reste accessible.

Les nouvelles simulations utilisent les repères datés de `src/energy-reference.js` : Tarif Bleu EDF Base 6 kVA TTC 0,2001 €/kWh (barème août 2026) et scénario public à 0,50 €/kWh, situé dans l’intervalle Electra de 0,39 à 0,61 €/kWh via application (publication juillet 2026, exceptions autoroutières et badges). Le prix public n’est pas présenté comme une moyenne nationale. Des boutons permettent d’utiliser les heures creuses (0,1589 €) ou pleines (0,2142 €).

La part de recharge domicile est un scénario modifiable (0, 50, 80 ou 100 %), pas une moyenne observée. L’étude Avere-France/UFE citée utilise 80 % domicile ou entreprise. Les valeurs déjà saisies ne sont pas remplacées automatiquement. Les autres hypothèses préremplies ne sont pas des moyennes actuelles.

Ces références sont vérifiées manuellement, avec liens vers les sources dans le formulaire ; aucun flux tarifaire en temps réel n’est annoncé. Au-delà de 90 jours depuis la vérification, un avertissement invite à consulter les sources. Pour maintenir les données, vérifier les grilles puis mettre à jour valeurs et date dans le module. Les prix futurs ne sont pas garantis ; frais fixes de recharge et abonnement domestique restent exclus.

Le bandeau de résultat est placé hors de la zone qui défile : gain, surcoût ou coûts comparables, avec montant mensuel du coût total de possession et durée. Il reste visible sur mobile et ordinateur. Les tests contrôlent le sens de variation, l’absence de choix automatique, la conservation des saisies et la visibilité du résultat.

Accueil : nouvelle image extraite à 6,8 s du film existant `volteo-film-v4.mp4`, montrant la voiture entière. Affichage au ratio d’origine sans recadrage ; légende placée sous l’image.

L’accueil défile verticalement dans le bloc central ; seuls le diagnostic et le projet restent paginés.
