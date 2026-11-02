import { assess, inventoryIssues, rowsToTags, targetGroup, writable } from './engine';
import { expectedTags, SCENARIOS } from './scenario';
import type { PortalPage, RunState, UiState } from './types';
import { tagConsequences } from './tag-learning';

export const INTRO_SCENE_COUNT = 3;
export interface TeacherScene { id: string; title: string; message: string }
export type TeacherAction = { kind: 'ticket' } | { kind: 'quiz' | 'assessment' | 'recovery' | 'impact' }
  | { kind: 'portal'; page: PortalPage; groupId?: string };
export interface TeacherGuidance extends TeacherScene { action?: TeacherAction; actionLabel?: string }

export function introduction(run: RunState): TeacherScene[] {
  const { application } = SCENARIOS[run.scenarioKey];
  return [
    { id: 'welcome', title: 'Bienvenue dans l’équipe.', message: 'Bonjour Romain, moi c’est Nora. Je suis ingénieure cloud et ta professeure pour ce parcours. On va apprendre Azure en préparant puis en exploitant une application, comme au travail. Je reste avec toi à chaque étape.' },
    { id: 'context', title: application + ' arrive en DEV.', message: `L’équipe prépare une nouvelle version de ${application}, ${run.scenarioKey === 'demandesetude' ? 'notre application de suivi des demandes d’étude' : 'notre application de suivi des interventions'}. Camille nous confie son environnement de développement. Les environnements INT et PRD sont déjà utilisés : nous devons les préserver.` },
    { id: 'problem', title: 'Avant de déployer, il manque une base.', message: `Le groupe de ressources DEV dédié à ${application} n’existe pas encore. Ta première mission : le créer avec la région et les étiquettes du ticket. Il restera vide. L’hébergement viendra dans une prochaine mission. Commençons par lire la demande de Camille.` },
  ];
}

