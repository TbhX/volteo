# VOLTÉO 4.7 — sources et actualisation

Livraison du 7 octobre 2026. La marque et le film complet sont conservés.

## Ce qui fonctionne

- Carburants : flux officiel déjà raccordé, désormais actualisé toutes les 10 minutes sur la carte visible. La date de consultation du cache reste sa véritable date de collecte. Les relevés de plus de 7 jours restent signalés et ne peuvent plus être importés dans le simulateur.
- Recharge : OpenStreetMap est remplacé par la base nationale IRVE statique du Point d’Accès National, interrogée par l’API tabulaire officielle. Les statuts proviennent directement du CSV national dynamique, avec rapprochement par identifiant exact du point de charge.
- Après recherche, la page Recharge relit les données chaque minute. Un statut de plus de 5 minutes, sans fuseau horaire, inconnu ou contradictoire ne permet jamais d’annoncer une borne libre. La date du statut et celle de consultation sont distinctes.
- Les offres partenaires affichées sont relues chaque minute, retirées en cas d’échec d’actualisation et filtrées selon leur expiration. Le consentement du formulaire d’essai est réinitialisé si l’offre sélectionnée change.
- Les actualisations sont suspendues en arrière-plan et reprises au retour ou à la reconnexion. Elles ne réécrivent pas les saisies des simulations et du dossier.
- Nouvelle page `/sources`, accessible dans le bandeau, détaillant les sources connectées, les hypothèses et les informations non vérifiées. Route prise en charge par le serveur local.

## Vérifications

- 21 tests JavaScript réussis ; compilation de production réussie.
- Fonction Supabase `volteo-services` déployée en version 7. Aucun changement de schéma, de droits ou d’authentification.
- Appels réels : 11 stations carburant dans un rayon de 5 km des Ulis le 6 octobre ; 100 points de recharge retournés le 7 octobre avec lecture réussie du flux dynamique. Aucun des 100 statuts ne répondait alors au seuil de fraîcheur de 5 minutes : disponibilité affichée inconnue, sans inventer de places libres.
- Test Chromium mobile 390 px sur les réponses publiques effectivement récupérées, rejouées dans le navigateur : page Sources, catalogue étiqueté, 100 cartes de recharge, seconde requête après avancement de l’horloge d’une minute, aucune erreur JavaScript, aucun débordement sur la page Sources. Les tuiles cartographiques étaient bloquées dans ce test. L’accès réseau navigateur direct est resté en chargement dans cet environnement ; la connectivité réelle des API a été validée séparément en HTTP.
- Une première version du traitement CSV dépassait la mémoire de la fonction ; corrigée en ne conservant que les statuts des points affichés et en limitant le cache des réponses externes.

## Limites : tout n’est pas en temps réel

Le catalogue automobile et ses caractéristiques restent de démonstration. Aucun flux de prix constructeur, de stock concessionnaire, de financement, de tarif électrique contractuel ou de veille éditoriale n’est connecté. La synchronisation Supabase n’est pas une vérification de ces informations. Aucun nouveau prix automobile actuel n’est annoncé par cette version.

Les prix carburants dépendent des déclarations des stations et de la cadence du producteur (flux annoncé toutes les 10 minutes, moissonnage annoncé à 15 minutes). Une consultation récente peut rapporter un ancien prix. Les données IRVE statiques sont consultées via l’API tabulaire : celle-ci peut prendre du retard sur la consolidation nationale. Les tarifs textuels IRVE sont déclaratifs, datés via la fiche statique et ne sont pas des prix garantis en direct.

Recherche IRVE bornée à 5 pages de 200 lignes dans une enveloppe géographique, puis filtrée par distance et limitée à 100 points. Un avertissement indique les résultats tronqués. Les points peuvent appartenir à la même station ; les résultats ne garantissent pas une couverture exhaustive. Cache statique par instance : 1 heure ; CSV dynamique : 1 minute. Les sources publiques n’offrent ici aucune garantie de disponibilité. La recherche de concessions reste dépendante d’OpenStreetMap.

Pour rendre les prix automobiles et stocks actuels, il reste à raccorder une source autorisée (flux constructeur ou fournisseur de catalogue) et les offres/stocks de partenaires réels. Il faudra aussi définir précisément finition, batterie, année, prix TTC, frais obligatoires, conditions, date d’observation et expiration. Les guides et aides doivent faire l’objet d’une validation éditoriale datée. Aucun abonnement fournisseur n’a été souscrit.

## Sources consultées

- https://www.data.gouv.fr/datasets/prix-des-carburants-en-france-flux-instantane-v2-amelioree
- https://www.data.gouv.fr/datasets/beta-bases-nationales-des-points-de-recharge-pour-vehicules-electriques-en-france-irve
- https://github.com/datagouv/api-tabular
- https://schema.data.gouv.fr/etalab/schema-irve-dynamique/latest/documentation.html

Les réglages du domaine, des emails Auth et les autres limites de sécurité figurent dans SUPABASE.md et VALIDATION-V4.6.md. Cette livraison ne constitue pas un audit externe.
