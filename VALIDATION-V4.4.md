# Validation VOLTÉO V4.4 — 4 octobre 2026

## Vérifications effectuées

- Compilation de production React/Vite réussie. Avertissements existants « use client » de React Router, sans échec de compilation.
- Suite automatisée : 11 tests JavaScript + 27 tests Python réussis (38 au total). Les 7 tests Python du pilote ont été rejoués avec succès après l’ajustement final séparant les statistiques réelles et de démonstration.
- Migration testée sur une copie de la base existante antérieure : données conservées, migrations rejouables, intégrité SQLite et clés étrangères valides. La base originale n’a pas été modifiée par ce test.
- Navigateur Chromium, vue mobile 390 × 844 et bureau 1440 × 1000 : inscription au pilote avec choix parmi plusieurs communes, inscription acheteur, sauvegarde du passeport, cohérence du kilométrage et du tarif entre recharge et simulateur, sélection des stations, état sans offre, création d’un partenaire et d’une offre par l’administration, demande et copie de passeport, présence par code, bilan privé puis partagé, statistiques professionnelles.
- Douze routes parcourues sur mobile sans débordement horizontal. Aucune erreur JavaScript détectée pendant ces parcours.
- Les tests de navigation utilisent une base jetable et des fixtures géographiques contrôlées ; les tuiles OSM sont bloquées uniquement pendant ce test. Aucun compte ni partenaire de test inclus dans le ZIP.

## Sources externes

- API officielle des communes interrogée réellement pour 91940 : Les Ulis (91692), Gometz-le-Châtel (91275) et Saint-Jean-de-Beauregard (91560). Centre des Ulis retenu : 48.6817 / 2.1864.
- Recherche réelle de bornes via Overpass à 5 km des Ulis tentée : source temporairement indisponible. Le traitement des réponses et erreurs est testé ; aucun résultat réel ni disponibilité en direct n’est prétendu dans la livraison. L’interface affiche un état d’erreur, sans données fictives de secours.
- Les caractéristiques du catalogue restent indiquées comme données de démonstration. Aucune vérification exhaustive des caractéristiques commerciales ou géographiques n’est revendiquée.

## Contrôles d’accès du pilote

Rôles et CSRF, notes internes des partenaires, offres propres à chaque concession, offres expirées/hors zone/suspendues, versions concurrentes, demande liée à une offre active, code de présence réservé à l’acheteur, bilan privé/non partagé, retrait du partage, export et suppression en cascade, commune calculée côté serveur et données de formulaire invalides.

## Périmètre de cette livraison

Prototype local, sources et compilation fournies. Aucun hébergement, partenaire commercial réel, campagne Meta/Google, suivi publicitaire, email ou SMS connecté. Les tests ne constituent pas une certification de sécurité ou un audit indépendant.
