> Mise à jour 4.6 : les parties SQLite, sessions locales et commandes d’administration de ce document sont historiques. Pour le fonctionnement actif, lire SUPABASE.md, SECURITE-SUPABASE.md et VALIDATION-V4.6.md.

# Pilote local V4.4

Le lancement envisagé vise Les Ulis et un rayon initial de 20 km. Le site est prêt à démontrer ce parcours sur `/pilote`. Voir `PILOTE-LES-ULIS.md` pour son fonctionnement et le message à tester. Le rayon se règle dans le site ; la campagne Meta devra être configurée séparément. Aucune campagne n’est lancée et aucun pixel ajouté.

# Passage de la démonstration aux campagnes Meta / Google

Le livrable 4.2 permet une démonstration privée complète. Il n’est pas encore le service public à promouvoir : le formulaire utilise des concessions fictives et les prix du catalogue restent de démonstration. Aucune campagne, aucun pixel et aucune dépense n’ont été créés.

## Destination prévue

`/projet` : entrée directe vers le dossier, sans intro vidéo automatique, avec sélection consultable avant inscription. L’URL de l’annonce devra utiliser le domaine public définitif. L’accueil et son film restent accessibles séparément.

La publicité doit annoncer le service réellement disponible : préparer un projet électrique, comparer et estimer. Ne pas promettre un essai garanti, des économies chiffrées, un stock ou un réseau de partenaires tant qu’ils ne sont pas vérifiés. La page, les offres et le bouton d’action doivent correspondre à l’annonce.

## Conditions de lancement

| Sujet | Présent dans le prototype | À finaliser avant trafic public |
|---|---|---|
| Parcours acheteur | Dossier, sélection, sauvegarde, demande | Tester avec des utilisateurs pilotes et données vérifiées |
| Concession | Projet partagé, réponse, créneau, historique | Partenaires volontaires, interlocuteurs, stocks et modalités d’essai |
| Données véhicules | Photos créditées, comparateur, simulateur | Prix et finitions datés, sources, procédure d’actualisation |
| Hébergement | WSGI et exemple de prévisualisation HTTPS privée | Domaine, serveur, sauvegardes, surveillance et validation externe |
| Identité et données personnelles | Notice expliquant le fonctionnement actuel | Éditeur, contact, hébergeur, finalités, bases légales, durées et droits adaptés à l’exploitation |
| Comptes | Sessions, rôles, changement de mot de passe | Vérification d’email, récupération par email et renforcement des accès sensibles |
| Notifications | Réponses visibles dans les comptes | Service email, délivrabilité, messages et gestion des échecs |
| Mesure publicitaire | Aucun traceur tiers | Choisir la mesure, intégrer le consentement puis vérifier les événements réels |

## Mesure à connecter au moment utile

Mesurer des étapes distinctes : dossier terminé, demande enregistrée, réponse du professionnel, essai convenu puis réalisé. Ne pas compter une inscription comme une vente, ni un simple clic comme une demande envoyée. Aucun de ces événements n’est actuellement envoyé à Meta ou Google.

Si des traceurs publicitaires sont ajoutés : expliquer les finalités et acteurs, attendre le consentement avant leur chargement, proposer accepter/refuser avec la même facilité, et permettre le retrait. Faire vérifier la configuration choisie. Ne pas envoyer le dossier, le téléphone, les notes libres ou le code postal aux plateformes comme paramètres de conversion. Un suivi serveur ne dispense pas d’examiner le consentement et les autres obligations applicables.

## Choix nécessaires du propriétaire

1. Domaine souhaité et hébergement disponible.
2. Identité de l’éditeur, email professionnel et contact pour les droits sur les données.
3. Première zone pilote et concessions prêtes à participer.
4. Fournisseur email et interlocuteur pour les demandes entrantes.
5. Objectif de campagne et budget à décider après validation du parcours réel.

Le prototype privé protégé par mot de passe sert aux démonstrations. Il ne doit pas être utilisé comme destination d’annonce. La version publique devra être accessible aux visiteurs et aux contrôles de la régie. Aucun accord d’une plateforme publicitaire ne peut être garanti.

## Sources officielles consultées le 3 octobre 2026

- Consentement et traceurs, CNIL : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/comment-mettre-mon-site-web-en-conformite
- Pertinence et ergonomie des pages d’arrivée, Google Ads : https://support.google.com/google-ads/answer/6238826?hl=fr
- Destination et URL finale, Google Ads : https://support.google.com/google-ads/answer/2684490