// Guidance follows the actual environment; it never validates or performs a learner's operation.
export function teacherGuidance(run: RunState, ui: UiState): TeacherGuidance {
  const assessment = assess(run);
  const scenario = SCENARIOS[run.scenarioKey];
  const group = targetGroup(run);
  const candidate = group ?? run.groups.filter(g => g.origin === 'session').at(-1);
  const passed = (id: string) => assessment.checks.some(check => check.id === id && check.passed);
  const portal = (page: PortalPage, groupId?: string): TeacherAction => ({ kind: 'portal', page, groupId });
  if (assessment.complete) return { id: 'complete', title: 'Ton environnement DEV est prêt.',
    message: `Tu as préparé l’espace de ${scenario.application}, vérifié sa configuration et rendu compte à l’équipe. Le groupe est encore vide : nous pourrons y ajouter l’hébergement lors d’une prochaine mission.`,
    actionLabel: 'Revoir mon bilan', action: { kind: 'assessment' } };
  if (run.pending) return { id: 'pending', title: 'La création est en cours.',
    message: 'Laisse Azure terminer l’opération. Ensuite, nous vérifierons le groupe réellement créé, sa région et ses étiquettes. Un formulaire valide ne garantit pas encore que le ticket est satisfait.' };
  const inventory = inventoryIssues(run);
  if (inventory.changed.length || inventory.extras.length) return { id: 'inventory', title: 'Regardons ce qui empêche la validation.',
    message: inventory.changed.length ? `${inventory.changed[0].original.name} est un groupe déjà présent ; sa configuration a changé. Tu peux comparer les valeurs et restaurer son état initial sans perdre ton groupe DEV.`
      : `${inventory.extras[0].name} est un groupe supplémentaire. Le ticket attend uniquement ${scenario.targetName}. Examinons-le avant de le supprimer ou d’annuler sa création.`,
    actionLabel: 'Voir l’écart et le corriger', action: { kind: 'recovery' } };
  if (candidate) {
    if (!passed('subscription') || !passed('name') || !passed('region')) return { id: 'correct-group', title: 'Comparons le groupe au ticket.',
      message: 'Le groupe existe, mais son nom, son abonnement ou sa région ne correspond pas à la demande. Ces propriétés ne se corrigent pas dans les étiquettes. Vérifie le ticket ; tu peux supprimer ce groupe vide de ton essai et le recréer.',
      actionLabel: 'Examiner mon groupe', action: portal('detail', candidate.id) };
    if (!passed('tags')) return { id: 'correct-tags', title: 'Le groupe est là. Ajustons ses étiquettes.',
      message: `${tagConsequences(candidate.tags, run).find(effect => !effect.correct)?.effect} Ouvre l’onglet Étiquettes du groupe, compare les valeurs au ticket et enregistre tes corrections.`,
      actionLabel: 'Ouvrir mon groupe', action: portal('detail', candidate.id) };
    if (!passed('empty')) return { id: 'inventory', title: 'Ce groupe doit rester vide.',
      message: 'Le ticket prépare uniquement l’organisation de DEV. Les services de l’application seront ajoutés dans une prochaine mission.',
      actionLabel: 'Examiner le groupe', action: portal('detail', candidate.id) };
    if (!passed('report')) return { id: 'report', title: run.reportSubmittedAt ? 'Actualisons le compte rendu.' : 'Le groupe est conforme. Prévenons Camille.',
      message: run.reportSubmittedAt ? 'Le relevé soumis ne correspond plus au groupe actuel. Dans le ticket, sélectionne le bon groupe et soumets à nouveau pour transmettre sa configuration à jour.' : 'Retourne au ticket, joins le groupe que tu as créé et explique avec tes mots ce que tu as préparé. Puis soumets ton compte rendu pour vérification.',
      actionLabel: 'Répondre au ticket', action: { kind: 'ticket' } };
    return { id: 'quiz', title: 'Un dernier point avant de conclure.',
      message: run.quiz.submitted ? 'Relis les explications de tes réponses et ajuste celles qui restent à revoir. Le but est de comprendre à quoi sert ce groupe, puis de réessayer.' : 'Ton compte rendu est enregistré. Vérifions ensemble trois situations : le groupe vide, la région des futurs services et les étiquettes. Prends le temps de choisir tes réponses.',
      actionLabel: 'Faire le bilan', action: { kind: 'quiz' } };
  }
  if (ui.activeApp === 'azure' && ui.portalPage === 'create') {
    const draft = run.draft;
    if (draft.subscriptionId && !writable(draft.subscriptionId)) return { id: 'access', title: 'Regarde le rôle associé à cet abonnement.',
      message: 'Tu es Lecteur ici : tu peux consulter, mais pas créer. Le ticket autorise uniquement DEV. Choisis FORMATION-IT-DEV, où tu disposes du rôle Contributeur.' };
    if (!draft.subscriptionId) return { id: 'subscription', title: 'Commençons par le bon périmètre.',
      message: 'Dans Abonnement, sélectionne celui qui correspond à l’environnement DEV. L’abonnement détermine ici où tu travailles et quels droits tu as.' };
    if (draft.name.toLowerCase().trim() !== scenario.targetName) return { id: 'name', title: 'Donne à ce groupe le nom du ticket.',
      message: `Renseigne ${scenario.targetName} dans Groupe de ressources. Le nom aide l’équipe à reconnaître l’application, l’environnement et la région selon sa convention.` };
    if (draft.location !== 'francecentral') return { id: 'region', title: 'Choisis France Central pour ce groupe.',
      message: 'La région demandée concerne les métadonnées du groupe. Les services que tu ajouteras plus tard auront leur propre choix de région.' };
    if (run.wizardStep === 0) return { id: 'next-tags', title: 'La base est renseignée. Passons aux étiquettes.',
      message: 'Clique sur « Suivant : Étiquettes ». Application et Environment servent à retrouver ce groupe ; Owner indique qui appeler ; CostCenter prépare le suivi budgétaire. Tu peux voir leurs effets dans « Pourquoi ces étiquettes ? ».' };
    const tags = Object.fromEntries(Object.entries(rowsToTags(draft.tags)).map(([key, value]) => [key.toLowerCase(), value]));
    if (Object.entries(expectedTags(scenario)).some(([key, value]) => tags[key.toLowerCase()] !== value)) return { id: 'draft-tags', title: 'Ajoute les quatre paires du ticket.',
      message: `Ces étiquettes répondent à quatre questions : quelle application, quel environnement, qui contacter et quel budget suivre ? Compare les quatre paires au ticket. ${run.wizardStep === 2 ? 'Tu peux revenir à l’onglet Étiquettes avant de créer.' : 'Puis passe à « Vérifier + créer ».'}`,
      actionLabel: 'Pourquoi ces étiquettes ?', action: { kind: 'impact' } };
    return { id: 'review', title: 'Relis les paramètres, puis crée le groupe.',
      message: run.wizardStep === 2 ? 'Compare ce récapitulatif au ticket. Si tout correspond, clique sur Créer. Je vérifierai ensuite l’état du groupe dans l’inventaire.' : 'Clique sur « Suivant : Vérifier + créer » pour relire l’abonnement, le nom, la région et les étiquettes avant la création.' };
  }
  if (run.startedAt === null) return { id: 'ticket', title: 'À toi : découvre la demande.',
    message: `Lis le ticket ${scenario.ticket} et prends-le en charge. Repère le nom du groupe, la région et les quatre étiquettes. Ton intervention se limite à DEV.`,
    actionLabel: 'Lire le ticket', action: { kind: 'ticket' } };
  if (ui.activeApp === 'azure' && ui.portalPage === 'subscriptions') return {
    id: 'inspect-access', title: 'Observe les droits avant de créer.',
    message: 'FORMATION-IT-DEV te donne le rôle Contributeur. INT et PRD sont en lecture seule. Nous avons le bon périmètre pour préparer DEV ; ouvre maintenant la création du groupe.',
    actionLabel: 'Ouvrir la création', action: portal('create') };
  return { id: 'start', title: 'Le ticket est à toi. Passons dans Azure.',
    message: 'Ouvre Abonnements et compare les environnements et les rôles. Nous cherchons l’abonnement DEV dans lequel tu peux créer le groupe demandé.',
    actionLabel: 'Voir les abonnements', action: portal('subscriptions') };
}
