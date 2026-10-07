# Sécurité de VOLTÉO 4.6

Cette note remplace les descriptions de sécurité SQLite des versions précédentes. Ce travail n’est pas un audit externe ni une certification.

## Contrôles appliqués

- Authentification et hachage des mots de passe confiés à Supabase Auth. Sessions persistantes dans le stockage local du navigateur, renouvelées par le SDK ; elles ne sont plus des cookies HttpOnly locaux.
- L’application n’embarque qu’une clé publique publishable. La clé privilégiée existe uniquement dans l’environnement de l’Edge Function fourni par Supabase.
- Toutes les tables métier sont dans un schéma privé, avec RLS activée, politiques de refus explicite et aucun droit de lecture/écriture direct pour `anon` ou `authenticated`.
- L’API publique invoque une fonction privée transactionnelle. Cette fonction utilise des privilèges contrôlés pour effectuer les opérations métier après vérification de l’identité, de la session encore présente dans Auth, du rôle en base et de la propriété des données. Elle n’accepte ni SQL arbitraire ni nom de table du client.
- Une inscription publique crée seulement un acheteur ou un professionnel en attente, sans affectation à une concession. Les métadonnées Auth ne peuvent jamais attribuer le rôle dealer/admin.
- Les acheteurs accèdent à leurs propres dossiers. Les concessionnaires n’accèdent qu’aux demandes de leur concession. Les bilans non partagés et les codes de présence sont filtrés côté serveur, y compris dans les tableaux de bord.
- Consentements explicites, validation des offres actives, copie du passeport uniquement sur accord, fenêtre de présence et limite de tentatives sur les codes.
- Contrôle des mises à jour concurrentes par révision, transactions et verrouillage des lignes. Les erreurs annulent les modifications métier, mais conservent les compteurs de tentatives échouées.
- Suppression de compte : vérification du JWT par Auth, contrôle de la session active, nouvelle vérification du mot de passe, fermeture des sessions puis suppression Auth et cascade des données liées.
- Le mot de passe modifié est suivi d’une déconnexion globale. Les jetons d’une session révoquée sont refusés par l’API métier sans attendre leur expiration.
- Le cache du navigateur ne contient que le catalogue, les concessions et les guides publics. Les dossiers ne sont pas mis dans ce cache.
- Les recherches géographiques sont limitées côté fonction/base ; les URL externes sont fixées par le serveur. La commune d’inscription est validée à partir de la source officielle, pas à partir de coordonnées déclarées par le client.

## Réglages restant liés à l’exploitation

- Domaine HTTPS, redirections Auth et expéditeur SMTP à configurer avant les inscriptions publiques.
- Minimum de mot de passe côté Supabase à aligner sur les 12 caractères du formulaire. Activer la protection contre les mots de passe compromis : l’advisor la signale désactivée.
- Sauvegardes, restauration, surveillance des erreurs, conservation des données et mentions du responsable à définir pour le service réel.
- Aucun envoi automatique de notification d’essai, aucune campagne Meta/Google et aucun paiement n’est activé.
- Conserver une CSP stricte et maîtriser les scripts tiers : les jetons de session stockés dans le navigateur seraient exposés en cas de faille XSS.

Référence du signalement Auth : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
