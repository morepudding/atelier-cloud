# Atelier Cloud

Un poste de travail simulé pour apprendre Azure en réalisant des missions concrètes. Ce premier prototype contient un bureau, une application de tickets, un faux portail Azure et un carnet de notes.

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

- Bureau avec raccourcis, barre des tâches et fenêtres réductibles et agrandissables.
- Tickets : prise en charge, paramètres du projet, groupe joint, relevé de configuration et soumission.
- Portail : recherche globale, abonnements, accès, filtres, création, étiquettes modifiables, vue d’ensemble, notifications, activité et suppression confirmée des groupes vides de l’essai.
- Carnet et fiches sur les notions utiles, avec liens Microsoft Learn.
- Neuf critères calculés depuis l’inventaire courant ; erreurs techniques distinctes des écarts au ticket.
- Trois niveaux d’indices et bilan de compréhension avec correction et nouvel essai.
- Variante SuiviInterventions, isolée de la mission principale.

Le [scénario détaillé de la mission 1](docs/mission-1.md) décrit le ticket, les actions et les critères.

## Sauvegarde et simulation

L’état est sauvegardé dans le navigateur sous `atelier-cloud.workspace.v1`. Les brouillons, opérations en cours, ressources, notes, indices et réponses peuvent être retrouvés après rechargement. La sauvegarde est propre à ce navigateur et à cette adresse ; elle n’est pas synchronisée entre appareils.

Tout le domaine Azure est simulé. L’application ne se connecte pas à un abonnement Azure. Les jeux de données sont fictifs ; aucune clé de service ni variable d’environnement n’est nécessaire.

Les polices et icônes sont livrées avec l’application. Seuls les liens documentaires ouverts volontairement quittent le site.

## Organisation du code

`src/domain/` contient le scénario, les règles, le réducteur d’état et la validation des sauvegardes. `src/components/` contient les applications du bureau et les dialogues. `WorkspaceContext.tsx` orchestre la sauvegarde et la reprise des créations.

Les tests du domaine couvrent notamment les droits, les doublons, la casse, les corrections, les comptes rendus périmés et la reprise de progression. Les tests d’interface utilisent React Testing Library et jsdom pour parcourir les composants depuis le ticket jusqu’à la réussite.

## GitHub et Vercel

Le dépôt est `morepudding/atelier-cloud`. Le projet Vercel utilise le framework Vite, `npm ci`, la commande `npm run build` et le répertoire de sortie `dist`.

L’intégration Git Vercel relie les mises à jour de la branche `main` au déploiement. Les autres missions du parcours seront ajoutées progressivement.
