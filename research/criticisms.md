# Critiques

Ce fichier documente les objections fortes contre Project Horizon.

L'objectif n'est pas de se défendre trop vite. L'objectif est de comprendre les failles possibles du modèle.

---

## Méthode de lecture

Une critique n'est pas considérée comme corrigée parce qu'un principe est énoncé.

Elle est considérée comme :

- **identifiée** lorsque le risque est nommé ;
- **atténuée** lorsqu'un garde-fou général existe ;
- **partiellement corrigée** lorsqu'une institution, une procédure, un responsable, un recours et une trace publique sont définis ;
- **non corrigée** lorsque le modèle ne permet pas encore de vérifier qui décide, qui contrôle, qui conteste et qui peut être sanctionné.

Cette grille évite de traiter l'IA, la science ou la planification comme neutres par nature.

---

## Critique 1 — Risque de technocratie autoritaire

Le modèle peut être perçu comme une confiscation du pouvoir démocratique par des experts.

### Décision retenue pour v0.1

Le modèle retient une séparation stricte des rôles : le consortium scientifique établit les contraintes, les responsables politiques choisissent et appliquent les trajectoires compatibles, les citoyens arbitrent les priorités sociales, et une justice indépendante peut suspendre une décision contraire aux droits fondamentaux.

### Mécanismes retenus

- Séparation explicite entre établissement des contraintes scientifiques, choix politiques, contrôle juridictionnel et arbitrage citoyen.
- Droit de recours individuel et collectif contre les décisions prises au nom d'un modèle validé.
- Contrôle parlementaire des usages d'urgence, avec durée limitée, justification publique et réexamen obligatoire.
- Assemblées citoyennes de révision sur les priorités sociales, sans pouvoir annuler les limites physiques établies.
- Publication des hypothèses, marges d'incertitude et alternatives rejetées.

### Statut

Partiellement corrigée par choix institutionnel. La v0.1 retient le principe de séparation des pouvoirs et de recours opposable ; il devra être repris dans le chapitre d'architecture.

---

## Critique 2 — Capture des scientifiques

Les scientifiques et institutions d'expertise peuvent être influencés par des intérêts privés, idéologiques ou nationaux.

### Décision retenue pour v0.1

Le modèle retient une double structure : un consortium scientifique produit les modèles validés, mais une autorité d'audit scientifique et algorithmique distincte contrôle les données, méthodes, conflits d'intérêts et désaccords minoritaires.

### Mécanismes retenus

- Déclaration publique des financements, intérêts, affiliations et désaccords minoritaires.
- Rotation des membres du consortium scientifique, avec règles de révocation documentées.
- Audits indépendants des modèles, données et hypothèses, publiés dans un registre accessible.
- Protection explicite des lanceurs d'alerte scientifiques et administratifs.
- Financement public pluriannuel des fonctions critiques, afin de réduire la dépendance à des acteurs privés intéressés.

### Statut

Partiellement corrigée par choix institutionnel. Le modèle retient un auditeur séparé du producteur d'expertise ; ses pouvoirs exacts devront être formalisés.

---

## Critique 3 — L'IA n'est pas neutre

L'IA dépend des données, objectifs, contraintes et institutions qui la produisent.

### Décision retenue pour v0.1

L'IA publique est retenue comme outil d'analyse, de simulation et de comparaison. Elle ne peut pas produire seule une décision souveraine, ni remplacer une justification humaine.

### Mécanismes retenus

- Interdiction de déléguer une décision souveraine à un système automatisé.
- Journal public des versions, objectifs, données principales, limites connues et modifications importantes.
- Audit externe régulier des biais, erreurs, performances et effets sociaux.
- Droit à une explication humaine lorsqu'une décision publique s'appuie sur une sortie d'IA.
- Interdiction du scoring citoyen généralisé.

### Statut

Corrigée comme principe de souveraineté. Partiellement corrigée comme procédure, car les modalités d'audit et de recours doivent encore être écrites.

---

## Critique 4 — Le socle vital peut devenir un rationnement humiliant

Garantir le minimum peut créer une vie standardisée ou pauvre si le socle est trop bas.

### Décision retenue pour v0.1

Le socle vital doit être un droit opposable, non une aide discrétionnaire. Il doit garantir une vie digne, pas seulement une survie matérielle minimale.

### Mécanismes retenus

- Définition opposable du socle vital, avec seuils minimaux publics et révisables pour chaque composante.
- Procédure de contestation lorsqu'une personne ou un territoire reçoit un accès insuffisant.
- Révision périodique du socle par expertise, délibération citoyenne et contrôle des droits fondamentaux.
- Interdiction d'utiliser le socle vital comme sanction morale ou instrument de discipline sociale.
- Distinction claire entre sobriété écologique et pauvreté imposée.

### Statut

Partiellement corrigée par choix social. La v0.1 retient le socle vital comme droit opposable ; les seuils chiffrés devront être définis dans un document dédié.

---

## Critique 5 — La complexité institutionnelle peut tuer la lisibilité

Un modèle trop complexe peut devenir impossible à comprendre, donc impossible à contrôler.

### Décision retenue pour v0.1

La lisibilité devient une contrainte institutionnelle, pas seulement un effort de communication. Une décision publique importante doit permettre d'identifier rapidement qui propose, qui valide, qui applique, qui contrôle et qui peut annuler.

### Mécanismes retenus

- Cartographie publique des responsabilités : qui propose, qui valide, qui applique, qui contrôle et qui peut annuler.
- Procédures courtes pour les recours les plus fréquents.
- Versions lisibles des décisions importantes, séparées des annexes techniques.
- Indicateurs publics limités en nombre, avec définitions stables.
- Évaluation régulière de la compréhension citoyenne du système.

### Statut

Partiellement corrigée par règle de conception. La v0.1 retient la cartographie des responsabilités comme exigence minimale.

---

## Critique 6 — La planification sectorielle peut devenir descendante

Un plan sectoriel peut être rigoureux sur les flux physiques et économiques, tout en restant insuffisant sur la légitimité démocratique des arbitrages.

Le Plan de transformation de l'économie française du Shift Project est un exemple utile de structuration sectorielle : il présente une trajectoire de baisse des émissions de gaz à effet de serre de 5 % par an et organise ses propositions autour de 15 secteurs ([source](https://ilnousfautunplan.fr/)). Mais ce type d'approche ne règle pas, à lui seul, la question de savoir qui arbitre les pertes, les contraintes, les priorités territoriales et les conflits de valeurs.

### Décision retenue pour v0.1

Project Horizon retient la planification sectorielle comme méthode de diagnostic, mais pas comme source suffisante de légitimité. Chaque plan sectoriel doit être accompagné d'une délibération sur ses effets sociaux, territoriaux et professionnels.

### Mécanismes retenus

- Séparer les diagnostics sectoriels des choix de justice sociale qu'ils impliquent.
- Publier les effets attendus par secteur, territoire, revenu et catégorie professionnelle lorsque c'est possible.
- Prévoir des contre-propositions citoyennes ou territoriales compatibles avec les contraintes physiques.
- Justifier les arbitrages entre efficacité, équité, libertés et soutenabilité.
- Réviser les plans lorsque les hypothèses matérielles, sociales ou démocratiques changent.

### Statut

Partiellement corrigée par choix démocratique. La v0.1 retient le plan sectoriel comme outil technique soumis à arbitrage citoyen, recours et révision.
