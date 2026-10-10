# Catalogue France — revue photographique du 10 octobre 2026

Le registre éditorial conserve 184 fiches modèles/carrosseries (37 historiques et 147 fiches de découverte). Le catalogue visible est limité à 78 fiches dotées d’une photographie documentée : 37 historiques et 41 nouvelles. Les 106 fiches sans photo validée sont masquées et leurs pages HTML ne sont pas générées. Ce nombre ne compte pas les finitions, batteries et transmissions comme des modèles supplémentaires ; quelques carrosseries distinctes disposent de leur propre fiche.

## Périmètre et preuves

La présence du modèle 100 % électrique a été recherchée sur les sites France des constructeurs ou importateurs officiels. Chaque ajout possède une URL source, une date de consultation et un statut `manufacturer-listed` dans `src/market-models.json`. Ce statut signifie « référencé sur la source française », pas « commandable immédiatement » ou « en stock chez un partenaire ».

Les données manquantes restent nulles. Les prix promotionnels après reprise, primes ou conditions expirées ne sont pas importés comme tarifs universels. La fiche Honda e:Ny1 documente séparément la version Executive ; elle reste une fiche de découverte tant que son intégration aux calculs n’a pas été validée.

Sont couverts : voitures particulières et versions passagers électriques, citadines, compactes, berlines, SUV, breaks, coupés, cabriolets, ludospaces et monospaces. Sont exclus : hybrides, prolongateurs thermiques, utilitaires marchandises, quadricycles, imports parallèles et futurs modèles dont la commercialisation française n’est pas établie. Par exemple, la smart #2 indiquée pour 2027 et le Jeep Wagoneer S encore présenté comme futur modèle ne sont pas ajoutés. Les configurations DM-i et REEV ne sont pas assimilées aux variantes BEV du même nom.

Il ne s’agit pas d’une base exhaustive de tous les véhicules d’occasion, de toutes les variantes ou de toutes les offres commerciales françaises. Les anciens modèles éventuellement encore présents dans le catalogue historique ne sont pas requalifiés comme des véhicules neufs actuellement commandables. Les stocks et les prix doivent être confirmés.

## Intégration

- Le catalogue recherche simultanément les fiches historiques et les fiches constructeur, sans accent obligatoire, avec catégories et type de fiche.
- L’ordre est alphabétique, sans note ni classement d’adéquation.
- Le budget est un filtre volontaire : s’il est actif, un prix absent ne vaut jamais zéro et la fiche est exclue.
- Les fiches de découverte disposent d’une URL interne, d’une page HTML de production, d’une source et de suites vers le dossier ou les offres locales.
- Elles restent hors score, simulation et demande directe pour ne pas inventer de caractéristiques ou de stock. Les flux existants de comparaison, favoris et demandes restent sur les fiches historiques valides en base.
- Les ajouts sont livrés comme registre éditorial versionné dans l’application. La base Supabase historique n’a pas reçu de fiches incomplètes ; aucun compte ou droit n’a été modifié.
- Sans photographie documentée dans `src/vehicle-photos.json`, aucune carte ni fiche de découverte n’est publiée. Un échec de chargement retire également la carte et ajuste le compteur dans le catalogue.
- Chaque photo ouvre la fiche, conserve son cadrage complet, possède deux tailles WebP hébergées localement et des crédits (auteur, source, licence, adaptations). Les 41 nouvelles photos ont été contrôlées visuellement ; vues intérieures et prototypes camouflés ont été remplacés. La finition photographiée peut différer de celle documentée.
- La recherche reste immédiatement visible ; les filtres avancés se déplient pour laisser les images apparaître plus tôt sur mobile. Les aperçus de partage des fiches utilisent la photo du modèle.

## Entretien

Pour promouvoir une fiche vers les calculs : sélectionner une version et un millésime, vérifier ensemble prix TTC hors aides, autonomie WLTP mixte, consommation et inclusion des pertes, recharge DC, places, coffre et disponibilité. Documenter les sources au niveau de la version et seulement ensuite intégrer la fiche chiffrée au catalogue opérationnel. Ne pas mélanger le prix de la petite batterie avec l’autonomie maximale d’une autre version.

À chaque revue, relire les sources et vérifier les annonces futures, les générations et les noms remplacés. Une date de consultation ne remplace pas la date d’un tarif ni la confirmation commerciale.

## Vérifications

46 tests unitaires passent, dont la présence et le format des fichiers photographiques ainsi que leurs attributions. Contrôles navigateur : filtrage des modèles sans photo, recherche, exclusion des prix inconnus sous filtre budget, détail avec photo et source, rechargement et métadonnées, affichage mobile, retrait d’une carte après échec d’image, comparaison historique préservée. Le build ne génère que les 78 pages véhicule illustrées ; aucune page véhicule n’est ajoutée automatiquement au sitemap.
