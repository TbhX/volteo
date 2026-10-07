# Validation VOLTÉO 4.6 — 5 octobre 2026

## Vérifications réalisées

- Compilation de production réussie avec Supabase JS épinglé en version 2.117.2.
- 11 tests JavaScript réussis : calculs, recommandations, cohérence du parcours et cache public isolé des données de compte.
- Toutes les migrations appliquées à un PostgreSQL isolé (PGlite), puis assertions SQL de parcours et d’isolation exécutées avec succès. La sérialisation des révisions est également testée avec `extra_float_digits=0`.
- Les mêmes assertions SQL passent sur le projet Supabase distant, dans une transaction intégralement annulée après le test.
- Parcours SQL vérifiés : création de partenaire et offre, sauvegarde du dossier, cohérence du profil, favori, simulation, consentement d’essai, copie du passeport, isolation entre acheteurs/concessions, rendez-vous, conflit de révision, code de présence, bilan privé/partagé, statistiques, export et suppression en cascade.
- Les métadonnées d’inscription ne peuvent attribuer un rôle privilégié. Les clients n’ont aucun accès direct aux tables privées, ni au cache officiel des communes.
- Connexion réelle Supabase Auth vérifiée en HTTP et dans Chromium. Parcours navigateur connecté au vrai projet, avec 48 requêtes RPC observées : commune officielle des Ulis, participation au pilote, dossier sauvegardé, kilométrage retrouvé dans le simulateur, favoris conservés après rechargement, accès professionnel en attente. Aucune erreur JavaScript de page.
- Vérifications navigateur sur mobile 390 px et espace professionnel sur ordinateur 1440 px ; captures examinées. Les tuiles OpenStreetMap ont été bloquées dans le test navigateur ; les échanges Auth et API utilisaient réellement Supabase via le proxy réseau de l’environnement de test.
- Les 27 anciens tests Python réussissent en mode SQLite explicitement activé. Ils couvrent uniquement le code historique et ne remplacent pas les vérifications Supabase ci-dessus.
- Tests Auth HTTP réussis : refus d’une suppression anonyme ou avec mauvais mot de passe, refus immédiat d’un jeton révoqué, changement de mot de passe, refus de l’ancien et acceptation du nouveau, suppression des comptes acheteur et professionnel par l’endpoint réel. Les comptes de test ont été supprimés.
- Appels géographiques réels depuis la fonction déployée : communes autour de 91940 et 11 stations carburant dans un rayon de 5 km retournées. Au moment du contrôle, les recherches OpenStreetMap de concessions et bornes retournent une indisponibilité 503, affichée sans résultats fictifs.

## État de la sécurité et limites

Les contrôles d’accès des données ne donnent plus d’alerte à l’advisor Supabase. Il reste un avertissement Auth : protection contre les mots de passe compromis désactivée. L’advisor de performance signale des index encore inutilisés, attendu sur une base neuve ; les index de relations et d’isolation sont conservés.

Les comptes de test utilisent des adresses synthétiques ; aucun email commercial n’est envoyé. Le domaine définitif, les URL Auth autorisées et le SMTP restent à configurer. La délivrabilité de confirmation/récupération n’est pas validée sur un domaine réel.

Les images et le film restent des ressources statiques du site. Les prix et caractéristiques historiques restent de démonstration. Aucune campagne publicitaire ni offre réelle n’est activée par la migration.

Ces tests constituent des vérifications ciblées, pas un audit externe exhaustif. Les instructions d’installation, d’administration initiale et de domaine se trouvent dans SUPABASE.md.

Références des advisors :
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index
