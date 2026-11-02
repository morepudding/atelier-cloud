import { rowsToTags, targetGroup } from './engine';
import { baselineGroups, expectedTags, SCENARIOS } from './scenario';
import type { RunState, Tags, UiState } from './types';

export const TAG_PURPOSES = [
  { key: 'Application', question: 'Pour quelle application ?', purpose: 'Retrouver les groupes liés au même projet.' },
  { key: 'Environment', question: 'DEV, INT ou PRD ?', purpose: 'Classer le groupe dans les vues et filtres de l’équipe.' },
  { key: 'Owner', question: 'Qui contacter ?', purpose: 'Identifier l’équipe responsable dans notre annuaire fictif.' },
  { key: 'CostCenter', question: 'À quel budget le rattacher ?', purpose: 'Préparer le suivi des coûts par centre de coût.' },
] as const;
export function tagSource(run: RunState, ui: UiState) {
  const expected = expectedTags(SCENARIOS[run.scenarioKey]);
  if (ui.activeApp === 'azure' && ui.portalPage === 'create') return { name: run.draft.name || 'Nouveau groupe', tags: rowsToTags(run.draft.tags), draft: true, baseline: false, expected };
  const selected = ui.activeApp === 'azure' && ui.portalPage === 'detail' ? run.groups.find(group => group.id === ui.selectedGroupId) : null;
  const group = selected ?? targetGroup(run) ?? run.groups.filter(group => group.origin === 'session').at(-1);
  if (!group) return { name: run.draft.name || SCENARIOS[run.scenarioKey].targetName, tags: rowsToTags(run.draft.tags), draft: true, baseline: false, expected };
  const original = group?.origin === 'baseline' ? baselineGroups().find(value => value.id === group.id) : null;
  return { name: group?.name ?? SCENARIOS[run.scenarioKey].targetName, tags: group?.tags ?? {}, draft: false, baseline: Boolean(original), expected: original?.tags ?? expected };
}
export function tagConsequences(tags: Tags, run: RunState, expected = expectedTags(SCENARIOS[run.scenarioKey])) {
  const current = Object.fromEntries(Object.entries(tags).map(([key, value]) => [key.toLowerCase(), value]));
  return TAG_PURPOSES.map(purpose => {
    const value = current[purpose.key.toLowerCase()] || '';
    const correct = value === (expected[purpose.key] ?? '');
    const effect = purpose.key === 'Application' ? value ? `L’inventaire de l’équipe le classe sous « ${value} ».` : 'Il apparaît dans « Application non renseignée » ; le filtre du projet ne le retrouve pas.'
      : purpose.key === 'Environment' ? value ? `Le filtre d’environnement de l’équipe le classe sous « ${value} ». Son abonnement reste inchangé.` : 'Le filtre DEV de cette vue ne le retrouve pas. Son abonnement reste inchangé.'
      : purpose.key === 'Owner' ? value ? `L’annuaire fictif indique « ${value} » comme équipe à prévenir.` : 'Notre annuaire ne sait pas quelle équipe prévenir en cas d’incident.'
      : value ? `Le centre de coût indiqué est « ${value} ». Cela prépare le classement du suivi budgétaire.` : 'Le centre de coût reste « Non affecté » dans notre suivi budgétaire.';
    return { ...purpose, value, expected: expected[purpose.key], correct, effect };
  });
}
