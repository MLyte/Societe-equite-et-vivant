# Contribuer au projet

Société, équité et vivant est un projet de conception institutionnelle. Vos contributions peuvent améliorer sa clarté, sa cohérence, ses sources ou la prise en compte de ses limites. Une expertise professionnelle, un travail de recherche ou une expérience de terrain peuvent faire apparaître des effets oubliés.

## Comment participer

### Signaler une contradiction, apporter une source ou proposer une piste

Vous pouvez contribuer **sans modifier les fichiers du dépôt**. Un compte GitHub est nécessaire pour envoyer une proposition.

1. Consultez les [échanges existants](https://github.com/MLyte/Societe-equite-et-vivant/issues) pour vérifier si le sujet est déjà discuté.
2. [Ouvrez une proposition](https://github.com/MLyte/Societe-equite-et-vivant/issues/new). Sur GitHub, cet espace de discussion s’appelle une *issue*.
3. Indiquez le chapitre et le passage concernés, votre constat et les sources disponibles. Expliquez la correction ou l’alternative envisagée, ses limites et ses effets possibles sur d’autres parties du modèle.

Une proposition précise peut suffire : « Dans ce passage, l’hypothèse X semble incompatible avec Y. Voici une source et une formulation à discuter. » Une question argumentée est également utile lorsqu’une solution n’est pas encore identifiée.

### Proposer directement une modification du texte

Une *pull request* est une proposition de modification soumise à examen avant son intégration.

1. Créez votre copie du dépôt sur GitHub, appelée *fork*, puis une branche pour votre modification.
2. Modifiez le ou les fichiers concernés, en conservant leur structure et en citant les sources.
3. Ouvrez une pull request vers la branche `main` de ce dépôt. Présentez le problème, le changement proposé, ses raisons et les vérifications effectuées.

Privilégiez une modification ciblée. Lorsqu’un chapitre change sur le fond, mettez aussi à jour sa synthèse dans `vitrine.md` si elle est concernée. Incrémentez la version et actualisez la date des fichiers Markdown modifiés sur le fond lorsqu’ils possèdent ces métadonnées. Pour la vitrine, lancez `npm test` et `npm run build`.

Les propositions sont discutées avant intégration ; leur publication n’implique pas leur adoption par le projet.

---

## Contributions utiles

Vous pouvez notamment :

- reformuler un passage peu clair ;
- identifier une contradiction ;
- ajouter ou vérifier une source ;
- proposer une autre organisation institutionnelle ;
- documenter une objection ;
- tester le modèle face à un scénario historique ou hypothétique ;
- améliorer une définition du glossaire.

---

## Ce qu’il faut éviter

Évitez les contributions qui :

- transforment le projet en campagne politique ;
- présentent une intuition personnelle comme un fait établi ;
- ajoutent des affirmations factuelles sans source ;
- réécrivent plusieurs fichiers sans lien entre eux ;
- renforcent un pouvoir sans en examiner les risques et les contre-pouvoirs ;
- suppriment une incertitude simplement parce qu’elle est inconfortable.

---

## Format de rédaction

Écrivez en français, avec un ton sobre et précis. Lisez les [principes du projet](docs/02-principes.md) et le [guide de style](.blueprint/style-guide.md) avant une modification substantielle. La plupart des chapitres suivent cette structure :

```md
---
status: draft
version: "0.1"
last_updated: "YYYY-MM-DD"
confidence: "hypothesis"
---

# Titre

## Pourquoi ce document existe

## Constat actuel

## Objectifs

## Proposition

## Justification

## Alternatives étudiées

## Critiques

## Questions ouvertes

## Ce qui pourrait nous faire changer d'avis
```

---

## Niveaux de certitude

Pour une affirmation importante, distinguez :

- **Établi** : consensus solide ou résultat vérifié ;
- **Probable** : conclusion appuyée, mais encore discutée ;
- **Hypothèse** : proposition à mettre à l’épreuve ;
- **Question ouverte** : point non résolu.

N’inventez jamais de source. Si une référence nécessaire manque, signalez `[source à vérifier]`. La capacité de l’IA à formuler une proposition ne démontre ni sa neutralité ni la validité de ses effets.

---

## Exemples de messages de commit

```text
docs: clarifier le rôle du consortium scientifique
research: documenter une critique de la capture institutionnelle
fix: retirer une affirmation non étayée sur la neutralité de l’IA
docs: préciser les conditions d’une expérimentation
```
