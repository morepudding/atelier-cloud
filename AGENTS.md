# Atelier Cloud

## Présentation validée par Romain

- Le portail Azure occupe toute la fenêtre, comme dans la maquette validée le 2 novembre 2026.
- Lorsque le portail est ouvert, afficher uniquement son interface native et le petit encadré de mission en bas à droite. Aucun cadre de navigateur simulé, bandeau de formation, colonne de cours ou pied de page autour du portail.
- Pour les autres outils, le moniteur du poste de travail simulé occupe toute la fenêtre : bureau, barre des tâches et fenêtres des applications.
- Conserver un seul encadré pédagogique sur les deux surfaces. Il est réductible et contient les actions du ticket, les indices, les critères, le bilan et les options de mission.
- Les vues pédagogiques s’ouvrent dans cet encadré. Les dialogues natifs d’une application, comme la confirmation de suppression d’un groupe Azure, restent possibles.
- Nora, la professeure du parcours, présente le contexte et le problème dans cet encadré, puis donne la prochaine consigne en fonction de l’état réel. Le briefing reste rejouable et ne doit pas effacer une mission en cours.
- Adapter les champs et la zone de défilement afin que l’encadré ne bloque pas les actions nécessaires, notamment sur les écrans courts et mobiles.

## Progression et validation

- Préserver les anciennes sauvegardes et les parcours existants lors des évolutions de présentation.
- La validation dépend de l’inventaire courant, du compte rendu et de la compréhension, sans imposer un ordre de clics.
- Tout le domaine Azure est simulé. Conserver uniquement des données fictives.
- Exécuter les vérifications pertinentes avec npm run build. Cette commande inclut TypeScript, les tests et la compilation Vite.
- Pour une modification visible, vérifier aussi le rendu et le parcours dans un navigateur réel.

## Publication

Le dépôt est morepudding/atelier-cloud. Un push sur main déclenche le déploiement automatique du projet Vercel atelier-cloud. Respecter le périmètre autorisé par l’utilisateur et vérifier le diff avant publication.
