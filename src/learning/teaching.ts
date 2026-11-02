import type { Attempt, Evidence, LearningState, World } from './types';

export const currentAttempt = (state: LearningState) => state.attempts.find(attempt => attempt.id === state.currentAttemptId);
export function causalTrace(world: World, attempt: Attempt) {
  const events = world.events.filter(event => event.appId === attempt.appId && event.seq > attempt.startSeq);
  const before = events.find(event => event.kind === 'browsed' && event.code === 403);
  const inspection = events.find(event => event.kind === 'inspected' && event.status === 'stopped');
  const start = events.find(event => event.kind === 'started' && before && inspection && event.seq > Math.max(before.seq, inspection.seq));
  const after = events.find(event => event.kind === 'browsed' && event.code === 200 && start && event.seq > start.seq && event.version === before?.version);
  return { before, inspection, start, after, complete: Boolean(before && inspection && start && after && world.apps.find(app => app.id === attempt.appId)?.status === 'running') };
}
export function makeEvidence(state: LearningState, now: number): Evidence | null {
  const attempt = currentAttempt(state);
  if (!attempt || attempt.reason !== 'service') return null;
  const trace = causalTrace(state.world, attempt);
  if (!trace.complete) return null;
  return { attemptId: attempt.id, mode: attempt.mode, caseName: attempt.caseName, assistance: attempt.assistance,
    beforeSeq: trace.before!.seq, inspectionSeq: trace.inspection!.seq, startSeq: trace.start!.seq, afterSeq: trace.after!.seq, version: trace.after!.version, at: now };
}
export function evidenceLabel(evidence: Evidence) {
  return evidence.mode === 'guided' ? 'Réalisé avec aide' : evidence.assistance === 0 ? 'Démontré en autonomie sur ce cas' : 'Réalisé avec aide';
}
export const reasons = [
  { id: 'service' as const, label: 'Le service Web App fonctionne à nouveau et sert le code déjà déployé.' },
  { id: 'group' as const, label: 'Le groupe de ressources a pris le relais pour exécuter l’application.' },
  { id: 'code' as const, label: 'Démarrer a réécrit et redéployé le code de l’application.' },
];
export const predictions = [
  { id: 'service' as const, label: 'Le site devient indisponible à la prochaine requête ; le groupe et le code restent présents.' },
  { id: 'group' as const, label: 'Le site reste disponible, car le groupe de ressources prend le relais.' },
  { id: 'code' as const, label: 'Le code de l’application est supprimé en même temps que le service s’arrête.' },
];
export const remediation = {
  group: 'Le groupe rassemble des ressources pour les gérer. Il ne prend pas le relais pour exécuter leur code. C’est la Web App, sur son plan, qui doit fonctionner pour répondre aux requêtes.',
  code: 'Arrêter ou démarrer la Web App change son exécution. Le déploiement existant est conservé : regarde le même numéro de version avant et après le redémarrage.',
};
export const hints = [
  'Compare ce que montre le navigateur avec l’état de la ressource qui sert cette adresse. Le nom d’un groupe ne suffit pas à expliquer une panne.',
  'Dans App Services, ouvre l’application concernée. Regarde son état et compare-le au dernier déploiement : le code est-il toujours présent ?',
  'Si la Web App est Arrêtée, utilise Démarrer dans sa vue d’ensemble. Attends la fin, puis parcours son adresse pour vérifier la réponse et la version.',
];
