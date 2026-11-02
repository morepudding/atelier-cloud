import { describe, expect, it } from 'vitest';
import { learningReducer, initialLearningState } from './reducer';
import { deserializeLearning } from './persistence';
import { causalTrace, currentAttempt, evidenceLabel } from './teaching';
import { browse, operate, seedWorld, settle } from './world';
import type { LearningState } from './types';

function transfer() { return learningReducer(initialLearningState(), { type: 'BEGIN_TRANSFER', now: 1000 }); }
function repair(state: LearningState) {
  const id = currentAttempt(state)!.appId;
  state = learningReducer(state, { type: 'INSPECT', scope: 'lab', appId: id, now: 1100 });
  state = learningReducer(state, { type: 'OPERATE', scope: 'lab', appId: id, kind: 'start', now: 1200 });
  state = learningReducer(state, { type: 'SETTLE', now: 2100 });
  return learningReducer(state, { type: 'BROWSE', scope: 'lab', appId: id, now: 2200 });
}
function explain(state: LearningState) {
  state = learningReducer(state, { type: 'REASON', value: 'service' });
  return learningReducer(state, { type: 'CHECK', now: 2300 });
}
describe('Un monde causal, distinct du cours et des preuves', () => {
  it('conserve la version et termine une opération une seule fois, y compris après reprise', () => {
    const world = seedWorld();
    const requested = operate(world, 'app-a', 'stop', 1000);
    expect(requested.apps[0].status).toBe('stopping');
    expect(world.apps[0].status).toBe('running');
    expect(operate(requested, 'app-a', 'stop', 1001)).toBe(requested);
    expect(settle(requested, 1700)).toBe(requested);
    const stopped = settle(requested, 1801);
    expect(stopped.apps[0].version).toBe(world.apps[0].version);
    expect(stopped.apps[0].status).toBe('stopped');
    expect(settle(stopped, 3000)).toBe(stopped);
    expect(stopped.events.filter(event => event.kind === 'stopped')).toHaveLength(1);
    expect(browse(stopped, 'app-a', 3100).response.code).toBe(403);
  });
  it('garde la dernière page chargée jusqu’à une nouvelle requête', () => {
    let state = learningReducer(initialLearningState(), { type: 'BROWSE', scope: 'lab', appId: 'app-a', now: 1000 });
    state = learningReducer(state, { type: 'OPERATE', scope: 'lab', appId: 'app-a', kind: 'stop', now: 1100 });
    state = learningReducer(state, { type: 'SETTLE', now: 2000 });
    expect(state.world.apps[0].status).toBe('stopped');
    expect(state.response?.code).toBe(200);
    state = learningReducer(state, { type: 'BROWSE', scope: 'lab', appId: 'app-a', now: 2100 });
    expect(state.response?.code).toBe(403);
    expect(state.evidence).toHaveLength(0);
  });
  it('isole toute la démonstration et ne transforme pas son visionnage en compétence', () => {
    let state = initialLearningState();
    const original = state.world;
    state = learningReducer(state, { type: 'NEXT' });
    state = learningReducer(state, { type: 'NEXT' });
    for (let index = 0; index < 5; index++) {
      state = learningReducer(state, { type: 'DEMO_NEXT', now: 1000 + index * 2000 });
      state = learningReducer(state, { type: 'SETTLE', now: 2000 + index * 2000 });
    }
    expect(state.lesson.demoStep).toBe(5);
    expect(state.response?.code).toBe(200);
    expect(state.world).toBe(original);
    expect(state.attempts).toHaveLength(0);
    expect(state.evidence).toHaveLength(0);
  });
  it('explique une prédiction erronée avant de permettre la pratique accompagnée', () => {
    const state = { ...initialLearningState(), lesson: { ...initialLearningState().lesson, phase: 'predict' as const, demoStep: 5 } };
    let next = learningReducer(state, { type: 'PREDICT', value: 'group' });
    next = learningReducer(next, { type: 'CHECK_PREDICTION' });
    expect(next.lesson.feedback).toContain('ne prend pas le relais');
    expect(learningReducer(next, { type: 'BEGIN_GUIDED', now: 1000 })).toBe(next);
    next = learningReducer(next, { type: 'PREDICT', value: 'service' });
    expect(learningReducer(next, { type: 'BEGIN_GUIDED', now: 1000 })).toBe(next);
    next = learningReducer(next, { type: 'CHECK_PREDICTION' });
    next = learningReducer(next, { type: 'BEGIN_GUIDED', now: 1000 });
    expect(currentAttempt(next)?.assistance).toBe(3);
  });
});
describe('Des preuves vérifiables et limitées au cas travaillé', () => {
  it('exige observations, diagnostic et justification, au-delà du service remis en route', () => {
    let state = transfer();
    state = learningReducer(state, { type: 'OPERATE', scope: 'lab', appId: 'app-b', kind: 'start', now: 1100 });
    state = learningReducer(state, { type: 'SETTLE', now: 2000 });
    state = learningReducer(state, { type: 'BROWSE', scope: 'lab', appId: 'app-b', now: 2100 });
    state = explain(state);
    expect(state.evidence).toHaveLength(0);
    expect(currentAttempt(state)?.feedback).toContain('examine aussi l’état');
    expect(currentAttempt(state)?.assistance).toBe(1);
  });
  it('reconnaît une résolution autonome sans fixer une route de navigation', () => {
    let state = transfer();
    expect(state.ui.page).toBe('apps');
    expect(state.ui.selectedId).toBe('');
    state = learningReducer(state, { type: 'UI', patch: { surface: 'azure', page: 'groups' } });
    state = learningReducer(state, { type: 'UI', patch: { page: 'plans' } });
    state = repair(state);
    state = explain(state);
    expect(state.lesson.phase).toBe('summary');
    expect(state.evidence).toHaveLength(1);
    expect(evidenceLabel(state.evidence[0])).toBe('Démontré en autonomie sur ce cas');
    expect(state.evidence[0].version).toBe('2.1.0');
  });
  it('accepte l’observation du service avant celle du symptôme, sans imposer les écrans', () => {
    let state = transfer();
    const startSeq = currentAttempt(state)!.startSeq;
    state = { ...state, world: { ...state.world, events: state.world.events.filter(event => event.seq <= startSeq) } };
    state = learningReducer(state, { type: 'INSPECT', scope: 'lab', appId: 'app-b', now: 1100 });
    state = learningReducer(state, { type: 'BROWSE', scope: 'lab', appId: 'app-b', now: 1200 });
    state = explain(repair(state));
    expect(state.evidence).toHaveLength(1);
  });
  it('ne valide ni une autre application ni une réponse correcte sans expérience', () => {
    let state = transfer();
    state = learningReducer(state, { type: 'BROWSE', scope: 'lab', appId: 'app-a', now: 1100 });
    state = explain(state);
    expect(state.evidence).toHaveLength(0);
    expect(causalTrace(state.world, currentAttempt(state)!).complete).toBe(false);
  });
  it('conserve l’aide après une correction, un indice ou une reprise de sauvegarde', () => {
    let state = repair(transfer());
    state = learningReducer(state, { type: 'REASON', value: 'code' });
    state = learningReducer(state, { type: 'CHECK', now: 2300 });
    expect(currentAttempt(state)?.feedback).toContain('déploiement existant est conservé');
    expect(currentAttempt(state)?.hintLevel).toBe(0);
    state = deserializeLearning(JSON.stringify(state)).state;
    state = explain(state);
    expect(evidenceLabel(state.evidence[0])).toBe('Réalisé avec aide');
    const original = state.evidence[0];
    state = learningReducer(state, { type: 'BEGIN_TRANSFER', now: 3000 });
    state = learningReducer(state, { type: 'HINT' });
    state = deserializeLearning(JSON.stringify(state)).state;
    expect(currentAttempt(state)?.hintLevel).toBe(1);
    expect(currentAttempt(state)?.assistance).toBe(1);
    expect(state.evidence[0]).toEqual(original);
  });
  it('compte le raccourci donné par Nora comme une aide à la navigation', () => {
    let state = learningReducer(transfer(), { type: 'OPEN_PORTAL_HELP' });
    expect(currentAttempt(state)?.assistance).toBe(1);
    state = explain(repair(state));
    expect(evidenceLabel(state.evidence[0])).toBe('Réalisé avec aide');
  });
  it('ouvre un nouveau cas sans reprendre les preuves ou les indices du cas précédent', () => {
    let state = explain(repair(transfer()));
    const oldAppName = state.world.apps[1].name;
    state = learningReducer(state, { type: 'BEGIN_TRANSFER', now: 3000 });
    expect(state.world.apps[1].name).not.toBe(oldAppName);
    expect(currentAttempt(state)?.assistance).toBe(0);
    expect(causalTrace(state.world, currentAttempt(state)!).complete).toBe(false);
    expect(state.evidence).toHaveLength(1);
  });
  it('rejoue la leçon sans effacer les preuves terminées ou le carnet', () => {
    let state = explain(repair(transfer()));
    state = learningReducer(state, { type: 'NOTES', text: 'Une nouvelle requête vérifie le retour du site.' });
    state = learningReducer(state, { type: 'REPLAY' });
    expect(state.lesson.phase).toBe('welcome');
    expect(state.evidence).toHaveLength(1);
    expect(state.currentAttemptId).toBeNull();
    expect(state.notes).toContain('nouvelle requête');
  });
});
describe('Sauvegarde V2 et reprise', () => {
  it('reprend une opération en cours et sa dernière page chargée', () => {
    let state = transfer();
    state = learningReducer(state, { type: 'INSPECT', scope: 'lab', appId: 'app-b', now: 1100 });
    state = learningReducer(state, { type: 'OPERATE', scope: 'lab', appId: 'app-b', kind: 'start', now: 1200 });
    const loaded = deserializeLearning(JSON.stringify(state));
    expect(loaded.recovered).toBe(false);
    state = learningReducer(loaded.state, { type: 'SETTLE', now: 3000 });
    expect(state.response?.code).toBe(403);
    state = explain(learningReducer(state, { type: 'BROWSE', scope: 'lab', appId: 'app-b', now: 3100 }));
    expect(state.evidence).toHaveLength(1);
  });
  it.each(['broken', 'null', '{"version":1}'])('récupère une sauvegarde illisible : %s', raw => {
    expect(deserializeLearning(raw).recovered).toBe(true);
  });
  it('refuse une référence de plan absente et une opération incohérente', () => {
    const state = initialLearningState();
    const bad = JSON.parse(JSON.stringify(state));
    bad.world.apps[0].planId = 'missing';
    expect(deserializeLearning(JSON.stringify(bad)).recovered).toBe(true);
    const pending = JSON.parse(JSON.stringify(state));
    pending.world.apps[0].status = 'starting';
    expect(deserializeLearning(JSON.stringify(pending)).recovered).toBe(true);
  });
  it('récupère une phase sans essai actif plutôt que de laisser le cours bloqué', () => {
    const state = initialLearningState();
    state.lesson.phase = 'transfer';
    expect(deserializeLearning(JSON.stringify(state)).recovered).toBe(true);
    state.lesson.phase = 'summary';
    expect(deserializeLearning(JSON.stringify(state)).recovered).toBe(true);
  });
});
