# Préparation au lancement — audit du 11 octobre 2026

## État constaté

- Site joignable : https://volteo-4xj.pages.dev/ ; `robots.txt` interdit actuellement l’indexation. Ce n’est pas un problème de sitemap à contourner avant la préparation commerciale.
- Base Supabase : 17 tables métier avec RLS activée, 37 fiches chiffrées, aucun partenaire vérifié, aucune offre publiée, un administrateur. Comptages effectués sans exporter de coordonnées.
- Advisor sécurité : protection contre les mots de passe compromis désactivée. Aucun autre avertissement de sécurité retourné lors de ce contrôle. Cela ne constitue pas un audit indépendant exhaustif.
- Les simulations, consentements, restrictions par concession, sessions révoquées et droits sont couverts par les tests PostgreSQL locaux. Les emails et réponses de vrais professionnels n’ont pas été testés de bout en bout.
- 78 modèles illustrés ; les fiches de découverte restent séparées des calculs. Les données historiques sont toujours indicatives : aucun tarif constructeur n’a été prétendu vérifié lors de cet audit.

## Changements livrés

- Politique CSP appliquée au build Cloudflare, scripts limités aux origines explicitement prévues, interdiction d’intégration en iframe, réduction des informations de provenance envoyées à d’autres sites, restriction caméra/microphone.
- Onglet administrateur « Préparer le lancement » : partenaires et offres effectivement actifs, contrôles de provenance par véhicule et actions d’exploitation restantes. Les champs présents ne sont jamais assimilés à une validation humaine.
- Formulaire de démonstration d’essai limité au développement local dans l’interface. Les anciennes données de démonstration restent identifiées dans le suivi ; aucune suppression de données existantes.
- Workflow GitHub : tests unitaires et droits PostgreSQL, build, SEO, présence des photos, exclusions des pages de démonstration et recherche de motifs de clés privées. Ce contrôle de motifs ne remplace pas un scanner de secrets exhaustif.
- Les contrôles GitHub signalent un échec ; ils ne constituent pas à eux seuls une règle de protection de branche ni une dépendance du build Cloudflare. Configurer ces règles dans les services d’hébergement si nécessaire.

## Ce qui nécessite l’exploitant ou des accès supplémentaires

1. **Identité de l’éditeur et contact** : fournir les mentions exactes ; décider des durées de conservation et du traitement des demandes. Ne pas inventer de société, de SIRET ou de contact.
2. **Comptes de démonstration** : remplacer les mots de passe par des accès nominatifs robustes, activer la protection contre les mots de passe compromis dans Supabase et vérifier les sessions. Aucune rotation aveugle n’a été effectuée pour éviter de bloquer l’unique administrateur sans canal de récupération confirmé.
3. **Auth/email** : confirmer le domaine autorisé, l’expéditeur SMTP et effectuer une réception réelle d’inscription/récupération avec une adresse contrôlée. Les outils disponibles ici n’exposent pas la configuration Auth/SMTP. Aucun email de test n’a été envoyé.
4. **Partenaires réels** : obtenir leur accord et vérifier identité, établissement, interlocuteur, marques, territoire et délai de réponse. Documenter la preuve avant le passage au statut vérifié. Les installateurs de bornes/solaire restent un réseau en préparation, sans transmission automatique.
5. **Données véhicules** : sélectionner version, batterie et millésime ; relever prix TTC hors aides, WLTP, consommation et recharge depuis une source officielle datée. Vérifier l’ensemble avant une intégration aux calculs. Le tableau admin liste les manques, il n’invente aucune valeur.
6. **Exploitation** : confirmer sauvegardes et restauration, surveillance, responsable des incidents et des demandes clients.
7. **Acquisition** : choisir le domaine définitif, renseigner VITE_SITE_URL, finaliser les mentions puis contrôler Search Console. Configurer les identifiants GA4/Ads et valider consentement et conversion. N’acheter du trafic qu’avec une offre réellement disponible et un budget approuvé.

## Recette pilote à effectuer avec un partenaire consentant

Créer un compte acheteur dédié au test, préparer et enregistrer le passeport, choisir une offre active, autoriser la transmission à ce seul établissement, vérifier la demande dans son portail, convenir du créneau, consulter la réponse côté acheteur, tester annulation et suppression. Confirmer le canal de notification et le délai convenu : le produit ne promet actuellement aucun email automatique d’essai. Aucun achat, recrutement ou message à un professionnel n’est déclenché par les tests automatisés.

## Vérifications reproductibles

```sh
npm ci
npm test
npm run build
node tests/seo-build.mjs
node scripts/check-release.mjs
```

Référence de l’avertissement Auth : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Disponibilités du catalogue
Depuis Stock et offres, les concessions rattachées à un établissement vérifié du pilote peuvent déclarer les modèles illustrés de leurs marques validées. Une déclaration par établissement et modèle précise la version, le délai et une référence interne non publique. Elle expire au bout de sept jours ; reconfirmation et retrait sont explicites. La suspension du partenaire masque ses déclarations. Les modèles de découverte restent exclus des simulations et des scores. Aucun stock réel n’est créé automatiquement.
