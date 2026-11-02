import { describe, expect, it } from 'vitest';
import { assess, deserialize, initialState, workspaceReducer } from './engine';
import { DEV_ID, expectedTags, QUIZ, SCENARIOS } from './scenario';
import { introduction, teacherGuidance } from './teacher';
import type { WorkspaceState } from './types';

function prepared(): WorkspaceState {
  let state = initialState();
  state = workspaceReducer(state, { type: 'DRAFT', draft: { name: SCENARIOS.demandesetude.targetName,
    subscriptionId: DEV_ID, location: 'francecentral', tags: Object.entries(expectedTags(SCENARIOS.demandesetude)).map(([key, value]) => ({ key, value })) } });
  state = workspaceReducer(state, { type: 'START_CREATE', id: 'learner-group', now: 1000 });
  return workspaceReducer(state, { type: 'COMPLETE_CREATE', now: 2001 });
}

describe('Accompagnement fondé sur l’état courant', () => {
  it('accompagne aussi un élève qui ouvre directement la création sans prendre le ticket', () => {
    const state = initialState();
    state.ui.portalPage = 'create';
    expect(teacherGuidance(state.run, state.ui).id).toBe('subscription');
  });
  it('reconnaît une préparation réalisée sans suivre les consignes dans l’ordre', () => {
    let state = prepared();
    expect(state.run.startedAt).toBeNull();
    expect(teacherGuidance(state.run, state.ui).id).toBe('report');
    state = workspaceReducer(state, { type: 'ATTACH', groupId: 'learner-group' });
    state = workspaceReducer(state, { type: 'SUBMIT_REPORT', now: 3000 });
    expect(teacherGuidance(state.run, state.ui).id).toBe('quiz');
    for (const [question, quiz] of QUIZ.entries()) state = workspaceReducer(state, { type: 'ANSWER', question, answer: quiz.correct });
    state = workspaceReducer(state, { type: 'CHECK_QUIZ' });
    expect(teacherGuidance(state.run, state.ui).id).toBe('complete');
    expect(assess(state.run).complete).toBe(true);
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: 'learner-group', rows: [], now: 4000 });
    expect(teacherGuidance(state.run, state.ui).id).toBe('correct-tags');
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: 'learner-group', rows: [...Object.entries(expectedTags(SCENARIOS.demandesetude)).map(([key, value]) => ({ key, value })), { key: 'Extra', value: 'test' }], now: 5000 });
    expect(teacherGuidance(state.run, state.ui).id).toBe('report');
  });
  it('retrouve le groupe créé même si des filtres le masquent et ne fait aucune opération à la place de l’élève', () => {
    const state = prepared();
    state.run.groups.at(-1)!.tags = {};
    state.ui.filterSubId = 'formation-sub-prd';
    state.ui.groupSearch = 'invisible';
    const original = JSON.stringify(state);
    const guidance = teacherGuidance(state.run, state.ui);
    expect(guidance.action).toEqual({ kind: 'portal', page: 'detail', groupId: 'learner-group' });
    expect(JSON.stringify(state)).toBe(original);
  });
  it('demande la recréation d’une mauvaise région plutôt qu’une correction des étiquettes', () => {
    const state = prepared();
    state.run.groups.at(-1)!.location = 'westeurope';
    expect(teacherGuidance(state.run, state.ui).id).toBe('correct-group');
    expect(teacherGuidance(state.run, state.ui).message).toContain('recréer');
  });
  it('migre les anciennes missions et variantes sans rejouer une introduction au milieu d’un exercice', () => {
    const state = prepared();
    const original = state.run;
    let switched = workspaceReducer(state, { type: 'SWITCH_SCENARIO', key: 'suiviinterventions' });
    switched = workspaceReducer(switched, { type: 'TAKE_TICKET', now: 3000 });
    const legacy = JSON.parse(JSON.stringify(switched));
    delete legacy.run.teacherIntroStep;
    delete legacy.savedRuns.demandesetude.teacherIntroStep;
    const loaded = deserialize(JSON.stringify(legacy));
    expect(loaded.recovered).toBe(false);
    expect(loaded.state.run.teacherIntroStep).toBe(3);
    expect(loaded.state.savedRuns.demandesetude).toEqual({ ...original, teacherIntroStep: 3 });
    const fresh = JSON.parse(JSON.stringify(initialState()));
    delete fresh.run.teacherIntroStep;
    expect(deserialize(JSON.stringify(fresh)).state.run.teacherIntroStep).toBe(0);
  });
  it('préserve le travail même si le nouveau champ du briefing est illisible', () => {
    const state = prepared();
    const loaded = deserialize(JSON.stringify({ ...state, run: { ...state.run, teacherIntroStep: 'illisible' } }));
    expect(loaded.recovered).toBe(false);
    expect(loaded.state.run).toEqual({ ...state.run, teacherIntroStep: 3 });
  });
  it('adapte le récit à la variante et conserve le briefing propre à chaque mission', () => {
    let state = workspaceReducer(initialState(), { type: 'TEACHER_INTRO', step: 2 });
    state = workspaceReducer(state, { type: 'SWITCH_SCENARIO', key: 'suiviinterventions' });
    expect(state.run.teacherIntroStep).toBe(0);
    expect(introduction(state.run)[1].message).toContain('SuiviInterventions');
    expect(introduction(state.run)[1].message).not.toContain('DemandesEtude');
    state = workspaceReducer(state, { type: 'SWITCH_SCENARIO', key: 'demandesetude' });
    expect(state.run.teacherIntroStep).toBe(2);
  });
});
