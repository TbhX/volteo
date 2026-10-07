> Mise à jour 4.6 : les parties SQLite, sessions locales et commandes d’administration de ce document sont historiques. Pour le fonctionnement actif, lire SUPABASE.md, SECURITE-SUPABASE.md et VALIDATION-V4.6.md.

# Sécurité du prototype VOLTÉO 4.2

État au 3 octobre 2026. Renforcements et tests ciblés, pas une certification ni un audit externe. Le prototype est destiné aux démonstrations privées ; l’ouverture au public exige les étapes listées dans LANCEMENT-PUBLICITAIRE.md.

## Contrôles présents

- Mots de passe hachés PBKDF2-SHA256 avec sel individuel, 600 000 itérations. Mots de passe de 12 à 128 caractères, espaces conservés.
- Sessions aléatoires, empreintes stockées côté serveur ; cookie HttpOnly et SameSite=Lax. Secure exigé par le lanceur de prévisualisation HTTPS. Pas de jeton de session dans localStorage.
- Vérification stricte de l’origine sur les écritures et jeton CSRF pour les sessions connectées. Limites de tentatives de connexion, recherches externes et écritures de compte.
- Rôles contrôlés côté serveur. Une inscription publique ne permet pas de devenir concessionnaire ou administrateur ; les changements de rôle révoquent les sessions.
- Dossier acheteur privé. Copie partagée uniquement sur demande explicite ; consentement et date conservés avec la demande. Isolation par concession. Contrôle optimiste des mises à jour pour éviter l’écrasement d’un suivi concurrent.
- Paramètres SQL liés, validation JSON et tailles limitées. Réponses d’erreur sans trace interne. Données saisies rendues comme texte par React.
- CSP sans scripts tiers, blocage d’encadrement, nosniff, politique de référent et permissions restreintes. Les fichiers absents et chemins sensibles retournent une erreur, pas la page d’accueil.
- Export et suppression des données utilisateur avec suppression des objets liés. Sauvegarde SQLite cohérente avec vérification d’intégrité.
- Aucun pixel publicitaire ni tag de conversion. Indexation désactivée pour ce prototype ; ce réglage n’est pas un contrôle d’accès.

## Deux modes d’exécution

**Local :** les fichiers START utilisent http.server uniquement sur 127.0.0.1 pour les démonstrations sur votre machine. Ne pas exposer ce serveur directement à Internet ni créer un tunnel public vers lui.

**Démonstration hébergée privée :** transport WSGI avec Waitress derrière Caddy HTTPS et un accès par mot de passe supplémentaire. Exemples dans deploy/. Ils ne constituent pas un déploiement déjà effectué.

Sur un serveur administré : créer un compte système non privilégié ; installer le projet hors de tout répertoire public ; créer un environnement virtuel et installer requirements.txt. Mettre la base dans un répertoire privé accessible uniquement à ce compte. Seuls les ports HTTP/HTTPS de Caddy doivent être exposés ; Waitress écoute sur 127.0.0.1. Le proxy de confiance est exclusivement 127.0.0.1, pas `*`.

Adapter `deploy/preview.env.example` et `deploy/Caddyfile.example`. Renseigner le domaine réel et un hash généré avec `caddy hash-password`. Protéger le fichier d’environnement. Charger ses variables dans le service, puis lancer `python server/wsgi.py` avec l’environnement virtuel. Le lanceur refuse un mode absent, une origine non HTTPS, des cookies non Secure ou une base située dans dist. Caddy exige son propre contrôle d’accès pour toute la démonstration.

Avant de partager l’URL : vérifier HTTPS, protection par mot de passe sur `/` et `/api/health`, impossibilité d’atteindre 8080 depuis l’extérieur, attribut Secure du cookie, sauvegarde et restauration. Utiliser des comptes de test, révoquer les accès après présentation. Cette configuration externe n’a pas pu être validée sans serveur ni domaine.

## Sauvegarde et récupération

Depuis le dossier du projet, avec le même VOLTEO_DB que le serveur :

```bash
python3 server/manage.py --backup /chemin/prive/volteo-sauvegarde.sqlite3
```

