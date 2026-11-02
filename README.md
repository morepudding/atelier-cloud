# Atelier Cloud

Un poste de travail simulé pour pratiquer Azure à partir de problèmes applicatifs. Le portail Azure remplit la fenêtre. Les autres outils s’ouvrent dans le moniteur du poste de travail. Un seul encadré de Nora, réductible, accompagne les deux surfaces.

[Ouvrir le parcours sur Vercel](https://atelier-cloud-ten.vercel.app/)

## Premier mini-parcours V2 : application indisponible

DemandesEtude fonctionne déjà. Nora explique la relation entre groupe de ressources, plan App Service et Web App, puis montre l’effet d’un arrêt et d’un démarrage sur une application d’exemple séparée de l’atelier.

L’apprenant fait une prédiction, reproduit l’expérience sur DemandesEtude et vérifie la réponse et la version côté client. Il traite ensuite une autre application arrêtée, avec des noms et un contexte différents, sans procédure complète. Les personnes qui connaissent déjà la notion peuvent commencer directement par ce cas.

- Le client affiche réellement les conséquences du monde simulé : réponse 200, application arrêtée ou opération en cours. Une page déjà chargée garde son contenu jusqu’à une nouvelle requête.
- Le portail comprend la recherche globale, les listes de services, groupes et plans, les vues d’ensemble, les propriétés, le Centre de déploiement et l’activité de gestion.
- Les opérations prennent un court délai, survivent au rechargement et conservent le code déployé.
- Les explications erronées reçoivent une correction ciblée. Trois indices progressifs et une reprise de l’explication restent disponibles.
- Le bilan distingue « Réalisé avec aide » et « Démontré en autonomie sur ce cas », selon les observations, l’explication et l’aide reçue. Visiter un écran ou obtenir un bon état ne suffit pas.
- Le carnet, les preuves terminées et la réduction de l’encadré sont conservés. Rejouer le cours recommence le monde sans effacer le carnet ni les preuves précédentes.

Ce premier lot porte sur l’exécution et le rétablissement d’une application déjà déployée. La création et la publication d’une application restent à construire. Le bilan les indique comme non abordées. Le [contrat pédagogique](docs/refonte-pedagogique.md) décrit la suite et les limites des preuves recueillies.

## Ancien exercice de groupes de ressources

L’exercice DEM-001 reste disponible via **Options du parcours → Reprendre l’ancien exercice**, ou avec [ce lien direct](https://atelier-cloud-ten.vercel.app/?parcours=groupes). Il conserve le ticket, la création et les étiquettes du groupe DEV, les corrections, les annulations, le compte rendu et les trois situations du bilan. Ses validations ne deviennent pas des preuves V2.

Le [scénario V1 détaillé](docs/mission-1.md) reste consultable. Une option de cet exercice permet de revenir au nouveau parcours.

## Démarrer

Node.js 22.22.2, 24.15 ou une version compatible plus récente, et npm sont nécessaires.

```sh
npm ci
npm run dev
```

Le serveur local utilise `http://127.0.0.1:5179`.

```sh
npm run check
npm run build
npm run preview
```

`check` exécute TypeScript et les tests. `build` ajoute la compilation Vite de production. Les [vérifications](docs/verification.md) distinguent tests logiciels, parcours dans le navigateur et test d’apprentissage à effectuer avec Romain.

## Sauvegarde et simulation

La V2 utilise `atelier-cloud.learning.v2`, distinct de `atelier-cloud.workspace.v1`. Ouvrir la V2 ne modifie pas la sauvegarde V1. Les mondes, essais, niveaux d’aide, preuves, notes et opérations en cours reprennent après rechargement. Une sauvegarde illisible est conservée à part avant d’ouvrir un nouvel atelier.

Les sauvegardes restent propres au navigateur et à l’origine du site ; elles ne sont pas synchronisées entre appareils. Les 30 derniers essais et preuves sont conservés. L’historique technique du monde est borné à 400 événements.

Tout le domaine Azure et les dépôts du scénario sont fictifs. Aucune commande n’est envoyée à Azure ou GitHub pendant la mission. Aucune clé ni variable d’environnement n’est nécessaire. Les polices et les icônes sont livrées avec l’application.

Les dialogues de Nora sont scénarisés et suivent les observations du monde. Sa voix utilise la synthèse vocale du navigateur, sur demande. Le texte reste disponible ; le timbre et la disponibilité de la voix dépendent de l’appareil. Aucun service de conversation IA ni de vidéo n’est requis.

## Organisation du code

`src/learning/world.ts` contient le monde V2 et ses opérations. `teaching.ts` extrait les preuves causales ; `reducer.ts` gère les séquences, tentatives et aides. `persistence.ts` valide les sauvegardes. `LearningContext.tsx` orchestre persistance, observations visibles et reprise des opérations. `src/learning/ui/` contient le portail, le poste de travail et l’encadré de Nora.

La V1 reste dans `src/domain/`, `src/components/` et `WorkspaceContext.tsx`. `App.tsx` gère le choix des parcours. Les tests couvrent les deux versions, la séparation des sauvegardes et les changements de parcours.

## GitHub et Vercel

Le dépôt est `morepudding/atelier-cloud`. Vercel utilise le framework Vite, `npm ci`, `npm run build` et le répertoire `dist`. Un push sur `main` déclenche automatiquement la publication.
