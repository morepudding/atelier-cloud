import { describe, expect, it } from 'vitest';
import { assess, deserialize, initialState, inventoryIssues, targetGroup, workspaceReducer } from './engine';
import { DEV_ID, expectedTags, QUIZ, SCENARIOS } from './scenario';
import { tagConsequences, tagSource } from './tag-learning';
import type { WorkspaceState } from './types';

const scenario = SCENARIOS.demandesetude;
const rows = () => Object.entries(expectedTags(scenario)).map(([key, value]) => ({ key, value }));
function create(state = initialState(), name = scenario.targetName, id = 'target') {
  state = workspaceReducer(state, { type: 'DRAFT', draft: { name, subscriptionId: DEV_ID, location: 'francecentral', tags: rows() } });
  state = workspaceReducer(state, { type: 'START_CREATE', id, now: 1000 });
  return workspaceReducer(state, { type: 'COMPLETE_CREATE', now: 2001 });
}
function submitted(state: WorkspaceState) {
  state = workspaceReducer(state, { type: 'ATTACH', groupId: 'target' });
  state = workspaceReducer(state, { type: 'SUBMIT_REPORT', now: 3000 });
  for (const [question, quiz] of QUIZ.entries()) state = workspaceReducer(state, { type: 'ANSWER', question, answer: quiz.correct });
  return workspaceReducer(state, { type: 'CHECK_QUIZ' });
}
const check = (state: WorkspaceState, id: string) => assess(state.run).checks.find(value => value.id === id)!;

