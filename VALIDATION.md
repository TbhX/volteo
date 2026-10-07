> Mise à jour 4.6 : les parties SQLite, sessions locales et commandes d’administration de ce document sont historiques. Pour le fonctionnement actif, lire SUPABASE.md, SECURITE-SUPABASE.md et VALIDATION-V4.6.md.

# Validation V4.3 — 4 octobre 2026

- Compilation Vite réussie ; 28 tests automatiques réussis (8 JavaScript, 20 Python).
- Tests API ajoutés : inscription professionnelle sans auto-attribution de rôle, rejet des coordonnées incomplètes et synchronisation bidirectionnelle diagnostic / dossier enregistré.
- Chromium : cohérence dossier → diagnostic → recharge → simulateur → catalogue, conservation à travers les rechargements et l’inscription, confirmation du mot de passe, séparation des comptes, professionnel en attente, navigation et absence de débordement du formulaire mobile. Aucune erreur JavaScript.
- Correction d’une course de sauvegarde lors du transfert du brouillon anonyme vers le nouveau compte ; vérification par navigation immédiate après inscription.
- Géographie : tests de cohérence avec réponses contrôlées, pas une nouvelle vérification des flux publics réels. La disponibilité des services externes et des tuiles dépend du réseau.
- Vidéo complète conservée sans modification. Limites de démonstration, hébergement et lancement publicitaire décrites dans les documents dédiés.

# Validation V4.2 — 3 octobre 2026

- Compilation Vite réussie. 26 tests automatiques réussis : 8 JavaScript + 18 Python.
- Dossier anonyme, inscription avec retour et conservation du brouillon en mémoire, sauvegarde, partage volontaire, consultation concessionnaire, réponse et créneau, puis lecture côté acheteur : parcours Chromium réussi sans erreur JavaScript.
- Dossier privé inter-comptes, copie partagée figée, preuve de consentement, effacement en cascade, conflits de mise à jour et contrôle de créneau futur testés.
- En-têtes de sécurité, JSON, chemins sensibles, WSGI, cookie Secure et conditions HTTPS testés. Serveur Waitress réel démarré localement ; sauvegarde SQLite et récupération des données vérifiées.
- Audit npm --omit=dev : zéro vulnérabilité connue signalée. Ce contrôle n’est pas un audit de sécurité de l’application.
- Affichage du dossier mobile 390 px sans débordement, écran professionnel ordinateur inspecté. Pas de validation externe d’hébergement, charge, email, pixels ni campagnes.
- Vidéo complète conservée ; la validation de lecture de V4.1.2 reste applicable. Aucun changement du média.

# Correctif V4.1.2 — 3 octobre 2026

- Défaut reproduit : erreur de décodage Chromium à 7,426644 secondes sur la copie MP4 tronquée de V4.1.1. La durée déclarée dans les métadonnées restait 12,63 secondes.
- Copie complète restaurée depuis l’original utilisateur intact ; vérification du décodage intégral FFmpeg sans erreur.
- Lecture Chromium réelle jusqu’à l’événement ended à 12,631655 secondes, avant fermeture de l’intro.
- Compilation Vite réussie. Nouvelle URL média pour éviter la réutilisation de la copie en cache.
- Correction du lecteur : une erreur, une attente réseau ou un refus de lecture ne déclenchent plus la fermeture automatique.
- Rectification de la validation V4.1.1 ci-dessous : l’ancien test constatait une fermeture, sans distinguer fin de lecture et erreur. Sa conclusion sur la lecture complète était incorrecte.

# Validation V4.1.1 — 3 octobre 2026

- Compilation Vite réussie ; 8 tests JavaScript et 12 tests Python réussis.
- Vidéo utilisateur : H.264 1920×1080, 12,63 secondes, bande son conservée ; remux faststart sans réencodage vidéo.
- Chromium : lecture réelle, fin automatique sans boucle, une lecture par session, replay, Escape, bascule son, focus clavier et réduction des animations validés. Aucune erreur JavaScript.
- Accueil et page /partenaires contrôlés à 1440, 1024 et 390 px : aucun débordement horizontal. Captures ordinateur et mobile inspectées. Accès professionnel anonyme redirigé vers la connexion.
- Sources géographiques externes non retestées pour cette livraison ; limites précédentes ci-dessous toujours applicables.
- Astra demandé indisponible pour cause de quota ; refonte réalisée par l’assistant principal.

## Vérifications de la version précédente — 2 octobre 2026

- Compilation Vite réussie ; audit npm : aucune vulnérabilité signalée.
- 8 tests JavaScript (métier et cache) et 12 tests Python (API, permissions, normalisation géographique) réussis.
- 37 photographies créditées ; les 74 fichiers WebP décodent correctement et les correspondances ont été contrôlées visuellement.
- Ancien film remplacé par la vidéo utilisateur en V4.1.1.
- Parcours Chromium : inscription, diagnostic sauvegardé, essai de démonstration, simulation sauvegardée, compte, déconnexion et protection admin. Aucune erreur JavaScript ; accueil mobile 390 px sans débordement horizontal.
- Appels réels aux sources : commune de Paris, 37 stations dans un rayon de 5 km autour du centre de Paris et 81 établissements automobiles OpenStreetMap. Les services ont aussi retourné des timeouts/503 pendant les essais : l’application affiche leurs erreurs et permet de relancer.
- Vérification de l’interface cartographique avec un instantané réel de prix, indépendamment de la disponibilité des sources publiques : marqueurs, prix transféré au simulateur, réduction des animations et absence de débordement mobile validés. Les tuiles OpenStreetMap ont été bloquées par le réseau du poste de vérification ; leur affichage cartographique complet reste à contrôler sur une connexion ouverte.

Les prix et caractéristiques du catalogue demeurent des données de démonstration. Les stocks, essais et qualifications électriques des établissements OSM ne sont pas vérifiés. Aucun email/SMS envoyé, aucun compte Supabase connecté. Les compétences Supabase ont été installées séparément dans l’environnement de travail.

Les bases et comptes des essais ne sont pas inclus dans l’archive. Ces vérifications ne constituent pas un audit de sécurité de production.
