# Emails VOLTÉO — Supabase Auth

13 modèles français avec mise en page email en tableaux, styles intégrés, pré-en-tête, bouton et lien de secours. Aucun visuel externe ni suivi. La confirmation d’email n’est jamais présentée comme une validation de concession. Les notifications sont informatives et ne contiennent aucun lien d’authentification.

## Installation sur le projet hébergé

Projet : `gmwcnafoowmeqryqpcpn`. Les fichiers du dépôt ne modifient pas à eux seuls les emails du Supabase hébergé.

Dans **Authentication → Email Templates / Emails**, copiez le sujet de `manifest.json` et le HTML du fichier correspondant. Les sept notifications de sécurité doivent être activées dans le tableau de bord pour être envoyées. Leur disponibilité dépend également des fonctionnalités Auth utilisées. Préparer un modèle MFA ou téléphone n’active pas ces méthodes dans VOLTÉO.

| Modèle Supabase | Fichier |
|---|---|
| Confirm sign up | confirmation.html |
| Invite user | invite.html |
| Magic Link | magic_link.html |
| Change Email Address | email_change.html |
| Reset Password | recovery.html |
| Reauthentication | reauthentication.html |
| Password changed | password_changed_notification.html |
| Email address changed | email_changed_notification.html |
| Phone number changed | phone_changed_notification.html |
| Identity linked | identity_linked_notification.html |
| Identity unlinked | identity_unlinked_notification.html |
| MFA factor enrolled | mfa_factor_enrolled_notification.html |
| MFA factor unenrolled | mfa_factor_unenrolled_notification.html |

Alternative Management API, depuis un terminal disposant d’un jeton autorisé dans `SUPABASE_ACCESS_TOKEN` (ne jamais le coller dans Git, une conversation ou le JavaScript du site) :

```sh
node scripts/install-auth-emails.mjs
node scripts/install-auth-emails.mjs --apply --enable-notifications
```

Sans `--apply` : simulation sans réseau. Sans `--enable-notifications` : seuls les sujets et contenus sont remplacés ; les états d’activation existants sont conservés. Le script sauvegarde les seuls champs concernés dans un dossier temporaire privé, applique les changements puis les relit. Conserver cette sauvegarde pour un retour arrière avec un PATCH des mêmes champs. Aucun réglage SMTP, URL, mot de passe, fournisseur ou MFA n’est modifié. Aucun email n’est envoyé par le script.

## Liens et parcours

- Configurer Site URL sur l’origine publique VOLTÉO, actuellement `https://volteo-4xj.pages.dev` (sans chemin final).
- Autoriser les retours exacts `/connexion` et `/connexion?recuperation=1` sur cette origine. L’app existante choisit le retour selon le parcours.
- Conserver `{{ .ConfirmationURL }}` entier : ne pas remplacer le lien par la page de connexion. Le flux actuel utilise PKCE ; ouvrir la récupération dans le navigateur à l’origine de la demande.
- Magic link et invitation sont prêts côté email ; ne pas activer un nouveau parcours de connexion sans tester son traitement par l’application. La réauthentification affiche `{{ .Token }}` et nécessite une interface qui accepte le code.
- La confirmation de changement d’email peut nécessiter les deux adresses selon la configuration Supabase.
- Aucune durée d’expiration arbitraire : les durées restent pilotées par Supabase.
- Vérifier séparément le domaine d’envoi, le SMTP et SPF/DKIM/DMARC. Désactiver la réécriture des liens / suivi des clics chez le prestataire SMTP. Ces fichiers ne configurent pas la délivrabilité.
- Les demandes d’essai, validations de concessions, devis et suivis commerciaux ne sont pas des événements Auth : ils nécessitent leur propre système transactionnel. Ce lot ne prétend pas les envoyer.

## Modification et vérification

Modifier `scripts/build-auth-emails.mjs`, puis :

```sh
node scripts/build-auth-emails.mjs
node --test tests/auth-emails.test.js
```

Vérifier les aperçus dans Supabase en largeur mobile et bureau. Effectuer ensuite, uniquement avec une adresse de test autorisée, les vrais parcours inscription/récupération/changement d’adresse. Les tests statiques ne prouvent ni la délivrabilité SMTP ni le rendu Outlook/Gmail réel.

Source officielle : https://supabase.com/docs/guides/auth/auth-email-templates
