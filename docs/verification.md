# Vérification du prototype

Vérifications du 2 novembre 2026.

## Contrôles exécutés

Le contrôle TypeScript et la compilation Vite de production passent. Les 36 tests passent : 31 cas du domaine et 5 parcours d’interface avec React Testing Library et jsdom.

Les parcours d’interface couvrent :

- La prise en charge du ticket, la création avec les quatre étiquettes, le compte rendu, les trois réponses du bilan, la réussite et sa reprise après remontage de l’application.
- La création avec étiquettes manquantes, le signalement dans le ticket, la correction dans le portail et la nouvelle soumission.
- Le refus de création en PRD, la conservation du brouillon entre applications et la prise de notes.
- Les indices, la réduction de fenêtre et la réinitialisation après confirmation.
- La présence d’un seul encadré pédagogique, sa réduction entre outils et après rechargement, et la reprise des anciennes sauvegardes.

Les tests du domaine couvrent aussi les doublons et la casse, les droits sur les opérations, la préservation de l’inventaire, la correction de région, le compte rendu obsolète, la reprise d’une création en cours sans doublon, les sauvegardes corrompues et l’isolation de la variante.

## Portée des vérifications

Le premier déploiement Vercel a atteint l’état READY depuis le commit 2bdfc8458d007d7ec53b3cf46ce4f8c03164f25d. L’adresse https://atelier-cloud-ten.vercel.app/ répond en HTTP 200. Les fichiers JavaScript et CSS récupérés à cette adresse ont les mêmes empreintes SHA-256 que ceux de la compilation locale vérifiée.

Les tests d’interface manipulent les composants dans un DOM simulé. Ils valident les interactions et les changements d’état.

La présentation immersive a également été contrôlée dans un navigateur réel : portail et moniteur couvrant toute la fenêtre, encadré unique, réduction conservée après rechargement, navigation entre outils et mission terminée avec 9 critères validés. Aucun avertissement ni erreur de console n’a été observé.

Le contrôle sur un écran de 390 par 844 pixels confirme l’absence de débordement horizontal, l’occupation de toute la fenêtre par les deux surfaces et la présence d’un seul encadré réductible.

La progression est locale au navigateur et à l’origine du site. Il n’y a pas de synchronisation distante ou de connexion à un véritable compte Azure.
