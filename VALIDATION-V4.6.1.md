# Validation VOLTÉO 4.6.1 — 6 octobre 2026

## Correctif livré

Les recherches de bornes et concessions essaient deux serveurs publics OpenStreetMap fixes, avec une attente maximale de 12 secondes par tentative. Les réponses complètes sont conservées 30 minutes en mémoire dans chaque instance de fonction ; les requêtes simultanées identiques sont regroupées. Le cache ne persiste pas au redémarrage et n'est pas partagé entre instances.

Les réponses partielles, invalides ou supérieures à 5 Mo sont rejetées. Une panne ne devient jamais une liste vide présentée comme une recherche réussie. La date de collecte reste celle de la réponse initiale, même depuis le cache. Les diagnostics enregistrent seulement le serveur, le statut HTTP ou le type d'erreur, sans coordonnées utilisateur.

La fonction Supabase `volteo-services` est déployée en version 3. L'authentification et la suppression de compte ne sont pas modifiées. La marque reste VOLTÉO.

## Vérifications et limite réelle

Les 16 tests JavaScript réussissent, dont 5 nouveaux tests couvrant le secours après erreur, les résultats incomplets, le délai maximal, le regroupement/cache et le plafond de réponse. La compilation de production réussit.

Les appels réels autour des Ulis sur la version 2 de la fonction ont néanmoins retourné HTTP 503 pour les bornes et concessions, après environ 21 secondes. Un contrôle direct a confirmé un délai dépassé sur private.coffee et HTTP 504 sur overpass-api.de. La version 3 ajoute uniquement les diagnostics anonymisés. Le correctif améliore la gestion des pannes mais ne garantit pas la disponibilité des sources : cette partie de la carte ne peut pas être annoncée comme opérationnelle lors de cette livraison.

Avant lancement public, prévoir une source géographique avec disponibilité maîtrisée ou une synchronisation planifiée des données locales. Les autres validations et limites de la version 4.6 restent décrites dans VALIDATION-V4.6.md ; elles n'ont pas toutes été répétées pour ce correctif ciblé. Domaine, emails Auth et vraies offres partenaires restent à finaliser.
