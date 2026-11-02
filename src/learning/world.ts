import type { AppStatus, OperationKind, Response, WebApp, World, WorldEvent } from './types';

export const statusName = (status: AppStatus) => ({ running: 'En cours d’exécution', stopped: 'Arrêtée', starting: 'Démarrage en cours', stopping: 'Arrêt en cours' })[status];
export function seedWorld(demo = false): World {
  const groups = demo ? [{ id: 'demo-group', name: 'rg-demonstration-frc', subscription: 'FORMATION-IT-DEV', region: 'France Central' }]
    : [{ id: 'group-a', name: 'rg-demandesetude-dev-frc', subscription: 'FORMATION-IT-DEV', region: 'France Central' },
      { id: 'group-b', name: 'rg-interventions-dev-frc', subscription: 'FORMATION-IT-DEV', region: 'France Central' }];
  const plans = groups.map((group, index) => ({ id: demo ? 'demo-plan' : 'plan-' + index, name: demo ? 'asp-demonstration-frc' : 'asp-atelier-dev-' + (index + 1), groupId: group.id, region: group.region, sku: 'F1' }));
  const apps: WebApp[] = demo ? [{ id: 'demo-app', name: 'app-accueil-demo', application: 'Accueil équipe', host: 'app-accueil-demo.azurewebsites.net', groupId: groups[0].id, planId: plans[0].id, version: '1.0.0', commit: 'c71a204', status: 'running', operation: null }]
    : [{ id: 'app-a', name: 'app-demandesetude-dev', application: 'DemandesEtude', host: 'app-demandesetude-dev.azurewebsites.net', groupId: groups[0].id, planId: plans[0].id, version: '1.4.2', commit: 'e42bd80', status: 'running', operation: null },
      { id: 'app-b', name: 'app-interventions-dev', application: 'SuiviInterventions', host: 'app-interventions-dev.azurewebsites.net', groupId: groups[1].id, planId: plans[1].id, version: '2.1.0', commit: '72fd1ac', status: 'stopped', operation: null }];
  return { groups, plans, apps, events: [], sequence: 0 };
}
export function record(world: World, event: Omit<WorldEvent, 'seq'>): World {
  const seq = world.sequence + 1;
  return { ...world, sequence: seq, events: [...world.events, { ...event, seq }].slice(-400) };
}
export function inspect(world: World, appId: string, now: number): World {
  const app = world.apps.find(value => value.id === appId);
  return app ? record(world, { kind: 'inspected', appId, at: now, status: app.status, version: app.version }) : world;
}
export function operate(world: World, appId: string, kind: OperationKind, now: number): World {
  const app = world.apps.find(value => value.id === appId);
  if (!app || app.operation || (kind === 'start' && app.status !== 'stopped') || (kind !== 'start' && app.status !== 'running')) return world;
  const status: AppStatus = kind === 'stop' ? 'stopping' : 'starting';
  const operation = { id: appId + '-' + (world.sequence + 1), kind, completeAt: now + 800 };
  return record({ ...world, apps: world.apps.map(value => value.id === appId ? { ...value, status, operation } : value) },
    { kind: kind === 'stop' ? 'stop-requested' : kind === 'start' ? 'start-requested' : 'restart-requested', appId, at: now, status, version: app.version });
}
export function settle(world: World, now: number): World {
  let next = world;
  for (const app of world.apps) {
    if (!app.operation || app.operation.completeAt > now) continue;
    const status: AppStatus = app.operation.kind === 'stop' ? 'stopped' : 'running';
    next = record({ ...next, apps: next.apps.map(value => value.id === app.id ? { ...value, status, operation: null } : value) },
      { kind: status === 'stopped' ? 'stopped' : 'started', appId: app.id, at: now, status, version: app.version });
  }
  return next;
}
export function browse(world: World, appId: string, now: number): { world: World; response: Response } {
  const app = world.apps.find(value => value.id === appId);
  if (!app) return { world, response: { appId: '', address: '', code: 404, version: '', status: null, at: now } };
  const code = app.status === 'running' ? 200 : app.status === 'stopped' ? 403 : 503;
  return { world: record(world, { kind: 'browsed', appId, at: now, status: app.status, version: app.version, code }),
    response: { appId, address: 'https://' + app.host, code, version: app.version, status: app.status, at: now } };
}
