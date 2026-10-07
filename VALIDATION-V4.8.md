# VOLTÉO 4.8 — navigation dans un espace permanent

7 octobre 2026.

Le menu latéral, la barre de compte et le contexte géographique restent montés pendant la navigation. Seul le contenu du cadre central change. Le cadre possède son propre défilement ; les liens React conservent les adresses, l’historique du navigateur et l’ouverture directe d’une fiche.

Navigation regroupée par découverte, projet et proximité pour les acheteurs. Pour les professionnels, priorité aux demandes, à l’établissement et aux offres, selon les permissions existantes. Les contrôles d’accès ne sont pas modifiés.

Le menu est repliable sur ordinateur ; son état est mémorisé localement. Sur mobile, il s’ouvre dans un panneau latéral modal, se ferme après un choix ou avec Échap. La localisation demeure accessible au-dessus du contenu. Les préférences de réduction des animations et le thème clair/sombre sont conservés.

Vérifications Chromium avec les réponses publiques de test : cadre central et menu conservent les mêmes nœuds DOM entre catalogue et simulateur ; aucun rechargement du document ; repli et déploiement du menu ; restauration du défilement au retour arrière ; kilométrage du dossier retrouvé dans le simulateur ; navigation et fermeture du panneau mobile ; absence de débordement horizontal sur mobile. Captures ordinateur 1440 px et mobile 390 px examinées. Aucune erreur JavaScript de page. Compilation de production réussie.

Les tests d’interface utilisent des réponses publiques rejouées : ils ne constituent pas une nouvelle validation réseau de Supabase. Aucun changement de base de données ou de fonction distante. Les limites des sources et du temps réel restent décrites dans VALIDATION-V4.7.md. Le film et les données métier sont conservés.
