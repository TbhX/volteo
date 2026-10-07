# VOLTÉO V4.4 — pilote local autour des Ulis

## Ce que cette version permet

Le prototype fonctionne en local ; aucun déploiement ni achat publicitaire n’est réalisé. La nouvelle porte d’entrée est `/pilote`. L’accueil conserve le film complet de 12,63 secondes et met en avant Les Ulis.

Le périmètre initial est de **20 km à vol d’oiseau autour du centre de la commune des Ulis**. Ce choix initial est modifiable dans Administration (10, 15, 20, 25, 30 ou 50 km). Le centre provient de l’API officielle des communes, consultée le 4 octobre 2026 : code INSEE 91692, latitude 48.6817, longitude 2.1864. Le code postal 91940 désigne plusieurs communes ; le visiteur doit choisir la sienne.

Le rayon du pilote définit les établissements pouvant publier et l’éligibilité indicative des communes. La distance de recherche personnelle reste distincte : elle suit le dossier acheteur. Une position GPS est facultative et n’est pas enregistrée dans le compte.

### Acheteur

- `/pilote` : vérification de commune, inscription volontaire, origine de découverte déclarée (dont Facebook / Instagram), retrait de l’inscription. Les personnes hors zone peuvent enregistrer leur intérêt sans promesse d’essai. Aucune transmission de coordonnées aux concessions à cette étape.
- `/passeport` : budget et quotidien existants, stationnement, recharge confirmée ou à vérifier, long trajet, scénario prudent d’autonomie et priorités d’essai. Sauvegarde privée, impression, copie partagée uniquement sur choix explicite dans une demande.
- `/recharge` : hypothèses de consommation, puissance moyenne, sessions, tarif et détour ; estimation du temps et de l’énergie ; recherche de stations OSM, sélection d’une solution principale et d’un secours, date de vérification personnelle. Les kilomètres et le tarif principal restent cohérents avec le simulateur courant. Les simulations enregistrées restent des scénarios indépendants.
- `/offres-locales` : seulement les offres actives de partenaires validés dans le périmètre, avec version précise, prix comptant et frais obligatoires, disponibilité déclarée, source et expiration. Tri prix/distance, filtre budget/format/rayon, carte et comparaison de trois offres.
- Fiche véhicule : essai rattaché à une offre, priorités, parcours à convenir et partage facultatif du passeport. Une copie de l’offre et du passeport est conservée à la création. Une offre périmée est refusée côté serveur.
- Compte : créneau et réponse du professionnel, code de présence autour du rendez-vous, bilan après l’essai (décision, frein, points appréciés, questions restantes), privé par défaut et partage révocable.

### Concessionnaire

L’inscription professionnelle ne donne aucun accès aux acheteurs. L’administrateur vérifie l’établissement puis rattache le compte à sa concession.

- `/stock` : gestion de ses propres offres, confirmation prix/stock et expiration de 1 à 7 jours. Les frais obligatoires s’ajoutent au prix comptant dans le total affiché. Les conditions de financement sont textuelles : aucune mensualité promotionnelle incomplète n’est affichée.
- `/professionnel` : demandes affectées, copie du passeport autorisée, préparation d’essai, réponse, créneau, historique et code présenté par l’acheteur.
- Le code n’est jamais renvoyé dans les réponses destinées aux professionnels. Confirmation ouverte de 2 h avant à 48 h après le créneau, cinq tentatives maximum par professionnel et demande sur 15 minutes. Une confirmation déjà réalisée est idempotente. Aucun paiement n’est déclenché.
- Statistiques : demandes, présences confirmées par code, bilans partagés et achats déclarés, freins déclarés. Les chiffres du pilote excluent les essais de démonstration ; leur nombre est présenté séparément. Une déclaration d’achat n’est pas une vente auditée.

### Administration

1. Créer l’établissement dans Administration > Pilote ; renseigner adresse, coordonnées réelles, marques et trace de vérification.
2. Confirmer manuellement identité, adresse et accord de partenariat ; activer le partenaire.
3. Rattacher son compte professionnel à cet établissement dans les permissions. Le compte doit se reconnecter.
4. L’établissement saisit et confirme ses offres dans Mes offres.
5. La suspension du partenaire, le changement de périmètre ou l’expiration masquent ses offres publiques. Les copies déjà transmises avec des demandes restent historiques.

Les concessions historiques de démonstration ne sont pas automatiquement converties en partenaires. Une base neuve affiche honnêtement zéro offre locale. Le formulaire d’essai de démonstration reste accessible dans un volet explicitement nommé.

