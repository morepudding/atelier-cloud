# Atelier Cloud

Un poste de travail simulé pour apprendre Azure en réalisant des missions concrètes. Le portail Azure remplit la fenêtre. Pour les autres outils, le moniteur affiche le bureau, les tickets et le carnet. Un seul petit encadré pédagogique reste en bas à droite sur les deux surfaces.

[Lancer le prototype sur Vercel](https://atelier-cloud-ten.vercel.app/)

La mission 1 est jouable jusqu’à sa résolution : lire DEM-001, préparer le groupe de ressources DEV de DemandesEtude, corriger sa configuration, soumettre le compte rendu et terminer trois mises en situation.

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

`check` exécute le contrôle TypeScript et les tests. `build` exécute aussi ces vérifications avant de produire `dist/`.

## Parcours disponible

- Portail Azure en plein écran et moniteur du poste de travail en plein écran.
- Encadré de mission réductible avec ticket, indices, critères, bilan et options ; la réduction est conservée entre outils et après rechargement.
- Nora, professeure et collègue cloud : introduction en trois répliques, contexte du projet, problème à résoudre et consignes adaptées à l’état réel de la mission.
- Introduction rejouable dans les options, reprise à la dernière réplique et lecture vocale facultative avec le bouton « Écouter Nora ».
- « Pourquoi ces étiquettes ? » compare les valeurs du groupe à leur usage : retrouver l’application, classer l’environnement, identifier l’équipe responsable et préparer le suivi budgétaire. Un exemple d’erreur est consultable sans changer le travail.
- « Corriger / revenir en arrière » nomme les groupes qui bloquent la mission, compare leurs valeurs actuelles et initiales et propose la restauration des groupes préexistants.
- Historique des 20 dernières créations, modifications d’étiquettes, suppressions et restaurations, avec annulation et rétablissement conservés après rechargement.
- Bureau avec raccourcis, barre des tâches et fenêtres réductibles et agrandissables pour les autres applications.
- Tickets : prise en charge, paramètres du projet, groupe joint, relevé de configuration et soumission.
- Portail : recherche globale, abonnements, accès, filtres, création, étiquettes modifiables, vue d’ensemble, notifications, activité et suppression confirmée des groupes vides de l’essai.
- Carnet et fiches sur les notions utiles, avec liens Microsoft Learn.
- Neuf critères calculés depuis l’inventaire courant ; erreurs techniques distinctes des écarts au ticket.
- Trois niveaux d’indices et bilan de compréhension dans le même encadré, avec correction et nouvel essai.
- Variante SuiviInterventions, isolée de la mission principale.

Le [scénario détaillé de la mission 1](docs/mission-1.md) décrit le ticket, les actions et les critères.

## Sauvegarde et simulation

L’état est sauvegardé dans le navigateur sous `atelier-cloud.workspace.v1`. Les brouillons, opérations en cours, ressources, notes, indices, réponses et répliques d’introduction peuvent être retrouvés après rechargement. Les anciennes missions en cours reprennent avec Nora sans imposer le briefing ; il reste rejouable dans les options. La sauvegarde est propre à ce navigateur et à cette adresse ; elle n’est pas synchronisée entre appareils.

Tout le domaine Azure est simulé. L’application ne se connecte pas à un abonnement Azure. Les jeux de données sont fictifs ; aucune clé de service ni variable d’environnement n’est nécessaire.

Les polices et icônes sont livrées avec l’application. Seuls les liens documentaires ouverts volontairement quittent le site.

Les dialogues de Nora sont scénarisés. Ses consignes suivent la configuration courante, sans exécuter les manipulations ni imposer un ordre de clics. La voix utilise la synthèse vocale disponible dans le navigateur, sur demande uniquement ; sa disponibilité et son timbre dépendent de l’appareil. Le texte reste toujours disponible. Aucun service de conversation IA ou vidéo n’est nécessaire à cette version.

Modifier les étiquettes du groupe DEV demandé ne fait pas échouer « Inventaire préservé ». Ce critère signale les groupes initiaux modifiés ou absents et les groupes supplémentaires. Le compte rendu doit être soumis à nouveau si la configuration de son groupe a changé. Les actions du contrôle permettent d’ouvrir directement la correction, le ticket ou le bilan, y compris pour reprendre une ancienne sauvegarde sans historique.

## Organisation du code

`src/domain/` contient le scénario, les règles, le réducteur d’état et la validation des sauvegardes. `src/components/` contient les applications du bureau et les dialogues. `WorkspaceContext.tsx` orchestre la sauvegarde et la reprise des créations.

Les tests du domaine couvrent notamment les droits, les doublons, la casse, les corrections, les comptes rendus périmés et la reprise de progression. Les tests d’interface utilisent React Testing Library et jsdom pour parcourir les composants depuis le ticket jusqu’à la réussite.

## GitHub et Vercel

Le dépôt est `morepudding/atelier-cloud`. Le projet Vercel utilise le framework Vite, `npm ci`, la commande `npm run build` et le répertoire de sortie `dist`.

L’intégration Git Vercel relie les mises à jour de la branche `main` au déploiement. Les autres missions du parcours seront ajoutées progressivement.