describe('Réparer une mission sans la recommencer', () => {
  it('autorise les corrections du groupe demandé et retrouve le compte rendu valide après annulation', () => {
    let state = submitted(create());
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: 'target', rows: [...rows(), { key: 'Note', value: 'test' }], now: 4000 });
    expect(check(state, 'inventory').passed).toBe(true);
    expect(check(state, 'report').passed).toBe(false);
    expect(check(state, 'report').detail).toContain('changé depuis ta réponse');
    state = workspaceReducer(state, { type: 'UNDO_INVENTORY', now: 5000 });
    expect(assess(state.run).complete).toBe(true);
    expect(state.run.quiz.answers).toEqual(QUIZ.map(quiz => quiz.correct));
    state = workspaceReducer(state, { type: 'REDO_INVENTORY', now: 6000 });
    expect(check(state, 'report').passed).toBe(false);
    expect(targetGroup(state.run)?.tags.Note).toBe('test');
  });
  it('nomme les groupes initiaux modifiés et les groupes supplémentaires au lieu de laisser un critère générique', () => {
    let state = create();
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: 'seed-catalogue', rows: rows(), now: 3000 });
    state = create(state, 'rg-erreur-dev', 'extra');
    const issues = inventoryIssues(state.run);
    expect(issues.changed[0].fields).toContainEqual({ label: 'Application', current: 'DemandesEtude', expected: 'Catalogue' });
    expect(issues.extras.map(group => group.id)).toEqual(['extra']);
    expect(check(state, 'inventory').detail).toContain('rg-catalogue-dev-frc-01');
    expect(check(state, 'inventory').detail).toContain('rg-erreur-dev');
    expect(check(state, 'inventory').passed).toBe(false);
  });
  it('répare une ancienne sauvegarde sans historique, en conservant le groupe DEV et les autres travaux', () => {
    let state = submitted(create());
    state.notes = 'Mes notes';
    state.run.comment = 'Mon compte rendu';
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: 'seed-catalogue', rows: rows(), now: 3000 });
    const legacy = JSON.parse(JSON.stringify(state));
    delete legacy.run.inventoryHistory;
    state = deserialize(JSON.stringify(legacy)).state;
    const original = targetGroup(state.run);
    expect(state.run.inventoryHistory.past).toHaveLength(0);
    state = workspaceReducer(state, { type: 'RESTORE_BASELINE', groupId: 'seed-catalogue', now: 4000 });
    expect(targetGroup(state.run)).toEqual(original);
    expect(assess(state.run).complete).toBe(true);
    expect(state.notes).toBe('Mes notes');
    expect(state.run.comment).toBe('Mon compte rendu');
    state = workspaceReducer(state, { type: 'UNDO_INVENTORY', now: 5000 });
    expect(check(state, 'inventory').passed).toBe(false);
    state = workspaceReducer(state, { type: 'REDO_INVENTORY', now: 6000 });
    expect(check(state, 'inventory').passed).toBe(true);
    expect(workspaceReducer(state, { type: 'RESTORE_BASELINE', groupId: 'target', now: 7000 })).toBe(state);
  });
  it('annule et rétablit la création et la suppression après rechargement sans laisser une fiche inaccessible', () => {
    let state = create();
    state = deserialize(JSON.stringify(state)).state;
    state = workspaceReducer(state, { type: 'UNDO_INVENTORY', now: 3000 });
    expect(targetGroup(state.run)).toBeUndefined();
    expect(state.ui.portalPage).toBe('groups');
    state = workspaceReducer(state, { type: 'REDO_INVENTORY', now: 4000 });
    state = workspaceReducer(state, { type: 'DELETE_GROUP', groupId: 'target', confirmation: scenario.targetName, now: 5000 });
    expect(targetGroup(state.run)).toBeUndefined();
    state = workspaceReducer(state, { type: 'UNDO_INVENTORY', now: 6000 });
    expect(targetGroup(state.run)?.name).toBe(scenario.targetName);
    expect(state.run.pending).toBeNull();
  });
  it('empêche une annulation pendant la création et démarre une nouvelle branche après une correction', () => {
    let state = create();
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: 'target', rows: [], now: 3000 });
    state = workspaceReducer(state, { type: 'UNDO_INVENTORY', now: 4000 });
    expect(state.run.inventoryHistory.future).toHaveLength(1);
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: 'target', rows: [...rows(), { key: 'Note', value: 'nouveau' }], now: 5000 });
    expect(state.run.inventoryHistory.future).toHaveLength(0);
    state = workspaceReducer(state, { type: 'DRAFT', draft: { ...state.run.draft, name: 'rg-pending', location: 'francecentral', subscriptionId: DEV_ID } });
    state = workspaceReducer(state, { type: 'START_CREATE', id: 'pending', now: 6000 });
    expect(workspaceReducer(state, { type: 'UNDO_INVENTORY', now: 6001 })).toBe(state);
  });
  it('borne l’historique et ignore un historique illisible sans perdre la mission ni sa variante', () => {
    let state = create();
    for (let index = 0; index < 25; index++) state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: 'target', rows: [...rows(), { key: 'Note', value: String(index) }], now: 3000 + index });
    expect(state.run.inventoryHistory.past).toHaveLength(20);
    const before = state.run;
    state = workspaceReducer(state, { type: 'SWITCH_SCENARIO', key: 'suiviinterventions' });
    expect(state.run.inventoryHistory.past).toHaveLength(0);
    const broken = JSON.parse(JSON.stringify(state));
    broken.savedRuns.demandesetude.inventoryHistory = { past: [{ groups: ['broken'], label: 'bad' }], future: [] };
    const loaded = deserialize(JSON.stringify(broken));
    expect(loaded.recovered).toBe(false);
    expect(loaded.state.savedRuns.demandesetude).toEqual({ ...before, inventoryHistory: { past: [], future: [] } });
  });
  it('montre les conséquences des valeurs d’étiquettes avec des clés insensibles à la casse', () => {
    const effects = tagConsequences({ application: 'AutreProjet', environment: 'PRD' }, create().run);
    expect(effects.find(effect => effect.key === 'Application')?.effect).toContain('AutreProjet');
    expect(effects.find(effect => effect.key === 'Environment')?.effect).toContain('Son abonnement reste inchangé');
    expect(effects.find(effect => effect.key === 'Owner')?.effect).toContain('ne sait pas quelle équipe prévenir');
    expect(effects.find(effect => effect.key === 'CostCenter')?.effect).toContain('Non affecté');
    expect(effects.every(effect => !effect.correct)).toBe(true);
  });
  it('conserve les étiquettes du projet initial lorsqu’on consulte Catalogue, sans lui proposer celles du ticket', () => {
    const state = create();
    state.ui.selectedGroupId = 'seed-catalogue';
    const source = tagSource(state.run, state.ui);
    expect(source.baseline).toBe(true);
    expect(source.expected.Application).toBe('Catalogue');
    expect(tagConsequences(source.tags, state.run, source.expected).every(effect => effect.correct)).toBe(true);
  });
});
