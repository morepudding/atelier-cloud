import { describe, expect, it } from 'vitest';
import { assess, deserialize, initialState, newRun, snapshot, targetGroup, validateDraft, workspaceReducer } from './engine';
import { DEV_ID, expectedTags, QUIZ, SCENARIOS, SUBSCRIPTIONS } from './scenario';
import type { CreateDraft, WorkspaceState } from './types';

const scenario = SCENARIOS.demandesetude;
function correctDraft(patch: Partial<CreateDraft> = {}): CreateDraft {
  return { subscriptionId: DEV_ID, name: scenario.targetName, location: 'francecentral',
    tags: Object.entries(expectedTags(scenario)).map(([key, value]) => ({ key, value })), ...patch };
}
function create(state = initialState(), draft = correctDraft(), now = 1000, id = 'test-group'): WorkspaceState {
  let next = workspaceReducer(state, { type: 'DRAFT', draft });
  next = workspaceReducer(next, { type: 'START_CREATE', id, now });
  return workspaceReducer(next, { type: 'COMPLETE_CREATE', now: now + 1001 });
}
function submit(state: WorkspaceState) {
  const group = targetGroup(state.run)!;
  let next = workspaceReducer(state, { type: 'ATTACH', groupId: group.id });
  next = workspaceReducer(next, { type: 'SUBMIT_REPORT', now: 5000 });
  return next;
}
describe('La mission se valide sur une configuration réelle', () => {
  it('ne valide pas une mission vide ou un simple formulaire rempli', () => {
    const state = workspaceReducer(initialState(), { type: 'DRAFT', draft: correctDraft() });
    expect(assess(state.run).passed).toBe(0);
    expect(assess(state.run).complete).toBe(false);
  });
  it('couvre création, compte rendu et compréhension jusqu’à la réussite', () => {
    let state = create();
    expect(assess(state.run).technicalReady).toBe(true);
    expect(assess(state.run).complete).toBe(false);
    state = submit(state);
    QUIZ.forEach((q, question) => { state = workspaceReducer(state, { type: 'ANSWER', question, answer: q.correct }); });
    expect(assess(state.run).complete).toBe(false);
    state = workspaceReducer(state, { type: 'CHECK_QUIZ' });
    expect(assess(state.run).passed).toBe(9);
    expect(assess(state.run).complete).toBe(true);
  });
  it('permet d’omettre une étiquette dans Azure et demande sa correction dans la mission', () => {
    let state = create(initialState(), correctDraft({ tags: [{ key: 'Environment', value: 'DEV' }] }));
    expect(targetGroup(state.run)).toBeDefined();
    expect(assess(state.run).checks.find(c => c.id === 'tags')?.passed).toBe(false);
    expect(assess(state.run).checks.find(c => c.id === 'tags')?.detail).toContain('CostCenter = IT-FORMATION');
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: 'test-group', rows: correctDraft().tags, now: 3000 });
    expect(assess(state.run).technicalReady).toBe(true);
  });
  it('compare les clés sans la casse et respecte la casse des valeurs', () => {
    const draft = correctDraft();
    const lowercaseKeys = { ...draft, tags: draft.tags.map(row => ({ ...row, key: row.key.toLowerCase() })) };
    expect(assess(create(initialState(), lowercaseKeys).run).checks.find(c => c.id === 'tags')?.passed).toBe(true);
    const badValues = { ...draft, tags: draft.tags.map(row => row.key === 'Environment' ? { ...row, value: 'dev' } : row) };
    expect(assess(create(initialState(), badValues).run).checks.find(c => c.id === 'tags')?.passed).toBe(false);
  });
  it('accepte un nom de groupe avec une casse différente', () => {
    const state = create(initialState(), correctDraft({ name: scenario.targetName.toUpperCase() }));
    expect(assess(state.run).technicalReady).toBe(true);
  });
  it('refuse le bilan obsolète après une modification du groupe', () => {
    let state = submit(create());
    expect(assess(state.run).checks.find(c => c.id === 'report')?.passed).toBe(true);
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: 'test-group',
      rows: [...correctDraft().tags, { key: 'Extra', value: 'ajout' }], now: 6000 });
    expect(assess(state.run).checks.find(c => c.id === 'report')?.passed).toBe(false);
    state = workspaceReducer(state, { type: 'SUBMIT_REPORT', now: 7000 });
    expect(assess(state.run).checks.find(c => c.id === 'report')?.passed).toBe(true);
  });
  it('revérifie l’existence du groupe après suppression', () => {
    let state = submit(create());
    state = workspaceReducer(state, { type: 'DELETE_GROUP', groupId: 'test-group', confirmation: scenario.targetName, now: 6000 });
    expect(assess(state.run).checks.find(c => c.id === 'created')?.passed).toBe(false);
    expect(assess(state.run).checks.find(c => c.id === 'report')?.passed).toBe(false);
  });
  it('ne valide pas un autre groupe joint au compte rendu', () => {
    let state = create();
    state = workspaceReducer(state, { type: 'ATTACH', groupId: 'seed-catalogue' });
    state = workspaceReducer(state, { type: 'SUBMIT_REPORT', now: 5000 });
    expect(assess(state.run).checks.find(c => c.id === 'report')?.passed).toBe(false);
  });
  it('exige le retrait des groupes créés par erreur', () => {
    let state = create();
    state = create(state, correctDraft({ name: 'rg-erreur-dev' }), 4000, 'extra-group');
    expect(assess(state.run).checks.find(c => c.id === 'inventory')?.passed).toBe(false);
    state = workspaceReducer(state, { type: 'DELETE_GROUP', groupId: 'extra-group', confirmation: 'rg-erreur-dev', now: 6000 });
    expect(assess(state.run).technicalReady).toBe(true);
  });
});
describe('Les règles Azure et le périmètre sont appliqués aux opérations', () => {
  it.each(['nom avec espaces', 'nom.', 'a'.repeat(91), 'nom/incorrect'])('refuse un nom invalide : %s', name => {
    expect(validateDraft(correctDraft({ name }), []).some(error => error.startsWith('Nom invalide'))).toBe(true);
  });
  it('empêche le doublon sans tenir compte de la casse', () => {
    const state = create();
    expect(validateDraft(correctDraft({ name: scenario.targetName.toUpperCase() }), state.run.groups).some(error => error.includes('existe déjà'))).toBe(true);
  });
  it('applique les droits Lecteur même sans passer par les boutons', () => {
    for (const subscriptionId of [SUBSCRIPTIONS[1].id, SUBSCRIPTIONS[2].id]) {
      const state = workspaceReducer(workspaceReducer(initialState(), { type: 'DRAFT', draft: correctDraft({ subscriptionId }) }),
        { type: 'START_CREATE', id: 'denied', now: 1000 });
      expect(state.run.pending).toBeNull();
      expect(state.run.groups).toHaveLength(3);
      expect(state.run.error).toContain('Lecteur');
    }
    const state = workspaceReducer(initialState(), { type: 'SAVE_TAGS', groupId: 'seed-demandes-prd', rows: [{ key: 'Environment', value: 'DEV' }], now: 2000 });
    expect(state.run.groups[2].tags.Environment).toBe('PRD');
    expect(state.run.error).toContain('refusé');
  });
  it('préserve les groupes initiaux lors d’une tentative de suppression', () => {
    const state = initialState();
    const next = workspaceReducer(state, { type: 'DELETE_GROUP', groupId: 'seed-catalogue', confirmation: 'rg-catalogue-dev-frc-01', now: 3000 });
    expect(next.run.groups).toEqual(state.run.groups);
    expect(next.run.error).toContain('seuls les groupes vides');
  });
  it('demande une confirmation exacte pour supprimer un groupe de l’essai', () => {
    const state = create();
    const next = workspaceReducer(state, { type: 'DELETE_GROUP', groupId: 'test-group', confirmation: 'incorrect', now: 5000 });
    expect(next.run.groups).toHaveLength(4);
  });
  it('permet de corriger une mauvaise région par recréation du groupe vide', () => {
    let state = create(initialState(), correctDraft({ location: 'westeurope' }));
    expect(assess(state.run).checks.find(c => c.id === 'region')?.passed).toBe(false);
    state = workspaceReducer(state, { type: 'DELETE_GROUP', groupId: 'test-group', confirmation: scenario.targetName, now: 3000 });
    state = create(state, correctDraft(), 4000, 'corrected');
    expect(assess(state.run).technicalReady).toBe(true);
  });
  it('signale une modification du groupe DEV initial et permet de la réparer', () => {
    let state = create();
    const original = state.run.groups[0];
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: original.id, rows: [{ key: 'Erreur', value: 'oui' }], now: 5000 });
    expect(assess(state.run).checks.find(c => c.id === 'inventory')?.passed).toBe(false);
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: original.id, rows: Object.entries(original.tags).map(([key, value]) => ({ key, value })), now: 6000 });
    expect(assess(state.run).technicalReady).toBe(true);
  });
  it('ne considère pas un simple changement d’ordre des étiquettes comme une modification de l’inventaire', () => {
    let state = create();
    const original = state.run.groups[0];
    state = workspaceReducer(state, { type: 'SAVE_TAGS', groupId: original.id,
      rows: Object.entries(original.tags).reverse().map(([key, value]) => ({ key, value })), now: 5000 });
    expect(assess(state.run).technicalReady).toBe(true);
  });
});
describe('La progression survit aux interruptions', () => {
  it('reprend les anciennes sauvegardes sans effacer le parcours lors du changement de présentation', () => {
    const state = submit(create());
    const legacy = JSON.parse(JSON.stringify(state));
    delete legacy.ui.missionPanelCollapsed;
    const loaded = deserialize(JSON.stringify(legacy));
    expect(loaded.recovered).toBe(false);
    expect(loaded.state.run).toEqual(state.run);
    expect(loaded.state.ui.missionPanelCollapsed).toBe(false);
  });
  it('ne crée qu’un groupe après double clic et reprise d’une opération', () => {
    let state = workspaceReducer(initialState(), { type: 'DRAFT', draft: correctDraft() });
    state = workspaceReducer(state, { type: 'START_CREATE', id: 'unique', now: 1000 });
    state = workspaceReducer(state, { type: 'START_CREATE', id: 'duplicate', now: 1001 });
    state = deserialize(JSON.stringify(state)).state;
    expect(state.run.pending?.group.id).toBe('unique');
    state = workspaceReducer(state, { type: 'COMPLETE_CREATE', now: 1500 });
    expect(state.run.groups).toHaveLength(3);
    state = workspaceReducer(state, { type: 'COMPLETE_CREATE', now: 2500 });
    state = workspaceReducer(state, { type: 'COMPLETE_CREATE', now: 2600 });
    expect(state.run.groups).toHaveLength(4);
  });
  it('recharge le groupe et le compte rendu sans perdre les informations', () => {
    const state = submit(create());
    const loaded = deserialize(JSON.stringify(state));
    expect(loaded.recovered).toBe(false);
    expect(loaded.state.run.report).toEqual(snapshot(targetGroup(state.run)!));
    expect(assess(loaded.state.run)).toEqual(assess(state.run));
  });
  it('isole la variante et conserve la mission principale', () => {
    let state = submit(create());
    const original = state.run;
    state = workspaceReducer(state, { type: 'SWITCH_SCENARIO', key: 'suiviinterventions' });
    expect(state.run.scenarioKey).toBe('suiviinterventions');
    expect(state.run.groups).toHaveLength(3);
    state = workspaceReducer(state, { type: 'SWITCH_SCENARIO', key: 'demandesetude' });
    expect(state.run).toEqual(original);
  });
  it('réinitialise un essai et conserve le carnet', () => {
    let state = create();
    state = workspaceReducer(state, { type: 'NOTES', text: 'Mes repères' });
    state = workspaceReducer(state, { type: 'HINT', topic: 'tags' });
    state = workspaceReducer(state, { type: 'RESET' });
    expect(state.run).toEqual(newRun());
    expect(state.notes).toBe('Mes repères');
  });
  it('borne les indices à trois et accepte une réussite avec aide', () => {
    let state = create();
    for (let i = 0; i < 8; i++) state = workspaceReducer(state, { type: 'HINT', topic: 'tags' });
    expect(state.run.hints.tags).toBe(3);
    expect(assess(state.run).technicalReady).toBe(true);
  });
  it.each(['{invalid', 'null', '{"version":12}', '{"version":1,"run":{}}'])('récupère une sauvegarde illisible : %s', raw => {
    const loaded = deserialize(raw);
    expect(loaded.recovered).toBe(true);
    expect(loaded.state).toEqual(initialState());
  });
  it('rejette une sauvegarde valide en JSON mais contenant une opération ou une interface incomplète', () => {
    const value = initialState();
    expect(deserialize(JSON.stringify({ ...value, run: { ...value.run, pending: { completeAt: 100, group: { id: 'broken', name: 'broken' } } } })).recovered).toBe(true);
    expect(deserialize(JSON.stringify({ ...value, ui: { ...value.ui, groupSearch: null } })).recovered).toBe(true);
  });
});
