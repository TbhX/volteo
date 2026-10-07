# VOLTÉO 4.9 — écran desktop et vues successives

7 octobre 2026.

Sur desktop (largeur supérieure à 900 px), le cadre central est réparti en vues horizontales calculées selon la hauteur réellement disponible. Les commandes Précédent/Suivant remplacent le défilement vertical ; le footer reste séparé et visible. Le nombre de vues s’adapte aux dimensions de la fenêtre, à l’ouverture de détails et aux résultats reçus. Les formulaires restent montés pendant le passage entre les vues. Les champs atteints au clavier peuvent révéler leur vue.

Le menu est compacté sur les écrans moins hauts et propose un sélecteur de groupes sous 650 px de hauteur. Le catalogue possède des filtres dépliables et des cartes compactes. Sur mobile, le contenu garde son défilement tactile pour rester lisible ; le footer est permanent.

Une impulsion cyan/vert avec éclair accompagne les clics sur les commandes, les changements de rubrique et le début des appels API. Elle ne bloque pas les interactions et ne retarde pas les réponses. Elle est désactivée lorsque la préférence système demande une réduction des animations.

## Vérifications

- Chromium 1440 × 900 : accueil, catalogue, simulateur, projet, passeport, recharge et sources ; hauteur du contenu égale à la hauteur disponible, footer visible et aucun dépassement vertical du menu.
- Chromium 1366 × 768 : catalogue, footer visible et absence de dépassement vertical du cadre et du menu.
- Chromium 1280 × 600 : menu compact sans dépassement vertical et footer visible.
- Passage à la vue suivante, conservation du kilométrage entre projet et simulateur, puis conservation après rechargement de la page dans la même session.
- Animation présente lorsque les animations sont autorisées ; masquée avec réduction des animations. Menu et contenu mobiles contrôlés à 390 px.
- Aucune erreur JavaScript observée, compilation de production réussie. Réponses publiques rejouées dans les tests d’interface ; aucun nouvel audit réseau, de base de données ou des comptes professionnels.

Les données partagées continuent de passer par le dossier et les brouillons existants. Cela ne transforme pas les informations de démonstration en données vérifiées et ne sauvegarde pas des mots de passe ou des consentements implicites. Les sources et limites restent celles de VALIDATION-V4.7.md.

La pagination utilise la fragmentation CSS native. Les impressions reviennent à un document continu. Des contenus professionnels très longs ou des tableaux particuliers restent à vérifier avec les données réelles avant lancement public.
