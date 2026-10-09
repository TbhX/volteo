# Catalogue France — couverture au 9 octobre 2026

Le catalogue historique comptait 37 fiches de démonstration. Il est complété par 147 fiches de découverte, pour 184 fiches modèles/carrosseries et 44 marques au total. Ce nombre ne compte pas les finitions, batteries et transmissions comme des modèles supplémentaires ; quelques carrosseries distinctes disposent de leur propre fiche.

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
- Sans photographie documentée, la carte présente le nom de la marque plutôt qu’une image d’un autre véhicule.

## Entretien

Pour promouvoir une fiche vers les calculs : sélectionner une version et un millésime, vérifier ensemble prix TTC hors aides, autonomie WLTP mixte, consommation et inclusion des pertes, recharge DC, places, coffre et disponibilité. Documenter les sources au niveau de la version et seulement ensuite intégrer la fiche chiffrée au catalogue opérationnel. Ne pas mélanger le prix de la petite batterie avec l’autonomie maximale d’une autre version.

À chaque revue, relire les sources et vérifier les annonces futures, les générations et les noms remplacés. Une date de consultation ne remplace pas la date d’un tarif ni la confirmation commerciale.

## Vérifications

45 tests unitaires passent. Contrôles navigateur : 184 fiches, recherche avec/sans accents, exclusion des prix inconnus sous filtre budget, fiches constructeur et liens, rechargement et métadonnées, affichage mobile, comparaison historique préservée. Les 147 nouvelles routes ont un fichier HTML de production ; aucune nouvelle page véhicule n’est ajoutée automatiquement au sitemap.
