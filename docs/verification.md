# Vérification du prototype

Vérifications du 2 novembre 2026.

## Contrôles exécutés

Le contrôle TypeScript et la compilation Vite de production passent. Les 34 tests passent : 30 cas du domaine et 4 parcours d’interface avec React Testing Library et jsdom.

Les parcours d’interface couvrent :

- La prise en charge du ticket, la création avec les quatre étiquettes, le compte rendu, les trois réponses du bilan, la réussite et sa reprise après remontage de l’application.
- La création avec étiquettes manquantes, le signalement dans le ticket, la correction dans le portail et la nouvelle soumission.
- Le refus de création en PRD, la conservation du brouillon entre applications et la prise de notes.
- Les indices, la réduction de fenêtre et la réinitialisation après confirmation.

Les tests du domaine couvrent aussi les doublons et la casse, les droits sur les opérations, la préservation de l’inventaire, la correction de région, le compte rendu obsolète, la reprise d’une création en cours sans doublon, les sauvegardes corrompues et l’isolation de la variante.

## Portée des vérifications

Les tests d’interface manipulent les composants dans un DOM simulé. Ils valident les interactions et les changements d’état. Le rendu graphique, les dimensions des fenêtres et les interactions dans un navigateur réel restent à contrôler visuellement.

La progression est locale au navigateur et à l’origine du site. Il n’y a pas de synchronisation distante ou de connexion à un véritable compte Azure.
