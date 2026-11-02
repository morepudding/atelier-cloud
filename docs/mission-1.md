# Mission 1 Préparer le groupe de ressources DEV de DemandesEtude

Cette mission t’apprend à préparer l’environnement DEV d’une application interne à partir d’un ticket. Tu navigues dans un poste de travail fictif, tu configures un groupe de ressources, puis tu vérifies ton travail avant de répondre au demandeur.

**Durée visée : 25 à 30 minutes.** Niveau débutant. L’environnement et les données sont entièrement simulés.

Le fil rouge est une version pédagogique de DemandesEtude. L’application accueillera ensuite des demandes et des documents, puis un assistant IA avec recherche documentaire et outils MCP. Pour cette première mission, le résultat attendu est un groupe de ressources DEV vide et correctement identifié.

# Compétences travaillées

À la fin de la mission, tu sais retrouver un abonnement, créer un groupe de ressources, lui ajouter des étiquettes, vérifier ses propriétés et rédiger un compte rendu exploitable. Tu sais aussi distinguer les droits disponibles et le périmètre demandé par un ticket.

La mission mobilise les notions de ressources, groupes de ressources, abonnements, régions, portail, étiquettes et accès du programme [AZ-900 de Microsoft](https://learn.microsoft.com/fr-fr/credentials/certifications/resources/study-guides/az-900). Elle constitue une première étape du parcours.

Le temps se répartit librement entre la prise de connaissance du ticket, environ 3 minutes, la manipulation, environ 12 minutes, la vérification et le compte rendu, environ 5 minutes, puis le bilan, environ 5 minutes.

# L’introduction avec Nora

Nora est une ingénieure cloud fictive et la professeure du parcours. Elle intervient dans l’unique encadré en bas à droite. Son introduction comporte trois répliques que l’apprenant avance à son rythme :

1. Elle se présente et explique que le parcours consiste à préparer, déployer puis exploiter une application comme au travail.
2. Elle présente DemandesEtude et la nouvelle version attendue par l’équipe. Camille confie la préparation de DEV ; INT et PRD sont déjà utilisés.
3. Elle pose le problème : le groupe DEV dédié manque. Le premier livrable est ce groupe vide, avec le nom, la région et les étiquettes du ticket. L’hébergement viendra dans une prochaine mission.

« C’est parti · Lire le ticket » ouvre Tickets et affiche la première consigne. « Passer l’introduction » conserve l’outil déjà ouvert. Le briefing est rejouable depuis les options sans effacer le travail. La réplique en cours est sauvegardée séparément pour chaque scénario.

Ensuite, Nora adapte sa consigne aux manipulations : abonnement et droits, nom, région, étiquettes, récapitulatif, création en cours, corrections, préservation de l’inventaire, compte rendu à actualiser et bilan de compréhension. Elle reconnaît aussi une préparation réalisée dans un autre ordre. Les opérations restent à réaliser dans les outils simulés.

Le bouton « Écouter Nora » lit la réplique affichée avec la voix du navigateur. Il ne se lance jamais automatiquement et s’arrête au changement de réplique, à l’ouverture d’une autre vue pédagogique, à la réduction du panneau ou lorsque l’onglet est masqué. Le dialogue reste lisible si la voix est indisponible.

# Ticket remis à l’apprenant

**Ticket DEM-001 — Préparer le groupe de ressources DEV de DemandesEtude**

**Demandeur :** Camille, responsable applicative fictive

**Équipe destinataire :** WebApps

**Priorité :** normale

**Statut initial :** à prendre en charge

> Bonjour Romain,
>
> Nous préparons une nouvelle version de DemandesEtude. L’équipe de développement a besoin d’un groupe de ressources dédié pour accueillir les futurs services de l’application.
>
> Crée le groupe dans l’abonnement **FORMATION-IT-DEV**, avec le nom **rg-demandesetude-dev-frc-01**, dans la région **France Central**.
>
> Ajoute les quatre étiquettes indiquées ci-dessous. Le groupe doit rester vide à la fin de cette intervention. Les services applicatifs seront ajoutés lors du prochain ticket.
>
> L’intervention porte uniquement sur DEV. Conserve les environnements et les groupes déjà présents.
>
> Une fois terminé, indique dans ta réponse le nom du groupe, son abonnement, sa région, ses étiquettes et le nombre de ressources qu’il contient. Explique brièvement à quoi servira ce groupe.

| Clé de l’étiquette | Valeur demandée |
| --- | --- |
| Application | DemandesEtude |
| Environment | DEV |
| Owner | equipe-webapps |
| CostCenter | IT-FORMATION |

Une note jointe explique la convention fictive de l’équipe : `rg` désigne le groupe de ressources, `demandesetude` l’application, `dev` l’environnement, `frc` France Central et `01` le premier groupe. Cette convention appartient au scénario.

# État initial du poste de travail

Le portail Azure simulé occupe toute la fenêtre au démarrage. Pour les autres outils, le moniteur du poste de travail affiche le bureau, les fenêtres et la barre des tâches. Les trois applications sont **Tickets**, **Microsoft Azure** et **Carnet**. Le ticket et les notes restent consultables pendant les manipulations. Le seul élément pédagogique superposé est l’encadré réductible de Nora, conservé sur les deux surfaces.

L’utilisateur est déjà connecté sous le nom **Romain**, dans l’annuaire fictif **Atelier IT**. Aucun parcours d’inscription n’est nécessaire.

| Abonnement fictif | Accès de Romain dans le scénario |
| --- | --- |
| FORMATION-IT-DEV | Contributeur |
| FORMATION-IT-INT | Lecteur |
| FORMATION-IT-PRD | Lecteur |

Le rôle Lecteur permet de consulter les ressources sans les modifier. Le portail simule cette limite sur INT et PRD. [Rôle Lecteur dans Azure](https://learn.microsoft.com/fr-fr/azure/role-based-access-control/built-in-roles/general)

Les groupes préexistants sont `rg-catalogue-dev-frc-01` en DEV, `rg-demandesetude-int-frc-01` en INT et `rg-demandesetude-prd-frc-01` en PRD. Des ressources fictives les rendent reconnaissables comme des environnements déjà utilisés. Le groupe demandé par DEM-001 est absent.

La liste affiche initialement les trois abonnements. Dans le formulaire de création, aucun abonnement n’est présélectionné. Le nom est vide et la région doit être choisie.

Le ticket, les documents et le portail sont les surfaces de travail de l’apprenant. Le corrigé détaillé et les règles de validation décrites plus bas sont destinés à la conception du simulateur.

# Actions dans le faux portail

## Prendre en charge la demande

Dans Tickets, ouvre DEM-001 et passe son statut à **En cours**. Repère l’environnement autorisé, le nom demandé, la région, les quatre étiquettes et le livrable attendu.

Le carnet Notes permet de conserver ces informations. Une courte fiche facultative explique le vocabulaire rencontré : annuaire, abonnement, groupe et ressource.

## Identifier le bon abonnement

Ouvre le navigateur et consulte **Abonnements**, accessible depuis le menu ou la recherche du portail. Retrouve **FORMATION-IT-DEV** et son rôle associé.

Les trois abonnements restent visibles pour permettre la comparaison. Les fiches INT et PRD sont consultables. Le contrôle des accès explique pourquoi leur modification est indisponible.

Le rappel pédagogique est : « Le ticket indique le périmètre de ton intervention. Les droits indiquent les opérations que ton compte peut effectuer. »

## Examiner les groupes existants

Ouvre **Groupes de ressources**. Consulte les colonnes Nom, Abonnement et Région. Filtre la liste sur DEV, puis recherche `demandesetude`.

L’absence du groupe demandé te conduit à en créer un. Les groupes INT et PRD restent accessibles par les filtres et permettent de comprendre qu’un nom proche peut correspondre à un autre environnement.

## Renseigner la création

Sélectionne **Créer**. Le formulaire comporte **Informations de base**, **Étiquettes** et **Vérifier + créer**.

| Champ | Valeur attendue |
| --- | --- |
| Abonnement | FORMATION-IT-DEV |
| Groupe de ressources | rg-demandesetude-dev-frc-01 |
| Région | France Central, identifiant francecentral |

Une aide facultative précise que la région du groupe concerne notamment ses métadonnées. Les ressources qu’il contiendra pourront avoir leur propre région. Le ticket fixe ici la région du groupe. [Gestion des groupes de ressources dans le portail Azure](https://learn.microsoft.com/fr-fr/azure/azure-resource-manager/management/manage-resource-groups-portal)

## Ajouter les étiquettes

Dans **Étiquettes**, saisis les quatre paires du ticket. Tu peux ajouter une ligne, la supprimer ou revenir aux informations de base sans perdre la saisie.

Le rappel pédagogique indique : « Ces étiquettes identifient ce groupe. Les futures ressources devront recevoir leurs propres étiquettes ou bénéficier d’un mécanisme prévu pour les appliquer. » Azure ne transmet pas automatiquement les étiquettes du groupe à ses ressources. [Fonctionnement des étiquettes Azure](https://learn.microsoft.com/fr-fr/azure/azure-resource-manager/management/tag-resources)

## Vérifier et créer

Ouvre **Vérifier + créer** et relis l’abonnement, le nom, la région et les étiquettes. Tu peux revenir modifier chaque partie.

La validation du portail vérifie les conditions techniques simulées : champs requis, nom autorisé, disponibilité du nom dans cet abonnement et autorisation d’écriture. Les règles particulières du ticket seront évaluées lorsque tu demanderas la vérification de la mission.

Clique sur **Créer**. Un état transitoire apparaît, puis une notification confirme la création. Une action **Accéder au groupe de ressources** ouvre sa fiche.

## Contrôler le résultat

Dans **Vue d’ensemble**, vérifie le nom, l’abonnement, la région et le compteur de ressources, qui doit afficher **0**. Ouvre **Étiquettes** et contrôle les quatre valeurs.

Si une étiquette manque ou contient une erreur, modifie-la et enregistre. Si le groupe semble absent, vérifie les filtres et actualise la liste avant de relancer une création.

Tu peux naviguer ailleurs puis retrouver le groupe. Fermer une fiche laisse le groupe dans l’inventaire.

## Répondre au ticket

Depuis l’encadré de mission, sélectionne **Voir le ticket**, puis renseigne le compte rendu dans Tickets. Le champ **Groupe à joindre au ticket** associe la fiche à DEM-001 et fournit les propriétés réellement présentes dans le portail.

Ajoute une phrase sur l’utilité du groupe, puis sélectionne **Soumettre pour vérification**. Le ticket passe à **À corriger** si des exigences manquent, ou à **Résolu** lorsque les critères techniques et le bilan sont validés.

Le compte rendu doit décrire le groupe de ressources préparé. Le déploiement de l’application constitue la mission suivante.

# Erreurs prévues et corrections

Les messages ci-dessous sont des formulations pédagogiques du simulateur. Ils distinguent une impossibilité technique d’un écart à la demande.

| Situation | Réaction du simulateur | Correction attendue |
| --- | --- | --- |
| Aucun abonnement ou aucune région sélectionné | Le champ requis est signalé et la création reste indisponible. | Compléter le champ. |
| Nom contenant un espace | La validation technique signale un nom invalide. | Corriger la saisie avant création. |
| Nom déjà présent dans le même abonnement | Le portail signale le groupe existant et permet de l’ouvrir. | Examiner ce groupe et éviter une seconde création. |
| Nom techniquement valide mais différent de celui du ticket | La création est possible en DEV ; la vérification de mission signale l’écart. | Créer le groupe attendu et supprimer le groupe vide créé par erreur pendant cette session. |
| Région différente de France Central | La création est possible ; la vérification de mission signale la région incorrecte. | Vérifier que le groupe créé pendant la session est vide, le supprimer puis le recréer dans la région demandée. |
| Étiquette absente ou valeur incorrecte | La création reste possible ; le bilan indique précisément la paire à corriger. | Modifier les étiquettes du groupe et enregistrer. |
| Tentative d’écriture sur INT ou PRD | Le contrôle des accès refuse l’opération et rappelle le rôle Lecteur. | Revenir à l’abonnement DEV du ticket. |
| Groupe masqué par un filtre | La liste reflète le filtre, avec un état vide explicatif. | Vérifier les filtres, puis actualiser ou utiliser la notification. |
| Soumission du ticket alors que le groupe est absent | La vérification indique « Groupe attendu introuvable ». | Terminer la création avant de soumettre à nouveau. |

Les noms de groupes sont uniques au sein d’un abonnement et leur identité est comparée sans tenir compte de la casse. La convention de l’équipe recommande l’écriture en minuscules ; une différence de casse seule déclenche un conseil sans bloquer la réussite. [Règles de nommage Azure](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules)

Un groupe Azure ne peut pas être renommé. Sa région ne peut pas être modifiée après création. Dans cette mission, la correction utilise uniquement la suppression puis la recréation d’un groupe **vide créé pendant la session**, après confirmation de son nom. [Questions fréquentes sur les groupes](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/frequently-asked-questions), [Propriétés modifiables d’un groupe](https://learn.microsoft.com/en-us/rest/api/resources/resource-groups/update?view=rest-resources-2021-04-01)

Le simulateur conserve la possibilité de corriger ses erreurs. Une erreur suivie d’une correction conforme permet de réussir la mission.

# Aide progressive

L’apprenant choisit quand demander de l’aide. Trois niveaux sont disponibles pour chaque blocage. L’aide utilisée apparaît dans le bilan et laisse tous les critères de réussite accessibles.

| Blocage | Indice 1 | Indice 2 | Indice 3 |
| --- | --- | --- | --- |
| Choisir l’abonnement | « Quel environnement est indiqué dans le ticket ? » | « Compare les noms dans Abonnements. » | « Choisis FORMATION-IT-DEV dans le formulaire. » |
| Retrouver le groupe créé | « Que limite la liste affichée ? » | « Vérifie le filtre Abonnements et la recherche. » | « Affiche DEV, efface la recherche puis actualise. » |
| Corriger une étiquette | « Compare les propriétés du groupe au ticket. » | « Les étiquettes se modifient depuis la fiche du groupe. » | « Ouvre Étiquettes, corrige la paire signalée et enregistre. » |
| Comprendre la région | « Quel objet configures-tu maintenant ? » | « Un groupe et les ressources qu’il contient ont des propriétés distinctes. » | « La région choisie ici est celle du groupe ; les futurs services auront leur propre configuration. » |

La fiche de cours reste consultable. Une erreur de saisie affiche immédiatement son explication technique. Les écarts au ticket sont détaillés sur demande de vérification, afin de laisser le temps d’observer et de corriger.

# Critères de réussite

La vérification s’appuie sur l’inventaire et le ticket au moment de la soumission. Les chemins de navigation et l’ordre des clics restent libres.

| Critère obligatoire | Vérification attendue |
| --- | --- |
| Groupe créé | Le groupe attendu existe et sa création est terminée. |
| Bon abonnement | Il appartient à FORMATION-IT-DEV, identifié par son identifiant interne stable. |
| Bon nom | Son identité correspond à rg-demandesetude-dev-frc-01, sans tenir compte de la casse. |
| Bonne région | Sa région est francecentral. |
| Étiquettes conformes | Les quatre clés demandées sont présentes avec les valeurs du ticket. |
| Groupe vide | Il contient 0 ressource. |
| Inventaire préservé | Les objets présents au début ont conservé leurs propriétés et leur contenu ; les groupes supplémentaires créés par erreur pendant la session ont été retirés. |
| Compte rendu cohérent | Le ticket est lié au bon groupe et contient un relevé actualisé du nom, de l’abonnement, de la région, des quatre étiquettes et du nombre de ressources. |
| Compréhension vérifiée | Les trois mises en situation du bilan ont reçu une réponse correcte après explication et, si nécessaire, nouvel essai. |

Pour les étiquettes, les noms de clés sont comparés sans tenir compte de la casse ; les valeurs la respectent. Des clés supplémentaires valides sont acceptées. Une différence de présentation de clé entraîne un conseil sur la convention. [Sensibilité à la casse des étiquettes](https://learn.microsoft.com/fr-fr/azure/azure-resource-manager/management/tag-resources)

Un clic sur Créer, une notification de succès ou un compte rendu rempli seul ne suffit pas à valider la mission. Si le groupe est supprimé après sa création ou si une étiquette est ensuite modifiée, le contrôle reflète l’état courant.

Le commentaire libre sur l’utilité du groupe sert à la discussion pédagogique. Sa formulation ne fait pas l’objet d’une notation automatique par mots-clés.

# Bilan de compréhension

Ces trois situations apparaissent dans l’encadré de mission après la soumission technique. L’explication et la réponse attendue sont révélées après une première réponse.

**Situation 1 — Préparer les services.** « Le groupe existe et il est vide. L’application est-elle déjà hébergée ? »

**Réponse attendue :** le groupe prépare l’organisation des futurs services ; l’hébergement de l’application reste à configurer.

**Situation 2 — Choisir la région d’un futur service.** « Le groupe est dans France Central. Une future application web sera-t-elle obligatoirement dans cette région ? »

**Réponse attendue :** il faut vérifier la région propre au service lors de sa création. La région du groupe ne suffit pas à imposer celle du service. [Région du groupe et des ressources](https://learn.microsoft.com/fr-fr/azure/azure-resource-manager/management/manage-resource-groups-portal)

**Situation 3 — Identifier les futures ressources.** « Environment = DEV est présent sur le groupe. Cette étiquette apparaîtra-t-elle automatiquement sur chaque future ressource ? »

**Réponse attendue :** il faudra la renseigner ou prévoir un mécanisme pour l’appliquer. [Héritage des étiquettes](https://learn.microsoft.com/fr-fr/azure/azure-resource-manager/management/tag-resources)

Le bilan affiche les exigences satisfaites, les écarts encore présents, les corrections effectuées et les aides utilisées. Les mentions finales sont **Réussie en autonomie** ou **Réussie avec aide**. Tant qu’une exigence reste à corriger, la mission reste **En cours**. La durée n’est pas un critère éliminatoire.

# Compte rendu attendu et suite du parcours

Le relevé ci-dessous constitue un exemple de corrigé, accessible après la réussite ou sur demande explicite de solution.

> Le groupe rg-demandesetude-dev-frc-01 est créé dans FORMATION-IT-DEV, en France Central.
>
> Étiquettes vérifiées : Application = DemandesEtude ; Environment = DEV ; Owner = equipe-webapps ; CostCenter = IT-FORMATION.
>
> Il contient actuellement 0 ressource. Il servira à regrouper et gérer les futurs services de l’application DEV.
>
> Le périmètre de cette intervention est préparé pour la prochaine étape.

Le groupe validé devient le point de départ de la mission 2 : choisir et préparer l’hébergement de l’application. Les données de progression conservent ce lien entre les chapitres.

# Règles du simulateur pour cette mission

Le faux portail conserve l’inventaire, les étiquettes, les opérations en cours et le ticket après navigation ou rechargement. Un brouillon renseigné est retrouvé avec ses champs ; les éléments d’aide et les réponses au bilan sont également conservés.

Une création produit un seul groupe. Un double clic ou un rechargement pendant l’opération ne produit pas de doublon. Une notification de création renvoie vers l’objet réellement présent dans l’inventaire.

Les contrôles d’écriture sur INT et PRD s’appliquent à toute opération. Les éléments non simulés du portail portent la mention « Disponible dans une prochaine mission ». La recherche, les filtres, les formulaires et les notifications nécessaires au scénario fonctionnent.

Le bouton **Vérifier ma mission** peut être utilisé plusieurs fois. Il recalcule les critères depuis l’état courant. Une nouvelle soumission du ticket actualise le relevé joint.

La réinitialisation est une action distincte : elle annonce l’effacement de la progression de cet essai et restaure le jeu de départ après confirmation. Elle permet de rejouer la mission avec moins d’aide.

Une variante d’entraînement, après réussite, remplace l’application par **SuiviInterventions**, le nom par **rg-suiviinterventions-dev-frc-01** et l’étiquette Application par **SuiviInterventions**. Les autres contraintes restent identiques. L’objectif est de reproduire la démarche sur un nouveau ticket.