## Tester en dix minutes

1. Démarrer l’application et ouvrir `http://localhost:8080/pilote`.
2. Vérifier 91940, choisir Les Ulis, créer un compte acheteur puis enregistrer son intérêt.
3. Remplir le projet et le passeport ; vérifier la conservation des kilomètres entre diagnostic, recharge et simulateur.
4. Rechercher les bornes (source externe), choisir deux solutions et sauvegarder le passeport.
5. Pour les rôles de test : `python3 server/manage.py --create-demo-accounts` affiche des mots de passe aléatoires, non inclus dans la livraison.
6. Avec l’administration de test, créer un établissement clairement nommé « Test interne » et confirmer une offre fictive dans la base locale de démonstration.
7. Avec l’acheteur, demander un essai depuis cette offre, en choisissant explicitement les partages.
8. Avec le professionnel habilité ou l’administration, convenir d’un créneau et enregistrer la réponse.
9. Dans la fenêtre de présence, l’acheteur présente son code, puis le professionnel le saisit.
10. Rédiger le bilan ; vérifier qu’il est invisible au professionnel avant d’activer son partage. Ne jamais conserver ces données fictives dans une future base de production.

## Préparer les futures Meta Ads

La destination prévue est `https://VOTRE-DOMAINE/pilote` après hébergement et préparation publique. Le site n’a pas de domaine public dans cette livraison. Il ne configure ni ciblage Meta ni pixel, et ne lance pas d’annonce.

- Point de départ proposé : une seule zone autour des Ulis, correspondant au rayon choisi pour le pilote. Vérifier séparément les possibilités de ciblage offertes par Meta au moment de créer la campagne ; le réglage du site ne pilote pas Meta.
- Message à tester : « Vous habitez près des Ulis et envisagez l’électrique ? Préparez votre budget, votre recharge et votre prochain essai avec VOLTÉO. Découvrez le pilote local. »
- Appel à l’action : « Préparer mon projet ». Aucun nombre de partenaires, disponibilité ou économie garantis sans preuve.
- Pour démarrer sans suivi publicitaire intégré, l’origine de découverte est demandée volontairement à l’inscription au pilote. Il s’agit d’une déclaration, pas d’une attribution publicitaire mesurée.
- Suivre chaque semaine : intérêts dans le rayon, passeports et demandes dans le portail, réponses, essais confirmés, bilans et principaux freins. Fixer ensuite des objectifs chiffrés d’après les premiers résultats réels.
- Une première expérimentation avec quelques concessions et une durée convenue peut permettre d’ajuster le service. Aucun tarif professionnel ni engagement gratuit/payant n’est imposé dans le code.

Avant des publicités grand public, les étapes restantes de `LANCEMENT-PUBLICITAIRE.md` s’appliquent : hébergement, identité de l’exploitant, documents adaptés, délivrabilité des emails et partenaires/offres réels. Ce prototype ne remplace pas ces opérations.

## Hypothèses et limites des données

- Les caractéristiques générales des véhicules restent des données de démonstration, même lorsqu’une offre commerciale précise est confirmée par un professionnel. Les photographies sont des photos de référence, sans garantie de finition identique.
- Le passeport utilise une réduction d’autonomie choisie (20–50 %) et une fenêtre de batterie de 80 %. Ce n’est ni une mesure météo, ni un modèle prédictif certifié, ni une garantie d’autonomie.
- Recherche de bornes : OpenStreetMap / Overpass, licence ODbL. Connecteurs et puissances peuvent manquer ; stations privées exclues lorsqu’elles sont signalées comme telles. Les tarifs et la disponibilité en direct ne sont pas connectés. Le prix utilisé est une hypothèse saisie par l’acheteur. La date affichée pour la source est celle de la consultation, pas celle d’une inspection de la station.
- La puissance de recharge saisie est une moyenne supposée, limitée par la voiture et l’installation ; la durée n’est pas un simulateur de courbe de charge.
- Centres de communes et distances à vol d’oiseau : une adresse proche de la frontière de zone mérite une vérification manuelle. Aucun temps de trajet routier n’est inventé.
- Partenaires validés par l’administrateur, offres confirmées déclarativement par le professionnel : pas d’audit indépendant automatisé. Les sources et dates sont visibles.
- Confirmation de présence par code présenté par l’acheteur : utile pour le pilote, pas une preuve antifraude absolue ni un déclencheur de facturation.
- Les notifications email/SMS et le suivi automatique après achat ne sont pas connectés. La communication et les bilans sont consultables dans le portail.
