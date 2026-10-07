# VOLTÉO 4.5 — interface et expérience

## Changements

- Navigation adaptée au rôle, barre d’accès rapide sur téléphone et menu modal. Le menu se ferme après sélection ou avec Échap ; la navigation Tab reste dans le menu ouvert.
- Fil d’Ariane et repères du parcours acheteur ; titres de page harmonisés.
- Système commun de couleurs, espacements, cartes, boutons et typographie, en thèmes clair et sombre. Grilles adaptées au téléphone, à la tablette et à l’ordinateur.
- Champs associés à leurs libellés, indicateurs obligatoires et saisies lisibles sur téléphone. Les valeurs du projet et du simulateur conservent leur fonctionnement partagé.
- Simulateur organisé par sections : rythme, recharge, achat, financement, entretien. Récapitulatif du passeport repliable et paramètres de sécurité regroupés.
- Recherche et filtrage des demandes professionnelles, avec remise à zéro des filtres et états vides explicites.
- Comparateur flottant placé au-dessus de la navigation mobile. Tableaux défilants, cartes géographiques et écrans administrateur adaptés aux petites largeurs.
- Préférence de réduction des animations respectée. Aucun nouveau service externe ni bibliothèque ajoutée.

## Validation

- Compilation de production réussie.
- 38 tests automatisés réussis : 11 JavaScript et 27 Python.
- Parcours navigateur complet vérifié : inscription, sélection de commune, participation au pilote, cohérence kilométrage/recharge, passeport, création d’offre par l’administration, demande d’essai consentie, code de présence et bilan privé puis partagé.
- Contrôles de débordement horizontal sur 17 routes aux largeurs 360, 768 et 1440 px, plus 5 écrans administrateur/professionnel à 360 px. Un premier passage vérifie également 12 routes acheteur à 390 px.
- Contrôles du menu clavier, fermeture après navigation, modification dans une section du simulateur, recherche professionnelle et position du comparateur mobile.
- Vérification des champs de saisie visibles à 360 px : taille de texte minimale de 16 px.
- Captures examinées pour le pilote mobile, le stock professionnel, le catalogue mobile clair/sombre et le simulateur sur ordinateur.
- Aucune erreur JavaScript de page détectée dans le parcours testé.

Les essais navigateur utilisent une base temporaire et des données géographiques déterministes ; les tuiles cartographiques externes sont bloquées dans ce contrôle. Ils ne constituent pas une vérification de disponibilité des services géographiques en production, ni un audit d’accessibilité exhaustif.

La vidéo d’introduction est conservée sans modification. Les règles de sécurité, consentement, séparation des comptes et validation des partenaires restent celles de la version 4.4. Aucune publicité, publication externe ou offre commerciale réelle n’est activée par cette livraison.

## Utilisation

Lancer START-WINDOWS.bat ou sh START-MAC-LINUX.sh, puis ouvrir http://localhost:8080. Pour actualiser une installation existante, sauvegarder sa base server/volteo.sqlite3 et ses variables d’environnement avant de remplacer les fichiers du programme. Le ZIP ne contient aucune base utilisateur ni secret.
