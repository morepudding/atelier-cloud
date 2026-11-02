import { useEffect, useRef, useState } from 'react';
import { Activity, AppWindow, Bell, Box, CheckCircle2, ChevronRight, CircleHelp, ExternalLink, FolderOpen, Home, Layers3, List, Menu, Play, RefreshCw, Search, Server, ShieldCheck, Square, X } from 'lucide-react';
import { AzureLogo, Badge, Breadcrumb } from '../../components/Shared';
import { useLearning } from '../context';
import { statusName } from '../world';
import type { PortalPage, WebApp } from '../types';

export function AzureWorkspace() {
  const { state, dispatch } = useLearning();
  const scope = state.ui.scope;
  const world = scope === 'lab' ? state.world : state.demo;
  const [menu, setMenu] = useState(() => window.innerWidth > 800);
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState(false);
  const content = useRef<HTMLElement>(null);
  useEffect(() => { if (content.current) content.current.scrollTop = 0; }, [state.ui.page, state.ui.selectedId, scope]);
  const navigate = (page: PortalPage, selectedId = '') => {
    dispatch({ type: 'UI', patch: { page, selectedId, surface: 'azure' } });
    if (window.innerWidth <= 800) setMenu(false);
  };
  const inspectApp = (appId: string) => dispatch({ type: 'INSPECT', scope, appId, now: Date.now() });
  const services = [{ page: 'apps' as const, label: 'App Services', icon: AppWindow }, { page: 'groups' as const, label: 'Groupes de ressources', icon: Layers3 }, { page: 'plans' as const, label: 'Plans App Service', icon: Server }, { page: 'subscriptions' as const, label: 'Abonnements', icon: ShieldCheck }];
  const nav = [{ page: 'home' as const, label: 'Accueil', icon: Home }, ...services, { page: 'activity' as const, label: 'Journal d’activité', icon: Activity }];
  const results = query.trim() ? [...services.map(item => ({ label: item.label, page: item.page as PortalPage, id: '' })),
    ...world.apps.map(app => ({ label: app.name, page: 'app' as const, id: app.id })),
    ...world.groups.map(group => ({ label: group.name, page: 'group' as const, id: group.id })),
    ...world.plans.map(plan => ({ label: plan.name, page: 'plan' as const, id: plan.id }))].filter(result => result.label.toLowerCase().includes(query.toLowerCase())) : [];
  const app = world.apps.find(value => value.id === state.ui.selectedId);
  const group = world.groups.find(value => value.id === state.ui.selectedId);
  const plan = world.plans.find(value => value.id === state.ui.selectedId);
  const title = state.ui.page === 'app' ? app?.name : state.ui.page === 'group' ? group?.name : state.ui.page === 'plan' ? plan?.name : nav.find(item => item.page === state.ui.page)?.label;
  const history = world.events.filter(event => !['inspected', 'browsed'].includes(event.kind)).slice().reverse();
  const appTable = (apps = world.apps) => <div className="table-scroll"><table className="azure-table"><thead><tr><th>Nom</th><th>État</th><th>Groupe de ressources</th><th>Plan App Service</th></tr></thead><tbody>{apps.map(value => <tr key={value.id}><td><button className="table-link" onClick={() => inspectApp(value.id)}><AppWindow size={16} />{value.name}</button></td><td><Badge tone={value.status === 'running' ? 'green' : 'neutral'}>{statusName(value.status)}</Badge></td><td><button className="table-link" onClick={() => navigate('group', value.groupId)}>{world.groups.find(g => g.id === value.groupId)?.name}</button></td><td><button className="table-link" onClick={() => navigate('plan', value.planId)}>{world.plans.find(p => p.id === value.planId)?.name}</button></td></tr>)}</tbody></table></div>;
  return <div className="azure-portal">
    <header className="azure-header"><button className="azure-menu icon-button" aria-label="Afficher le menu Azure" aria-expanded={menu} onClick={() => setMenu(!menu)}><Menu size={20} /></button><span className="azure-wordmark"><AzureLogo size={23} />Microsoft Azure</span>
      <div className="azure-global-search"><Search size={15} /><input aria-label="Recherche globale du portail Azure" placeholder="Rechercher des ressources, services et documents" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setQuery(''); }} />{query && <button className="icon-button" aria-label="Effacer la recherche globale" onClick={() => setQuery('')}><X size={13} /></button>}{query.trim() && <div className="search-results"><div className="search-results-label">SERVICES ET RESSOURCES</div>{results.length ? results.map(result => <button key={result.page + result.id} onClick={() => { if (result.page === 'app') inspectApp(result.id); else navigate(result.page, result.id); setQuery(''); }}><AppWindow size={16} /><span>{result.label}</span><ChevronRight size={14} /></button>) : <p>Aucun résultat.</p>}</div>}</div>
      <div className="azure-header-actions"><button className="icon-button" aria-label="Notifications Azure" aria-expanded={notifications} onClick={() => setNotifications(!notifications)}><Bell size={20} /></button><button className="icon-button azure-help" aria-label="Aide sur les ressources Azure" onClick={() => dispatch({ type: 'REVIEW_EXPLANATION' })}><CircleHelp size={20} /></button><span className="azure-user"><span>{scope === 'demo' ? 'Nora' : 'Romain'}<small>Atelier IT</small></span><b>{scope === 'demo' ? 'N' : 'R'}</b></span></div>
    </header>
    <div className="azure-body"><nav className={'azure-nav ' + (menu ? 'azure-nav-expanded' : 'azure-nav-collapsed')} aria-label="Navigation Azure"><div className="azure-nav-label">FAVORIS</div>{nav.map(({ page, label, icon: Icon }) => <button key={page} title={label} aria-label={label} className={state.ui.page === page || page === 'apps' && state.ui.page === 'app' ? 'active' : ''} onClick={() => navigate(page)}><Icon size={19} /><span>{label}</span></button>)}<div className="azure-nav-foot"><ShieldCheck size={14} /><span>Annuaire : Atelier IT</span></div></nav>
      <main ref={content} className="azure-content" onFocusCapture={event => {
        const field = event.target as HTMLElement; const panel = document.querySelector('.mission-panel');
        if (!panel || !field.matches('button,input,select,textarea')) return;
        const a = field.getBoundingClientRect(); const b = panel.getBoundingClientRect();
        if (a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom) event.currentTarget.scrollTop += a.bottom - b.top + 20;
      }}><div className="portal-page learning-portal-page"><Breadcrumb items={state.ui.page === 'home' ? [] : [title ?? 'Ressource']} onHome={() => navigate('home')} /><div className="azure-page-heading"><div><h2>{state.ui.page === 'home' ? 'Bienvenue, ' + (scope === 'demo' ? 'Nora' : 'Romain') : title}</h2>{state.ui.page === 'app' && <p>App Service</p>}</div></div>
        {state.ui.page === 'home' && <><section className="azure-services"><h3>Services Azure</h3><div className="service-cards">{services.map(({ page, label, icon: Icon }) => <button key={page} onClick={() => navigate(page)}><span className="service-icon"><Icon size={25} /></span><strong>{label}</strong></button>)}</div></section><section className="recent-groups"><h3>Ressources récentes</h3>{appTable()}</section></>}
        {state.ui.page === 'apps' && <><div className="azure-toolbar"><button className="toolbar-button" onClick={() => dispatch({ type: 'SETTLE', now: Date.now() })}><RefreshCw size={15} />Actualiser</button><span className="toolbar-count">{world.apps.length} éléments</span></div>{appTable()}</>}
        {state.ui.page === 'groups' && <div className="table-scroll"><table className="azure-table"><thead><tr><th>Nom</th><th>Abonnement</th><th>Région</th></tr></thead><tbody>{world.groups.map(value => <tr key={value.id}><td><button className="table-link" onClick={() => navigate('group', value.id)}><Layers3 size={16} />{value.name}</button></td><td>{value.subscription}</td><td>{value.region}</td></tr>)}</tbody></table></div>}
        {state.ui.page === 'plans' && <div className="table-scroll"><table className="azure-table"><thead><tr><th>Nom</th><th>Région</th><th>Niveau tarifaire</th><th>Applications</th></tr></thead><tbody>{world.plans.map(value => <tr key={value.id}><td><button className="table-link" onClick={() => navigate('plan', value.id)}><Server size={16} />{value.name}</button></td><td>{value.region}</td><td>{value.sku}</td><td>{world.apps.filter(item => item.planId === value.id).length}</td></tr>)}</tbody></table></div>}
        {state.ui.page === 'subscriptions' && <dl className="property-grid"><div><dt>Abonnement</dt><dd>FORMATION-IT-DEV</dd></div><div><dt>Mon rôle</dt><dd>Contributeur</dd></div><div><dt>Annuaire</dt><dd>Atelier IT</dd></div></dl>}
        {state.ui.page === 'group' && group && <><dl className="property-grid"><div><dt>Abonnement</dt><dd>{group.subscription}</dd></div><div><dt>Région</dt><dd>{group.region}</dd></div></dl><h3>Ressources</h3>{appTable(world.apps.filter(item => item.groupId === group.id))}{world.plans.filter(item => item.groupId === group.id).map(item => <p key={item.id}><button className="table-link" onClick={() => navigate('plan', item.id)}><Server size={16} />{item.name}</button> · Plan App Service</p>)}</>}
        {state.ui.page === 'plan' && plan && <><dl className="property-grid"><div><dt>Niveau tarifaire</dt><dd>{plan.sku}</dd></div><div><dt>Région</dt><dd>{plan.region}</dd></div><div><dt>Système d’exploitation</dt><dd>Linux</dd></div><div><dt>Groupe de ressources</dt><dd><button className="table-link" onClick={() => navigate('group', plan.groupId)}>{world.groups.find(item => item.id === plan.groupId)?.name}</button></dd></div></dl><h3>Applications du plan</h3>{appTable(world.apps.filter(item => item.planId === plan.id))}</>}
        {state.ui.page === 'app' && app && <AppDetail app={app} />}
        {state.ui.page === 'activity' && <><h3>Opérations de gestion</h3>{history.length ? <div className="activity-list">{history.map(event => <div key={event.seq}><Activity size={18} /><span><strong>{event.kind === 'stopped' ? 'Application arrêtée' : event.kind === 'started' ? 'Application démarrée' : 'Opération demandée'}</strong><p>{world.apps.find(item => item.id === event.appId)?.name}</p></span><time>{new Date(event.at).toLocaleTimeString('fr-FR')}</time></div>)}</div> : <p>Aucune opération à afficher.</p>}</>}
      </div></main>
      {notifications && <section className="notification-panel" aria-label="Notifications du portail"><div className="panel-title"><h3>Notifications</h3><button className="icon-button" aria-label="Fermer les notifications" onClick={() => setNotifications(false)}><X size={17} /></button></div>{world.apps.some(value => value.operation) && <p className="notification-item">Opération en cours…</p>}{history.slice(0, 8).map(event => <div className="notification-item" key={event.seq}><CheckCircle2 size={17} /><div><strong>{statusName(event.status)}</strong><p>{world.apps.find(value => value.id === event.appId)?.name}</p></div></div>)}{!history.length && <p className="notification-item">Aucune notification.</p>}</section>}
    </div>
  </div>;
}
function AppDetail({ app }: { app: WebApp }) {
  const { state, dispatch } = useLearning();
  const scope = state.ui.scope;
  const world = scope === 'lab' ? state.world : state.demo;
  const group = world.groups.find(value => value.id === app.groupId)!;
  const plan = world.plans.find(value => value.id === app.planId)!;
  const disabled = Boolean(app.operation) || scope === 'demo';
  const tab = state.ui.appTab;
  return <>
    <div className="azure-toolbar learning-app-toolbar"><button className="toolbar-button" onClick={() => dispatch({ type: 'BROWSE', scope, appId: app.id, now: Date.now() })}><ExternalLink size={15} />Parcourir</button><button className="toolbar-button" disabled={disabled || app.status !== 'stopped'} onClick={() => dispatch({ type: 'OPERATE', scope, appId: app.id, kind: 'start', now: Date.now() })}><Play size={15} />Démarrer</button><button className="toolbar-button" disabled={disabled || app.status !== 'running'} onClick={() => dispatch({ type: 'OPERATE', scope, appId: app.id, kind: 'stop', now: Date.now() })}><Square size={14} />Arrêter</button><button className="toolbar-button" disabled={disabled || app.status !== 'running'} onClick={() => dispatch({ type: 'OPERATE', scope, appId: app.id, kind: 'restart', now: Date.now() })}><RefreshCw size={15} />Redémarrer</button><button className="toolbar-button" onClick={() => dispatch({ type: 'INSPECT', scope, appId: app.id, now: Date.now() })}><RefreshCw size={15} />Actualiser</button></div>
    <div className="learning-resource-blade"><nav aria-label="Menu de l’App Service">{[{ key: 'overview' as const, label: 'Vue d’ensemble', icon: Home }, { key: 'properties' as const, label: 'Propriétés', icon: List }, { key: 'deployment' as const, label: 'Centre de déploiement', icon: Box }].map(({ key, label, icon: Icon }) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => dispatch({ type: 'UI', patch: { appTab: key } })}><Icon size={15} />{label}</button>)}</nav>
      <section className="learning-resource-content">
        {tab !== 'deployment' ? <><h3>{tab === 'overview' ? 'Essentiels' : 'Propriétés'}</h3><dl className="property-grid"><div><dt>État</dt><dd><Badge tone={app.status === 'running' ? 'green' : 'neutral'}>{statusName(app.status)}</Badge></dd></div><div><dt>Abonnement</dt><dd>{group.subscription}</dd></div><div><dt>Groupe de ressources</dt><dd><button className="table-link" onClick={() => dispatch({ type: 'UI', patch: { page: 'group', selectedId: group.id } })}>{group.name}</button></dd></div><div><dt>Plan App Service</dt><dd><button className="table-link" onClick={() => dispatch({ type: 'UI', patch: { page: 'plan', selectedId: plan.id } })}>{plan.name}</button></dd></div><div><dt>Domaine par défaut</dt><dd><button className="table-link" onClick={() => dispatch({ type: 'BROWSE', scope, appId: app.id, now: Date.now() })}>{app.host}<ExternalLink size={12} /></button></dd></div><div><dt>Emplacement</dt><dd>{plan.region}</dd></div><div><dt>Pile d’exécution</dt><dd>Node.js · Linux</dd></div></dl></> : <><h3>Centre de déploiement</h3><dl className="property-grid"><div><dt>Source</dt><dd>GitHub</dd></div><div><dt>Fournisseur de build</dt><dd>GitHub Actions</dd></div><div><dt>Dépôt</dt><dd>atelier-formation/{app.application.toLowerCase().replaceAll(' ', '-')}</dd></div><div><dt>Branche</dt><dd>main</dd></div></dl><h3>Dernier déploiement</h3><div className="learning-deployment"><CheckCircle2 size={21} /><div><strong>Réussi · version {app.version}</strong><p>Commit {app.commit} · code de {app.application}</p></div></div></>}
        <div className="learning-resource-footer"><FolderOpen size={17} />{app.application}</div>
      </section>
    </div>
  </>;
}
