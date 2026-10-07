> Mise à jour 4.6 : les parties SQLite, sessions locales et commandes d’administration de ce document sont historiques. Pour le fonctionnement actif, lire SUPABASE.md, SECURITE-SUPABASE.md et VALIDATION-V4.6.md.

# Ajout V4.3 — 4 octobre 2026

Pour montrer la distinction des comptes : ouvrir `/connexion?inscription=1`, choisir Acheteur ou Professionnel. Le professionnel renseigne son établissement, son SIREN/SIRET déclaré, son contact et son code postal. Il arrive dans un espace en attente, sans dossiers clients. Depuis un compte administrateur, consulter ses informations dans `/admin`, vérifier l’établissement hors du prototype puis attribuer le rôle concessionnaire et la concession correspondante. Le changement révoque ses sessions : il doit se reconnecter. Ne pas partager le compte administrateur.

Pour montrer la cohérence acheteur : modifier le kilométrage dans le dossier, ouvrir le diagnostic puis le simulateur ; modifier le trajet quotidien puis ouvrir Recharge. Budget et format sont aussi repris dans le catalogue. Le contexte de localisation reste accessible sur chaque page.

# VOLTÉO — démonstration concessionnaires

Version 4.2, 3 octobre 2026. Prototype fonctionnel pour rendez-vous commerciaux privés. Les modèles et concessions du formulaire sont des données de démonstration ; aucune promesse de réseau déjà constitué, de stock réel ou de volume de prospects.

## Préparer la présentation

1. Extraire l’archive dans un nouveau dossier. Conserver à part toute base existante et en faire une sauvegarde avant migration. Python 3.11+ est nécessaire ; la version compilée du site est incluse.
2. Dans ce dossier, exécuter `python3 server/manage.py --create-demo-accounts` (Windows : `python server/manage.py --create-demo-accounts`). Trois comptes sont créés : acheteur, concession 1 et administration. Leurs mots de passe sont générés aléatoirement et affichés une seule fois dans le terminal. Aucun mot de passe par défaut n’est livré.
3. Garder les identifiants privés, puis lancer START-WINDOWS.bat ou START-MAC-LINUX.sh. Ouvrir http://localhost:8080. Ne pas ouvrir index.html directement.
4. Utiliser uniquement des coordonnées fictives pendant la démonstration. Ne jamais donner l’accès administrateur à un prospect. Un compte concessionnaire donne accès à toutes les demandes de sa concession : attribuer un compte et une concession séparés à chaque organisation invitée.

## Démonstration en 7 minutes

- **0–1 min — Promesse :** VOLTÉO aide un acheteur à préparer son passage à l’électrique et à arriver en concession avec un projet renseigné. Montrer l’accueil et le film complet ; le film reste facultatif.
- **1–3 min — Acheteur :** ouvrir `/projet`, renseigner usage, recharge, budget, code postal, horizon et reprise. Consulter la sélection avant inscription. Se connecter comme acheteur et enregistrer le dossier.
- **3–4 min — Demande :** ouvrir la Peugeot e-208 du catalogue, sélectionner la concession de démonstration 1, entrer un téléphone fictif. Déplier le dossier et choisir explicitement de le joindre. Autoriser la transmission puis enregistrer.
- **4–6 min — Concession :** se déconnecter, ouvrir `/professionnel` avec le compte concession. Montrer le projet partagé, l’autorisation datée et le suivi. Sélectionner « Essai planifié », saisir un créneau futur convenu et une réponse, puis enregistrer.
- **6–7 min — Boucle complète :** revenir dans le compte acheteur pour montrer la réponse et le créneau. Expliquer que les emails, stocks réels et partenaires vérifiés seront raccordés pour le pilote.

Il n’y a ni envoi email/SMS ni réservation auprès d’un établissement réel. Le statut « Essai planifié » illustre un créneau convenu et enregistré ; ce n’est pas une synchronisation d’agenda ni une confirmation automatique de l’acheteur.

## Proposition de pilote à discuter

Un territoire limité, quelques concessions volontaires, des offres datées et un interlocuteur identifié par établissement. Recueillir leurs besoins : marques, véhicules réellement essayables, créneaux, rayon couvert et délai de réponse possible. Aucun tarif ni engagement commercial n’est fixé dans le logiciel.

Questions pour conclure : « Quels projets souhaitez-vous recevoir ? Qui les traiterait ? Sur quels véhicules pouvons-nous tester le parcours ? Quelle information vous manque avant de rappeler un acheteur ? »

## Ce que vous pouvez montrer aujourd’hui

Dossier privé, sélection expliquée, simulation, carte, demande avec partage volontaire, séparation des concessions, réponse professionnelle, historique de statut, compte acheteur, export et suppression des données. Les photos sont créditées ; l’adéquation année/finition et les prix doivent être vérifiés avant une campagne publique.

## Ce qui reste à décider avec le propriétaire

Nom de domaine et hébergement, identité de l’éditeur et contact, territoire pilote, interlocuteurs partenaires, conditions commerciales, source de prix et stocks, prestataire email. Voir SECURITE.md et LANCEMENT-PUBLICITAIRE.md.
