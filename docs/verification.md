# Vérification du prototype

Vérifications du 2 novembre 2026.

## Contrôles exécutés

Le contrôle TypeScript et la compilation Vite de production passent. Les 56 tests passent : 46 cas du domaine et 10 parcours d’interface avec React Testing Library et jsdom.

Les parcours d’interface couvrent :

- La prise en charge du ticket, la création avec les quatre étiquettes, le compte rendu, les trois réponses du bilan, la réussite et sa reprise après remontage de l’application.
- La création avec étiquettes manquantes, le signalement dans le ticket, la correction dans le portail et la nouvelle soumission.
- Le refus de création en PRD, la conservation du brouillon entre applications et la prise de notes.
- Les indices, la réduction de fenêtre et la réinitialisation après confirmation.
- La présence d’un seul encadré pédagogique, sa réduction entre outils et après rechargement, et la reprise des anciennes sauvegardes.
- Le briefing en trois répliques de Nora, sa reprise après remontage, son rejeu sans effacer le brouillon et son redémarrage lors d’un nouvel essai.
- Les consignes qui évoluent du ticket au formulaire, la narration sur demande et son annulation au changement de réplique ou à la réduction de l’encadré.
- La reprise d’une ancienne mission à 6/9 avec groupe initial modifié et groupe supplémentaire : bilan accessible, restauration, suppression confirmée de l’excédent, compte rendu et réussite, sans effacer le groupe DEV, le carnet ou le commentaire.
- L’illustration des conséquences d’étiquettes incorrectes sans modifier l’inventaire, puis l’annulation d’une vraie modification et la mise à jour des champs du portail.

Les tests du domaine couvrent aussi les doublons et la casse, les droits sur les opérations, la préservation de l’inventaire, la correction de région, le compte rendu obsolète, la reprise d’une création en cours sans doublon, les sauvegardes corrompues et l’isolation de la variante. L’accompagnement reconnaît une préparation faite dans un autre ordre, retrouve un groupe masqué par les filtres et revient aux corrections si une mission réussie est modifiée. La migration préserve les anciennes missions et variantes sans imposer le briefing au milieu d’un exercice.

Les nouveaux tests vérifient que modifier le groupe demandé ne bloque pas « Inventaire préservé », qu’annuler une modification retrouve le compte rendu cohérent, que les écarts nomment les groupes concernés, et qu’une sauvegarde sans historique reste réparable. L’annulation et le rétablissement couvrent création, modification d’étiquettes et suppression ; l’historique est borné, isolé par scénario et validé à la reprise. Les étiquettes d’un groupe initial comme Catalogue sont comparées à ses valeurs initiales, sans lui proposer celles de DemandesEtude.

## Portée des vérifications

Le premier déploiement Vercel a atteint l’état READY depuis le commit 2bdfc8458d007d7ec53b3cf46ce4f8c03164f25d. L’adresse https://atelier-cloud-ten.vercel.app/ répond en HTTP 200. Les fichiers JavaScript et CSS récupérés à cette adresse ont les mêmes empreintes SHA-256 que ceux de la compilation locale vérifiée.

Les tests d’interface manipulent les composants dans un DOM simulé. Ils valident les interactions et les changements d’état.

La présentation immersive a également été contrôlée dans un navigateur réel : portail et moniteur couvrant toute la fenêtre, encadré unique, réduction conservée après rechargement, navigation entre outils et mission terminée avec 9 critères validés. Aucun avertissement ni erreur de console n’a été observé.

Le parcours avec Nora a été rejoué dans ce navigateur : commande de lecture sur demande, changement de réplique, reprise du briefing après rechargement, ouverture du ticket, prise en charge, choix PRD puis correction vers DEV, création sans étiquettes, consigne de correction, enregistrement des quatre étiquettes, compte rendu, bilan et réussite à 9/9 retrouvée après rechargement. La vérification de la voix porte sur la commande et son cycle de vie ; elle ne mesure pas la qualité audio ou le timbre fourni par chaque appareil.

Le parcours de réparation a aussi été contrôlé dans un navigateur réel sur les données de test locales : modification de l’étiquette Application de Catalogue, affichage de la valeur actuelle DemandesEtude et de la valeur initiale Catalogue, restauration sans perdre le groupe DEV, annulation de cette restauration, rechargement, rétablissement et retour à la réussite. Les champs Azure reflètent la valeur restaurée. La vue des conséquences affiche le mauvais classement PRD et le responsable manquant dans l’exemple, sans changer le groupe. Aucun avertissement ni erreur de console n’a été observé. Cette vérification ne prétend pas identifier ou modifier la sauvegarde personnelle d’un autre navigateur.

Le contrôle sur un écran de 390 par 844 pixels confirme l’absence de débordement horizontal, l’occupation de toute la fenêtre par les deux surfaces et la présence d’un seul encadré réductible. Le briefing de Nora reste dans la fenêtre à 390 par 844 et à 390 par 480 pixels ; sa réduction est conservée après rechargement.

La nouvelle vue « Pourquoi ces étiquettes ? » est également contrôlée à 390 par 844 pixels : encadré unique dans les limites de la fenêtre, contenu défilant et absence de débordement horizontal. La taille normale du navigateur est rétablie après ce contrôle.

La progression est locale au navigateur et à l’origine du site. Il n’y a pas de synchronisation distante ou de connexion à un véritable compte Azure.
