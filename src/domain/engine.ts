import { baselineGroups, DEV_ID, expectedTags, QUIZ, REGIONS, SCENARIOS, STORAGE_KEY, SUBSCRIPTIONS } from './scenario';
import type { Action, Assessment, CreateDraft, ResourceGroup, ReportSnapshot, RunState, ScenarioKey, TagRow, Tags, WorkspaceState } from './types';

export const blankDraft = (): CreateDraft => ({ subscriptionId: '', name: '', location: '', tags: [{ key: '', value: '' }] });
export function newRun(scenarioKey: ScenarioKey = 'demandesetude'): RunState {
  return {
    scenarioKey, teacherIntroStep: 0, inventoryHistory: { past: [], future: [] }, groups: baselineGroups(), startedAt: null, draft: blankDraft(), wizardStep: 0, pending: null,
    notifications: [], error: null, hints: { subscription: 0, find: 0, tags: 0, region: 0 },
    attachedId: '', comment: '', report: null, reportSubmittedAt: null,
    quiz: { answers: [-1, -1, -1], submitted: false }, completedAt: null,
  };
}
export function initialState(): WorkspaceState {
  return {
    version: 1, run: newRun(), savedRuns: {}, notes: '',
    ui: { activeApp: 'azure', portalPage: 'home', selectedGroupId: '', selectedSubscriptionId: '',
      filterSubId: 'all', groupSearch: '', maximized: false, notesTab: 'notes', missionPanelCollapsed: false },
  };
}
export const writable = (subscriptionId: string) => SUBSCRIPTIONS.some(s => s.id === subscriptionId && s.writable);
export function validateTags(rows: TagRow[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const nonempty = rows.filter(r => r.key || r.value);
  if (nonempty.length > 50) errors.push('Un groupe peut contenir au maximum 50 étiquettes.');
  for (const row of nonempty) {
    if (!row.key.trim()) { errors.push('Chaque valeur doit avoir un nom d’étiquette.'); continue; }
    if (row.key.length > 512 || /[<>%&\\?/]/u.test(row.key)) errors.push('Un nom d’étiquette contient un caractère non autorisé ou dépasse 512 caractères.');
    if (row.value.length > 256) errors.push('Une valeur d’étiquette ne peut pas dépasser 256 caractères.');
    const normalized = row.key.toLowerCase();
    if (seen.has(normalized)) errors.push('Deux étiquettes ne peuvent pas avoir le même nom.');
    seen.add(normalized);
  }
  return [...new Set(errors)];
}
export function rowsToTags(rows: TagRow[]): Tags {
  return Object.fromEntries(rows.filter(r => r.key.trim()).map(r => [r.key, r.value]));
}
export function validateDraft(draft: CreateDraft, groups: ResourceGroup[], includeTags = true): string[] {
  const errors: string[] = [];
  const name = draft.name.trim();
  if (!draft.subscriptionId) errors.push('Sélectionne un abonnement.');
  else if (!writable(draft.subscriptionId)) errors.push('Accès refusé : ton rôle Lecteur ne permet pas de créer un groupe dans cet abonnement.');
  if (!name) errors.push('Renseigne le nom du groupe de ressources.');
  else if (name.length > 90 || !/^[\p{L}\p{Nd}_.()\-]+$/u.test(name) || name.endsWith('.')) {
    errors.push('Nom invalide : 1 à 90 caractères, sans espace, avec lettres, chiffres, tirets, points, parenthèses ou traits de soulignement. Le nom ne peut pas finir par un point.');
  } else if (groups.some(g => g.subscriptionId === draft.subscriptionId && g.name.toLowerCase() === name.toLowerCase())) {
    errors.push('Ce groupe existe déjà dans cet abonnement. Ouvre-le depuis la liste.');
  }
  if (!REGIONS.some(r => r.id === draft.location)) errors.push('Sélectionne une région.');
  if (includeTags) errors.push(...validateTags(draft.tags));
  return errors;
}
export function snapshot(group: ResourceGroup): ReportSnapshot {
  return { groupId: group.id, name: group.name, subscriptionId: group.subscriptionId, location: group.location,
    tags: Object.fromEntries(Object.entries(group.tags).sort(([a], [b]) => a.localeCompare(b))), resourceCount: group.resources.length };
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export const targetGroup = (run: RunState) => run.groups.find(g => g.subscriptionId === DEV_ID && g.name.toLowerCase() === SCENARIOS[run.scenarioKey].targetName);
export function inventoryIssues(run: RunState) {
  const changed = baselineGroups().flatMap(original => {
    const current = run.groups.find(group => group.id === original.id);
    if (current && same(snapshot(current), snapshot(original)) && same(current.resources, original.resources)) return [];
    const fields: { label: string; current: string; expected: string }[] = [];
    if (!current) fields.push({ label: 'Groupe', current: 'Absent', expected: 'Présent' });
    else {
      for (const [label, actual, expected] of [
        ['Nom', current.name, original.name], ['Abonnement', current.subscriptionId, original.subscriptionId],
        ['Région', current.location, original.location],
      ]) if (actual !== expected) fields.push({ label, current: actual, expected });
      for (const key of new Set([...Object.keys(original.tags), ...Object.keys(current.tags)])) {
        if (original.tags[key] !== current.tags[key]) fields.push({ label: key, current: current.tags[key] ?? 'Absente', expected: original.tags[key] ?? 'Absente' });
      }
      if (!same(current.resources, original.resources)) fields.push({ label: 'Ressources', current: current.resources.length + ' ressource(s), configuration modifiée', expected: original.resources.length + ' ressource(s), configuration initiale' });
    }
    return [{ original, current, fields }];
  });
  const target = targetGroup(run);
  const extras = run.groups.filter(group => group.origin === 'session' && group.id !== target?.id);
  return { changed, extras, target };
}
export function assess(run: RunState): Assessment {
  const scenario = SCENARIOS[run.scenarioKey];
  const expected = targetGroup(run);
  const candidate = expected ?? run.groups.filter(g => g.origin === 'session').at(-1);
  const tags = candidate ? Object.fromEntries(Object.entries(candidate.tags).map(([k, v]) => [k.toLowerCase(), v])) : {};
  const missing = Object.entries(expectedTags(scenario)).filter(([k, v]) => tags[k.toLowerCase()] !== v).map(([k, v]) => k + ' = ' + v);
  const inventory = inventoryIssues(run);
  const inventoryDetail = [
    ...inventory.changed.map(issue => (issue.current ? 'Groupe initial modifié : ' : 'Groupe initial absent : ') + issue.original.name + '.'),
    ...inventory.extras.map(group => 'Groupe supplémentaire : ' + group.name + '.'),
  ].join(' ') || (expected ? 'Les groupes initiaux sont intacts et seul le groupe demandé a été ajouté.' : 'Les groupes initiaux sont intacts. Crée uniquement le groupe demandé dans le ticket.');
  const reportCurrent = Boolean(expected && run.reportSubmittedAt && run.report && same(run.report, snapshot(expected)) && run.attachedId === expected.id);
  const checks = [
    { id: 'created', label: 'Groupe créé', passed: Boolean(candidate), detail: candidate ? 'La création du groupe est terminée.' : 'Crée le groupe de ressources demandé.' },
    { id: 'subscription', label: 'Abonnement DEV', passed: candidate?.subscriptionId === DEV_ID, detail: 'Le groupe doit appartenir à FORMATION-IT-DEV.' },
    { id: 'name', label: 'Nom conforme au ticket', passed: candidate?.name.toLowerCase() === scenario.targetName, detail: scenario.targetName },
    { id: 'region', label: 'Région France Central', passed: candidate?.location === 'francecentral', detail: 'Vérifie la région du groupe dans sa vue d’ensemble.' },
    { id: 'tags', label: 'Quatre étiquettes conformes', passed: Boolean(candidate) && missing.length === 0,
      detail: missing.length ? 'À renseigner ou corriger : ' + missing.join(' ; ') + '.' : 'Les quatre valeurs correspondent au ticket.' },
    { id: 'empty', label: 'Groupe vide', passed: Boolean(candidate) && candidate?.resources.length === 0, detail: 'Le groupe doit contenir 0 ressource.' },
    { id: 'inventory', label: 'Inventaire préservé', passed: inventory.changed.length === 0 && inventory.extras.length === 0 && Boolean(expected), detail: inventoryDetail },
    { id: 'report', label: 'Compte rendu actualisé', passed: reportCurrent,
      detail: reportCurrent ? 'Le relevé soumis correspond au groupe actuel.' : expected && run.reportSubmittedAt && run.report?.groupId === expected.id ? 'Le groupe a changé depuis ta réponse. Actualise et soumets à nouveau le compte rendu dans le ticket.' : 'Étape suivante : joins le groupe demandé au ticket, puis soumets ton compte rendu.' },
    { id: 'knowledge', label: 'Trois situations comprises', passed: run.quiz.submitted && QUIZ.every((q, i) => run.quiz.answers[i] === q.correct),
      detail: 'Étape suivante : réponds aux trois situations du bilan. Tu peux le faire depuis cet encadré.' },
  ];
  const passed = checks.filter(c => c.passed).length;
  return { checks, passed, complete: passed === checks.length, technicalReady: checks.slice(0, 7).every(c => c.passed) };
}
function notify(run: RunState, title: string, body: string, now: number, groupId?: string): RunState {
  return { ...run, notifications: [{ id: title + '-' + now, title, body, createdAt: now, groupId }, ...run.notifications].slice(0, 40) };
}
function rememberInventory(run: RunState, groups: ResourceGroup[], label: string): RunState {
  return { ...run, groups, completedAt: null, inventoryHistory: {
    past: [...run.inventoryHistory.past, { groups: run.groups, label }].slice(-20), future: [],
  } };
}
function inventoryNavigation(state: WorkspaceState, run: RunState): WorkspaceState {
  return { ...state, run, ui: state.ui.portalPage === 'detail' && !run.groups.some(group => group.id === state.ui.selectedGroupId)
    ? { ...state.ui, portalPage: 'groups', selectedGroupId: '' } : state.ui };
}
export function workspaceReducer(state: WorkspaceState, action: Action): WorkspaceState {
  const run = state.run;
  let next = run;
  switch (action.type) {
    case 'UI': return { ...state, ui: { ...state.ui, ...action.patch } };
    case 'NOTES': return { ...state, notes: action.text };
    case 'RESET': return { ...state, run: newRun(run.scenarioKey), ui: { ...initialState().ui } };
    case 'SWITCH_SCENARIO': {
      if (run.scenarioKey === action.key) return state;
      return { ...state, savedRuns: { ...state.savedRuns, [run.scenarioKey]: run },
        run: state.savedRuns[action.key] ?? newRun(action.key), ui: { ...initialState().ui } };
    }
    case 'TAKE_TICKET': next = { ...run, startedAt: run.startedAt ?? action.now }; break;
    case 'TEACHER_INTRO':
      if (!Number.isInteger(action.step)) return state;
      next = { ...run, teacherIntroStep: Math.max(0, Math.min(3, action.step)) }; break;
    case 'DRAFT': next = { ...run, draft: action.draft, error: null }; break;
    case 'WIZARD_STEP': next = { ...run, wizardStep: Math.max(0, Math.min(2, action.step)), error: null }; break;
    case 'START_CREATE': {
      if (run.pending) return state;
      const errors = validateDraft(run.draft, run.groups);
      if (errors.length) { next = { ...run, error: errors.join(' ') }; break; }
      const group: ResourceGroup = {
        id: action.id, name: run.draft.name.trim(), subscriptionId: run.draft.subscriptionId,
        location: run.draft.location, tags: rowsToTags(run.draft.tags), resources: [], origin: 'session', createdAt: action.now,
      };
      next = { ...run, error: null, pending: { group, completeAt: action.now + 1000 } };
      break;
    }
    case 'COMPLETE_CREATE': {
      if (!run.pending || action.now < run.pending.completeAt) return state;
      const group = run.pending.group;
      if (run.groups.some(g => g.id === group.id || (g.name.toLowerCase() === group.name.toLowerCase() && g.subscriptionId === group.subscriptionId))) {
        next = { ...run, pending: null, error: 'Le groupe existe déjà. Retrouve-le dans la liste.' };
        break;
      }
      next = notify({ ...rememberInventory(run, [...run.groups, group], 'Création de ' + group.name), pending: null, draft: blankDraft(), wizardStep: 0 }, 'Groupe créé', group.name, action.now, group.id);
      return { ...state, run: next, ui: { ...state.ui, portalPage: 'detail', selectedGroupId: group.id } };
    }
    case 'SAVE_TAGS': {
      const group = run.groups.find(g => g.id === action.groupId);
      if (!group || !writable(group.subscriptionId)) { next = { ...run, error: 'Accès refusé : cet abonnement est accessible en lecture seule.' }; break; }
      const errors = validateTags(action.rows);
      if (errors.length) { next = { ...run, error: errors.join(' ') }; break; }
      const tags = rowsToTags(action.rows);
      if (same(snapshot(group).tags, snapshot({ ...group, tags }).tags)) return run.error ? { ...state, run: { ...run, error: null } } : state;
      next = notify({ ...rememberInventory(run, run.groups.map(g => g.id === group.id ? { ...g, tags } : g), 'Étiquettes de ' + group.name), error: null },
        'Étiquettes enregistrées', group.name, action.now, group.id);
      break;
    }
    case 'DELETE_GROUP': {
      const group = run.groups.find(g => g.id === action.groupId);
      if (!group || !writable(group.subscriptionId)) { next = { ...run, error: 'Accès refusé : cet abonnement est accessible en lecture seule.' }; break; }
      if (group.origin !== 'session' || group.resources.length) { next = { ...run, error: 'Dans cette mission, seuls les groupes vides créés pendant cet essai peuvent être supprimés.' }; break; }
      if (action.confirmation !== group.name) { next = { ...run, error: 'Recopie le nom exact du groupe pour confirmer sa suppression simulée.' }; break; }
      next = notify({ ...rememberInventory(run, run.groups.filter(g => g.id !== group.id), 'Suppression de ' + group.name), error: null }, 'Groupe supprimé', group.name, action.now);
      return { ...state, run: next, ui: { ...state.ui, portalPage: 'groups', selectedGroupId: '' } };
    }
    case 'RESTORE_BASELINE': {
      if (run.pending) return state;
      const issue = inventoryIssues(run).changed.find(value => value.original.id === action.groupId);
      if (!issue) return state;
      const original = issue.original;
      const groups = issue.current ? run.groups.map(group => group.id === original.id ? original : group) : [...run.groups, original];
      next = notify({ ...rememberInventory(run, groups, 'Restauration de ' + original.name), error: null }, 'Groupe initial restauré', original.name, action.now, original.id);
      break;
    }
    case 'UNDO_INVENTORY':
    case 'REDO_INVENTORY': {
      if (run.pending) return state;
      const undo = action.type === 'UNDO_INVENTORY';
      const from = undo ? run.inventoryHistory.past : run.inventoryHistory.future;
      const checkpoint = from.at(-1);
      if (!checkpoint) return state;
      const opposite = { groups: run.groups, label: checkpoint.label };
      const history = undo ? { past: from.slice(0, -1), future: [...run.inventoryHistory.future, opposite].slice(-20) }
        : { past: [...run.inventoryHistory.past, opposite].slice(-20), future: from.slice(0, -1) };
      next = notify({ ...run, groups: checkpoint.groups, error: null, completedAt: null, inventoryHistory: history },
        undo ? 'Modification annulée' : 'Modification rétablie', checkpoint.label, action.now);
      return inventoryNavigation(state, next);
    }
    case 'ATTACH': next = { ...run, attachedId: action.groupId }; break;
    case 'COMMENT': next = { ...run, comment: action.text }; break;
    case 'SUBMIT_REPORT': {
      const group = run.groups.find(g => g.id === run.attachedId);
      next = { ...run, report: group ? snapshot(group) : null, reportSubmittedAt: action.now };
      break;
    }
    case 'ANSWER': {
      if (!QUIZ[action.question] || action.answer < 0 || action.answer >= QUIZ[action.question].options.length) return state;
      next = { ...run, quiz: { ...run.quiz, submitted: false, answers: run.quiz.answers.map((v, i) => i === action.question ? action.answer : v) } };
      break;
    }
    case 'CHECK_QUIZ': next = { ...run, quiz: { ...run.quiz, submitted: true } }; break;
    case 'HINT': next = { ...run, hints: { ...run.hints, [action.topic]: Math.min(3, run.hints[action.topic] + 1) } }; break;
    case 'CLEAR_ERROR': next = { ...run, error: null }; break;
    case 'COMPLETE_MISSION':
      if (!assess(run).complete) return state;
      next = { ...run, completedAt: run.completedAt ?? action.now }; break;
  }
  return { ...state, run: next };
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function isTags(value: unknown): value is Tags {
  return isRecord(value) && Object.values(value).every(v => typeof v === 'string');
}
function isGroup(value: unknown): value is ResourceGroup {
  if (!isRecord(value)) return false;
  const g = value;
  return typeof g.id === 'string' && Boolean(g.id) && typeof g.name === 'string'
    && typeof g.subscriptionId === 'string' && typeof g.location === 'string' && isTags(g.tags)
    && Array.isArray(g.resources) && g.resources.every(r => isRecord(r) && typeof r.name === 'string'
      && typeof r.type === 'string' && typeof r.location === 'string')
    && (g.origin === 'baseline' || g.origin === 'session') && typeof g.createdAt === 'number' && Number.isFinite(g.createdAt);
}
const timestamp = (value: unknown) => value === null || (typeof value === 'number' && Number.isFinite(value));
function isRun(value: unknown): value is RunState {
  if (!value || typeof value !== 'object') return false;
  const r = value as RunState;
  return Boolean((r.scenarioKey === 'demandesetude' || r.scenarioKey === 'suiviinterventions') && Array.isArray(r.groups) && r.groups.every(isGroup)
    && new Set(r.groups.map(g => g.id)).size === r.groups.length
    && r.draft && typeof r.draft.name === 'string' && Array.isArray(r.draft.tags)
    && r.draft.tags.every(t => t && typeof t.key === 'string' && typeof t.value === 'string')
    && typeof r.draft.subscriptionId === 'string' && typeof r.draft.location === 'string'
    && [0, 1, 2].includes(r.wizardStep) && r.hints && ['subscription', 'find', 'tags', 'region'].every(key => {
      const value = r.hints[key as keyof typeof r.hints]; return Number.isInteger(value) && value >= 0 && value <= 3;
    })
    && Array.isArray(r.notifications) && r.notifications.every(n => n && typeof n.id === 'string' && typeof n.title === 'string'
      && typeof n.body === 'string' && typeof n.createdAt === 'number' && (!n.groupId || typeof n.groupId === 'string'))
    && r.quiz && Array.isArray(r.quiz.answers) && r.quiz.answers.length === 3
    && r.quiz.answers.every((answer, index) => Number.isInteger(answer) && answer >= -1 && answer < QUIZ[index].options.length)
    && typeof r.quiz.submitted === 'boolean' && typeof r.comment === 'string' && typeof r.attachedId === 'string'
    && timestamp(r.startedAt) && timestamp(r.reportSubmittedAt) && timestamp(r.completedAt)
    && (r.error === null || typeof r.error === 'string')
    && (r.report === null || (typeof r.report.groupId === 'string' && typeof r.report.name === 'string'
      && typeof r.report.subscriptionId === 'string' && typeof r.report.location === 'string'
      && isTags(r.report.tags) && Number.isInteger(r.report.resourceCount) && r.report.resourceCount >= 0))
    && (r.pending === null || (typeof r.pending.completeAt === 'number' && Number.isFinite(r.pending.completeAt) && isGroup(r.pending.group))));
}
export function deserialize(raw: string | null): { state: WorkspaceState; recovered: boolean } {
  if (!raw) return { state: initialState(), recovered: false };
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') throw new Error('format');
    const value = data as WorkspaceState;
    if (value.version !== 1 || !isRun(value.run) || typeof value.notes !== 'string' || !value.ui || !value.savedRuns || typeof value.savedRuns !== 'object') throw new Error('version');
    const app = value.ui.activeApp;
    if (app !== null && !['tickets', 'azure', 'notes'].includes(app)) throw new Error('app');
    if (!['home', 'subscriptions', 'groups', 'create', 'detail', 'activity'].includes(value.ui.portalPage)) throw new Error('route');
    if (!['selectedGroupId', 'selectedSubscriptionId', 'filterSubId', 'groupSearch'].every(key => typeof value.ui[key as keyof typeof value.ui] === 'string')
      || typeof value.ui.maximized !== 'boolean' || !['notes', 'course'].includes(value.ui.notesTab)) throw new Error('ui');
    if (!Object.keys(value.savedRuns).every(key => key === 'demandesetude' || key === 'suiviinterventions')) throw new Error('saved keys');
    for (const run of Object.values(value.savedRuns)) if (!isRun(run)) throw new Error('saved run');
    return { state: { ...value, run: restoreRun(value.run),
      savedRuns: Object.fromEntries(Object.entries(value.savedRuns).map(([key, saved]) => [key, restoreRun(saved)])),
      ui: { ...value.ui, missionPanelCollapsed: value.ui.missionPanelCollapsed === true } }, recovered: false };
  } catch { return { state: initialState(), recovered: true }; }
}
function restoreRun(run: RunState): RunState {
  const inProgress = run.startedAt !== null || run.pending !== null || run.groups.some(g => g.origin === 'session')
    || Boolean(run.draft.name || run.draft.subscriptionId || run.draft.location || run.draft.tags.some(row => row.key || row.value))
    || Boolean(run.reportSubmittedAt || run.completedAt || run.attachedId || run.comment)
    || run.quiz.answers.some(answer => answer >= 0) || Object.values(run.hints).some(level => level > 0);
  const history = run.inventoryHistory;
  const validStack = (stack: unknown) => Array.isArray(stack) && stack.length <= 20 && stack.every(checkpoint => isRecord(checkpoint)
    && typeof checkpoint.label === 'string' && Array.isArray(checkpoint.groups) && checkpoint.groups.every(isGroup)
    && new Set(checkpoint.groups.map(group => group.id)).size === checkpoint.groups.length);
  return { ...run, teacherIntroStep: Number.isInteger(run.teacherIntroStep) && run.teacherIntroStep >= 0 && run.teacherIntroStep <= 3 ? run.teacherIntroStep : inProgress ? 3 : 0,
    inventoryHistory: history && validStack(history.past) && validStack(history.future) ? history : { past: [], future: [] } };
}
export function loadWorkspace(): { state: WorkspaceState; recovered: boolean } {
  try { return deserialize(localStorage.getItem(STORAGE_KEY)); }
  catch { return { state: initialState(), recovered: false }; }
}
