# Entretenir et publier la vitrine

La vitrine est générée depuis `vitrine.md`. Les chapitres restent les sources de
référence. La publication est automatique ; la rédaction des synthèses reste
éditoriale. Le HTML contient tous les textes, même sans JavaScript.

## Développement

Avec Node.js 24 : `npm ci`, puis `npm run dev`. Pour contrôler la version publiée :
`npm test`, `npm run build`, puis `npm run preview`. La page est disponible sous
`/societe-equite-vivant/`. Le dossier `vitrine/` contient seulement les fichiers à
héberger. Tailwind, Preline UI et la police Fraunces sont compilés et servis
localement ; le serveur public n'a pas besoin de Node.js.

## Contrat éditorial

- Conserver les sept sections, leur ordre et les blocs thématiques.
- Maintenir 650 à 1 400 mots dans le contenu principal affiché : hero, synthèses, encart de contribution et inspirations compris. Le générateur compte le HTML final, sans les icônes ni les commentaires, plutôt que le seul corps Markdown.
- Les durées sont recalculées à chaque génération : lecture rapide des titres, passages en gras et citation mise en avant (repère de 250 mots/minute), puis lecture complète (200 mots/minute), arrondies à la minute supérieure. Ces estimations excluent leur propre libellé, la navigation, le footer et les documents ouverts par les liens ; elles ne garantissent pas un temps individuel de lecture.
- Après « Pourquoi ? » et « Comment ? », ajouter « Quoi ? » uniquement pour préciser un mécanisme du projet documenté dans la source. Ce troisième paragraphe est facultatif ; éviter de répéter le « Comment ? ».
- Garder les questions pour les propositions, les responsabilités, l’IA et les étapes de conception. L’origine de la démarche et l’invitation à contribuer peuvent utiliser des paragraphes simples.
- L’encart après les étapes oriente vers la section de contribution. Celle-ci distingue le signalement d’une piste sur GitHub et le guide en français pour modifier les textes.
- Revoir les synthèses concernées quand les chapitres sources changent sur le fond.
- Maintenir les liens relatifs vers les sources : ils deviennent des liens GitHub
  sur `main`. Le générateur vérifie les fichiers et les ancres locales.
- Publier les chapitres révisés et le guide `CONTRIBUTING.md` sur `main` avec les changements de la vitrine. Transférer seulement `vitrine/` ne met pas à jour les documents consultés sur GitHub.
- Les liens internes vers les sections restent dans la page ; les liens GitHub et les sources externes s’ouvrent dans un nouvel onglet.
- Pour un constat externe, dater la donnée, distinguer observation et interprétation,
  puis enregistrer la référence vérifiée dans `externalSources` de `vitrine.mjs`.
- Privilégier les constats européens, puis internationaux lorsque pertinents.
  Préciser le périmètre (Union européenne, pays de l’OCDE étudiés, monde) et l’année ;
  ne pas généraliser une moyenne à tous les pays. La Belgique peut éclairer l’origine de la démarche.
- Conserver les réserves, le conditionnel et la distinction entre orientations
  retenues et effets non démontrés. Ne pas promettre un résultat établi.
- Incrémenter `version` et actualiser `last_updated` lors d'une modification de
  fond de `vitrine.md`. La date affichée vient de ce champ, pas de la compilation.
- Un nouveau chapitre ne crée pas automatiquement un bloc dans la vitrine.

La compilation bloque les sources absentes, la structure invalide, le HTML brut,
les dates invalides et les textes hors budget. La fidélité sémantique aux chapitres
requiert toujours une relecture humaine ; ces contrôles ne la prouvent pas.

## Raccordement à mathieuluyten.be

Le workflow vérifie chaque pull request et chaque publication sur `main`, puis
conserve l'artefact `vitrine`. La publication distante est initialement désactivée.

1. Confirmer auprès de l'hébergement l'accès SFTP sur le port 22, l'empreinte de
   la clé SSH et le chemin du répertoire dédié. Le 9 septembre 2026, le serveur
   indiqué par les scripts existants (`ftp.cluster121.hosting.ovh.net`) répond
   en SSH ; il refuse `AUTH TLS` en FTP. L'accès SFTP authentifié et le chemin
   restent à vérifier. `/www` est la racine FTP indiquée dans les scripts locaux ;
   le chemin SFTP peut différer.
2. Créer l'environnement GitHub `vitrine` et ses secrets `DEPLOY_HOST`,
   `DEPLOY_USER`, `DEPLOY_PASSWORD`, `DEPLOY_REMOTE_DIR`, `DEPLOY_HOST_SHA256`.
   L'empreinte SHA-256 attendue est en hexadécimal (64 caractères), à obtenir par
   un canal de confiance auprès de l'hébergeur ; ne pas accepter aveuglément une
   clé collectée sur le réseau. Exemple de destination à confirmer :
   `/www/societe-equite-vivant`. Ne jamais placer ces valeurs dans le dépôt ni
   désactiver la vérification de la clé SSH.
3. Définir la variable de **dépôt** `VITRINE_DEPLOY_ENABLED` à `true` après cette
   vérification. Lancer le workflow manuellement sur `main` pour le premier envoi.
4. Contrôler la page à `https://mathieuluyten.be/societe-equite-vivant/`, sa date,
   ses assets et ses liens. Les prochains push sur `main` la republieront.

Le déploiement dépend de la réussite des tests et de la compilation. Les pull
requests ne reçoivent pas les secrets. Le transfert est limité au répertoire
dédié ; il ne supprime aucun fichier distant. Les assets sont envoyés avant
`index.next.html`, renommé en `index.html` en dernière opération. Vérifier que
l'hébergement autorise l'extension OpenSSH `posix-rename` lors du premier envoi.
Un échec de transfert avant cette opération conserve la page précédente.

Pour suspendre la publication, mettre `VITRINE_DEPLOY_ENABLED` à `false`. Pour
revenir à un contenu précédent, rétablir le commit concerné puis republier. Les
anciens assets restent disponibles ; leur nettoyage éventuel est manuel et limité
au répertoire de cette vitrine.

## Bibliothèques

Les composants s'appuient sur Preline UI (licences MIT et Preline UI Fair Use),
Tailwind CSS et Vite. Fraunces est distribuée par Fontsource sous SIL OFL.
Leurs licences propres restent applicables ; la licence du contenu du projet
reste CC BY 4.0.