Le fichier de destination doit être nouveau et hors de dist. Le helper utilise l’API de sauvegarde SQLite et contrôle l’intégrité, y compris lorsque la base utilise WAL. Conserver les sauvegardes chiffrées et à accès restreint ; fixer une durée de conservation. La suppression du compte agit sur la base active, pas sur des sauvegardes anciennes.

Pour restaurer : arrêter le service, conserver le dossier de données actuel à part, placer la sauvegarde dans un nouveau dossier privé sans anciens fichiers WAL/SHM, pointer VOLTEO_DB vers cette copie et relancer. Vérifier les comptes et demandes sur un environnement isolé avant reprise. Une restauration peut réintroduire des données supprimées depuis la sauvegarde : appliquer ces suppressions avant réouverture.

Récupération locale par le propriétaire uniquement :

```bash
python3 server/manage.py --reset-password adresse@example.test
```

La saisie est masquée et les sessions du compte sont révoquées. Ce mécanisme n’est pas une récupération par email destinée au public. Vérifier l’identité du demandeur avant toute intervention réelle.

## Vérification et limites

26 tests automatiques : 8 JavaScript et 18 Python. Contrôles spécifiques : accès inter-comptes, partage et copie figée du dossier, consentement, suppression en cascade, créneau futur, conflit de mise à jour, en-têtes, fichiers sensibles, origine/CSRF, WSGI et configuration HTTPS. Parcours navigateur acheteur → concession → acheteur vérifié. Serveur Waitress réel, cookie Secure et sauvegarde/restauration contrôlés localement. Audit npm des dépendances de production : aucune vulnérabilité connue signalée à cette date.

Restent à valider avant exploitation publique : configuration externe du domaine/proxy/pare-feu, supervision et alertes, contrôle de charge, récupération et vérification email, MFA pour les comptes sensibles, rétention des données, politique juridique, dépendances au moment du déploiement et revue indépendante ciblée. Pas de test d’intrusion externe effectué. Aucune garantie d’invulnérabilité.

## Références vérifiées

- Python déconseille http.server en production : https://docs.python.org/3/library/http.server.html
- Configuration et limites Waitress : https://docs.pylonsproject.org/projects/waitress/en/latest/arguments.html
- Authentification Caddy : https://caddyserver.com/docs/caddyfile/directives/basic_auth
- En-têtes de sécurité OWASP : https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html


## V4.4 — données du pilote et isolation

- Tables SQLite ajoutées : paramètres du pilote, partenaires, offres et inscriptions. Champs d’essai, bilan et présence ajoutés aux détails des demandes. Migration additive et compatible avec une base V4.3.
- La géographie des inscriptions est calculée par le serveur à partir des communes officielles, pas à partir de coordonnées prétendues par le client.
- Seul un administrateur valide un partenaire ou change le périmètre. Notes de vérification internes exclues du registre public.
- Un concessionnaire n’accède qu’à ses offres et demandes. Le rôle professionnel en attente ne suffit pas. La validité de l’offre est vérifiée côté serveur au partage.
- Les bilans privés ne figurent ni dans les réponses aux professionnels/administrateurs, ni dans leurs statistiques. Le partage est explicite et peut être retiré.
- Le code de présence est communiqué uniquement à l’acheteur pendant la fenêtre du rendez-vous. Le professionnel saisit le code présenté, avec limitation de tentatives. Aucun paiement, preuve de géolocalisation ou garantie antifraude.
- Les nouveaux enregistrements personnels figurent dans l’export et suivent la suppression du compte. Les données de partenaires/offres appartiennent à l’établissement et sont administrées séparément.
- Les notes libres ne doivent contenir aucun secret ou donnée sensible. Les sources externes de cartes reçoivent les données de consultation décrites dans la notice.
- Pas de pixel Meta/Google, aucun traceur marketing ajouté. L’origine déclarée à l’inscription est une réponse de formulaire.
- Cette version a fait l’objet de tests fonctionnels et de contrôle d’accès ; aucune certification ou audit externe de sécurité n’est revendiqué.
