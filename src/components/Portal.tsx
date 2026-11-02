import { useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, Bell, Box, CheckCircle2, ChevronRight, CircleHelp, ExternalLink, FolderOpen, Home, Layers3, List, LoaderCircle, LockKeyhole, Menu, Plus, RefreshCw, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';
import { REGIONS, regionName, SUBSCRIPTIONS, subscriptionName } from '../domain/scenario';
import { rowsToTags, validateDraft, validateTags, writable } from '../domain/engine';
import type { PortalPage, ResourceGroup } from '../domain/types';
import { AzureLogo, Badge, Breadcrumb, Notice, TagEditor } from './Shared';

export function Portal() {
  const { state, run, openPortal, dispatch } = useWorkspace();
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const services: { title: string; page: PortalPage }[] = [
    { title: 'Groupes de ressources', page: 'groups' }, { title: 'Abonnements', page: 'subscriptions' }, { title: 'Créer un groupe de ressources', page: 'create' },
  ];
  const results = query.trim() ? [
    ...services.filter(s => s.title.toLowerCase().includes(query.toLowerCase())).map(s => ({ ...s, groupId: '' })),
    ...run.groups.filter(g => g.name.toLowerCase().includes(query.toLowerCase())).map(g => ({ title: g.name, page: 'detail' as const, groupId: g.id })),
  ] : [];
  const navItems = [
    { page: 'home' as const, label: 'Accueil', icon: Home },
    { page: 'subscriptions' as const, label: 'Abonnements', icon: ShieldCheck },
    { page: 'groups' as const, label: 'Groupes de ressources', icon: Layers3 },
    { page: 'activity' as const, label: 'Activité de cet essai', icon: Activity },
  ];
  return <div className="azure-portal">
    <header className="azure-header">
      <button className="azure-menu icon-button" aria-label="Afficher le menu Azure" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu size={18} /></button>
      <span className="azure-wordmark"><AzureLogo size={23} />Microsoft Azure</span>
      <div className="azure-global-search"><Search size={15} /><input aria-label="Recherche globale du portail Azure" placeholder="Rechercher des ressources, services et documents" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setQuery(''); }} />
        {query && <button className="icon-button" aria-label="Effacer la recherche globale" onClick={() => setQuery('')}><X size={13} /></button>}
        {query.trim() && <div className="search-results"><div className="search-results-label">SERVICES ET RESSOURCES</div>
          {results.length ? results.map((r, i) => <button key={i} onClick={() => { openPortal(r.page, r.groupId); setQuery(''); }}><Layers3 size={17} /><span>{r.title}</span><ChevronRight size={14} /></button>) : <p>Aucun résultat. Essaie « groupes » ou « abonnements ».</p>}
        </div>}
      </div>
      <div className="azure-header-actions"><button className="icon-button notification-bell" aria-label="Notifications Azure" aria-expanded={notifications} onClick={() => setNotifications(!notifications)}><Bell size={17} />{run.notifications.length > 0 && <span />}</button><button className="icon-button azure-help" aria-label="Consulter les notions Azure" onClick={() => dispatch({ type: 'UI', patch: { activeApp: 'notes', notesTab: 'course' } })}><CircleHelp size={17} /></button><span className="azure-user"><span>Romain<small>Atelier IT</small></span><b>R</b></span></div>
    </header>
    <div className="azure-body">
      <nav className={'azure-nav ' + (menuOpen ? 'azure-nav-open' : '')} aria-label="Navigation Azure">
        <div className="azure-nav-label">FAVORIS</div>
        {navItems.map(({ page, label, icon: Icon }) => <button key={page} aria-label={label} title={label} className={state.ui.portalPage === page || (page === 'groups' && ['create', 'detail'].includes(state.ui.portalPage)) ? 'active' : ''} onClick={() => { openPortal(page); setMenuOpen(false); if (page === 'subscriptions') dispatch({ type: 'UI', patch: { selectedSubscriptionId: '' } }); }}><Icon size={17} /><span>{label}</span></button>)}
        <div className="azure-nav-foot"><LockKeyhole size={15} /><span>Portail de formation<br /><small>Atelier IT · Annuaire fictif</small></span></div>
      </nav>
      <main className="azure-content">
        {run.error && <div className="portal-error"><Notice error>{run.error}</Notice><button className="icon-button" aria-label="Fermer le message d’erreur Azure" onClick={() => dispatch({ type: 'CLEAR_ERROR' })}><X size={16} /></button></div>}
        {state.ui.portalPage === 'home' && <PortalHome />}
        {state.ui.portalPage === 'subscriptions' && <Subscriptions />}
        {state.ui.portalPage === 'groups' && <Groups />}
        {state.ui.portalPage === 'create' && <CreateGroup />}
        {state.ui.portalPage === 'detail' && <GroupDetail key={state.ui.selectedGroupId} />}
        {state.ui.portalPage === 'activity' && <ActivityPage />}
      </main>
      {notifications && <section className="notification-panel" aria-label="Notifications du portail"><div className="panel-title"><h3>Notifications</h3><button className="icon-button" aria-label="Fermer les notifications" onClick={() => setNotifications(false)}><X size={17} /></button></div>
        {!run.notifications.length && <div className="empty-small"><Bell size={25} /><p>Tes opérations apparaîtront ici.</p></div>}
        {run.pending && <div className="notification-item"><LoaderCircle className="spin" size={19} /><div><strong>Création en cours</strong><p>{run.pending.group.name}</p></div></div>}
        {run.notifications.map(n => <div className="notification-item" key={n.id}><CheckCircle2 size={18} /><div><strong>{n.title}</strong><p>{n.body}</p><small>{new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>
          {n.groupId && run.groups.some(g => g.id === n.groupId) && <button className="text-button" onClick={() => { openPortal('detail', n.groupId); setNotifications(false); }}>Accéder au groupe de ressources <ArrowRight size={13} /></button>}</div></div>)}
      </section>}
    </div>
  </div>;
}
function PortalHome() {
  const { run, openPortal } = useWorkspace();
  return <div className="portal-page">
    <Breadcrumb items={[]} onHome={() => openPortal('home')} />
    <div className="azure-page-heading"><div><span className="overline">TON ESPACE AZURE</span><h2>Bienvenue, Romain</h2><p>Les bons outils, au même endroit.</p></div><Badge tone="blue">Atelier IT</Badge></div>
    <section className="azure-services"><h3>Services Azure</h3><div className="service-cards">
      <button onClick={() => openPortal('create')}><span className="service-icon"><Plus size={26} /></span><strong>Créer un groupe</strong><small>Préparer un nouvel espace</small></button>
      <button onClick={() => openPortal('groups')}><span className="service-icon"><Layers3 size={25} /></span><strong>Groupes de ressources</strong><small>{run.groups.length} groupes disponibles</small></button>
      <button onClick={() => openPortal('subscriptions')}><span className="service-icon"><ShieldCheck size={25} /></span><strong>Abonnements</strong><small>3 abonnements · tes accès</small></button>
    </div></section>
    <section className="recent-groups"><h3>Ressources et groupes disponibles</h3><GroupTable groups={run.groups} /></section>
    <Notice>Tu travailles dans un portail simulé. Les ressources de cet atelier sont fictives et ne créent aucun coût Azure.</Notice>
  </div>;
}
function Subscriptions() {
  const { state, dispatch, openPortal } = useWorkspace();
  const selected = SUBSCRIPTIONS.find(s => s.id === state.ui.selectedSubscriptionId);
  return <div className="portal-page">
    <Breadcrumb items={['Abonnements', ...(selected ? [selected.name] : [])]} onHome={() => openPortal('home')} />
    <div className="azure-page-heading"><div><h2>{selected ? selected.name : 'Abonnements'}</h2><p>{selected ? 'Informations et accès à cet abonnement' : 'Le périmètre de tes ressources et de tes accès.'}</p></div><ShieldCheck size={30} className="azure-heading-icon" /></div>
    {selected ? <>
      <button className="text-button" onClick={() => dispatch({ type: 'UI', patch: { selectedSubscriptionId: '' } })}><ArrowLeft size={14} />Tous les abonnements</button>
      <dl className="property-grid"><div><dt>Nom de l’abonnement</dt><dd>{selected.name}</dd></div><div><dt>Annuaire</dt><dd>Atelier IT</dd></div><div><dt>Mon rôle</dt><dd><Badge tone={selected.writable ? 'green' : 'neutral'}>{selected.role}</Badge></dd></div><div><dt>Environnement</dt><dd>{selected.environment}</dd></div></dl>
      <Notice>{selected.writable ? 'Tu peux créer et gérer les ressources de cet abonnement. Le ticket fixe le périmètre de ton intervention.' : 'Tu peux consulter cet abonnement. Ton rôle Lecteur ne permet aucune modification.'}</Notice>
      <button className="button azure-button" onClick={() => { dispatch({ type: 'UI', patch: { filterSubId: selected.id, groupSearch: '' } }); openPortal('groups'); }}><Layers3 size={16} />Voir les groupes de ressources</button>
    </> : <div className="table-scroll"><table className="azure-table"><thead><tr><th>Nom</th><th>Environnement</th><th>Mon rôle</th><th>État</th></tr></thead><tbody>{SUBSCRIPTIONS.map(s => <tr key={s.id}><td><button className="table-link" onClick={() => dispatch({ type: 'UI', patch: { selectedSubscriptionId: s.id } })}><ShieldCheck size={16} />{s.name}</button></td><td><Badge tone={s.writable ? 'green' : 'neutral'}>{s.environment}</Badge></td><td>{s.role}</td><td><span className="status-dot" />Actif</td></tr>)}</tbody></table></div>}
  </div>;
}
function Groups() {
  const { state, run, dispatch, openPortal, showToast } = useWorkspace();
  const groups = run.groups.filter(g => (state.ui.filterSubId === 'all' || g.subscriptionId === state.ui.filterSubId) && g.name.toLowerCase().includes(state.ui.groupSearch.toLowerCase()));
  return <div className="portal-page">
    <Breadcrumb items={['Groupes de ressources']} onHome={() => openPortal('home')} />
    <div className="azure-page-heading"><div><h2>Groupes de ressources</h2><p>Organise les services de tes applications.</p></div><Layers3 size={30} className="azure-heading-icon" /></div>
    <div className="azure-toolbar"><button className="button azure-button" onClick={() => openPortal('create')}><Plus size={16} />Créer</button><button className="toolbar-button" onClick={() => showToast('Liste des groupes actualisée.')}><RefreshCw size={15} />Actualiser</button><span className="toolbar-count">{groups.length} élément{groups.length > 1 ? 's' : ''}</span></div>
    <div className="azure-filters"><label className="search-field"><Search size={15} /><input aria-label="Filtrer les groupes par nom" placeholder="Filtrer par nom…" value={state.ui.groupSearch} onChange={e => dispatch({ type: 'UI', patch: { groupSearch: e.target.value } })} /></label>
      <label className="subscription-filter"><span>Abonnement</span><select aria-label="Filtrer par abonnement" value={state.ui.filterSubId} onChange={e => dispatch({ type: 'UI', patch: { filterSubId: e.target.value } })}><option value="all">Tous les abonnements</option>{SUBSCRIPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
    {groups.length ? <GroupTable groups={groups} /> : <div className="empty-state"><Search size={34} /><h3>Aucun groupe dans cette vue</h3><p>Vérifie le nom recherché et le filtre d’abonnement.</p><button className="text-button" onClick={() => dispatch({ type: 'UI', patch: { groupSearch: '', filterSubId: 'all' } })}>Effacer les filtres</button></div>}
    <p className="table-footnote">Un groupe peut rassembler les ressources qui partagent le même cycle de vie.</p>
  </div>;
}
function GroupTable({ groups }: { groups: ResourceGroup[] }) {
  const { openPortal } = useWorkspace();
  return <div className="table-scroll"><table className="azure-table group-table"><thead><tr><th>Nom</th><th>Abonnement</th><th>Région</th><th>Ressources</th></tr></thead><tbody>{groups.map(g => <tr key={g.id}>
    <td><button className="table-link" onClick={() => openPortal('detail', g.id)}><Layers3 size={17} /><span>{g.name}{g.origin === 'session' && <small>Créé pendant cet essai</small>}</span></button></td><td>{subscriptionName(g.subscriptionId)}</td><td>{regionName(g.location)}</td><td>{g.resources.length}</td>
  </tr>)}</tbody></table></div>;
}
function CreateGroup() {
  const { run, dispatch, openPortal } = useWorkspace();
  const [errors, setErrors] = useState<string[]>([]);
  const draft = run.draft;
  const step = run.wizardStep;
  const update = (patch: Partial<typeof draft>) => { setErrors([]); dispatch({ type: 'DRAFT', draft: { ...draft, ...patch } }); };
  const move = (target: number) => {
    if (target > step) {
      const problems = validateDraft(draft, run.groups, target === 2);
      if (problems.length) { setErrors(problems); return; }
    }
    setErrors([]);
    dispatch({ type: 'WIZARD_STEP', step: target });
  };
  return <div className="portal-page wizard-page">
    <Breadcrumb items={['Groupes de ressources', 'Créer']} onHome={() => openPortal('home')} />
    <div className="azure-page-heading"><div><h2>Créer un groupe de ressources</h2><p>Un conteneur logique pour les ressources de ton projet.</p></div><Layers3 size={30} className="azure-heading-icon" /></div>
    <div className="wizard-tabs" role="tablist" aria-label="Étapes de création">{['Informations de base', 'Étiquettes', 'Vérifier + créer'].map((label, index) => <button key={label} role="tab" aria-selected={step === index} className={step === index ? 'active' : ''} onClick={() => move(index)} disabled={Boolean(run.pending)}><span>{index + 1}</span>{label}</button>)}</div>
    <div className="wizard-form">
      {errors.length > 0 && <Notice error><ul>{errors.map(e => <li key={e}>{e}</li>)}</ul></Notice>}
      {step === 0 && <>
        <section className="form-section"><h3>Détails du projet</h3><p>Choisis l’abonnement dans lequel tu souhaites gérer ce groupe.</p>
          <label className="form-field"><span>Abonnement <b>*</b></span><select value={draft.subscriptionId} onChange={e => update({ subscriptionId: e.target.value })}><option value="">Sélectionner un abonnement</option>{SUBSCRIPTIONS.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
          {draft.subscriptionId && !writable(draft.subscriptionId) && <Notice error>Ton rôle Lecteur permet de consulter cet abonnement. La création de ressources y est indisponible.</Notice>}
          <label className="form-field"><span>Groupe de ressources <b>*</b></span><input value={draft.name} onChange={e => update({ name: e.target.value })} placeholder="Saisir le nom du groupe" autoComplete="off" /><small>Le nom doit être unique dans cet abonnement.</small></label>
        </section>
        <section className="form-section"><h3>Détails du groupe</h3><label className="form-field"><span>Région <b>*</b></span><select value={draft.location} onChange={e => update({ location: e.target.value })}><option value="">Sélectionner une région</option>{REGIONS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><small>Cette région concerne les métadonnées du groupe.</small></label></section>
      </>}
      {step === 1 && <section className="form-section"><h3>Étiquettes</h3><p>Les étiquettes sont des paires nom–valeur pour identifier et organiser tes ressources.</p><TagEditor rows={draft.tags} onChange={tags => update({ tags })} /><Notice>Les étiquettes de ce groupe ne seront pas automatiquement transmises aux futures ressources.</Notice></section>}
      {step === 2 && <section className="form-section"><div className="validation-ok"><CheckCircle2 size={19} /><div><strong>Validation technique réussie</strong><small>Relis les paramètres et compare-les à ton ticket.</small></div></div><h3>Informations de base</h3><dl className="review-properties"><div><dt>Abonnement</dt><dd>{subscriptionName(draft.subscriptionId)}</dd></div><div><dt>Groupe de ressources</dt><dd>{draft.name}</dd></div><div><dt>Région</dt><dd>{regionName(draft.location)}</dd></div></dl><h3>Étiquettes</h3><TagSummary tags={rowsToTags(draft.tags)} /><p className="muted small">La conformité à la mission sera évaluée depuis l’état du groupe créé.</p></section>}
    </div>
    <footer className="wizard-footer">{step === 2 ? <button className="button azure-button" disabled={Boolean(run.pending)} onClick={() => dispatch({ type: 'START_CREATE', id: crypto.randomUUID(), now: Date.now() })}>{run.pending ? <><LoaderCircle size={16} className="spin" />Création en cours…</> : <><Plus size={16} />Créer</>}</button> : <button className="button azure-button" onClick={() => move(2)}>Vérifier + créer</button>}
      {step > 0 && <button className="button button-outline" disabled={Boolean(run.pending)} onClick={() => move(step - 1)}><ArrowLeft size={14} />Précédent</button>}
      {step < 2 && <button className="button button-outline" onClick={() => move(step + 1)}>Suivant : {step === 0 ? 'Étiquettes' : 'Vérifier + créer'}<ArrowRight size={14} /></button>}
      <button className="text-button" disabled={Boolean(run.pending)} onClick={() => openPortal('groups')}>Fermer</button>
    </footer>
  </div>;
}
function TagSummary({ tags }: { tags: Record<string, string> }) {
  return Object.keys(tags).length ? <div className="tag-summary">{Object.entries(tags).map(([key, value]) => <span key={key}><b>{key}</b><span>{value || '(vide)'}</span></span>)}</div> : <p className="muted small">Aucune étiquette renseignée.</p>;
}
function GroupDetail() {
  const { state, run, dispatch, setModal, openPortal, showToast } = useWorkspace();
  const group = run.groups.find(g => g.id === state.ui.selectedGroupId);
  const [tab, setTab] = useState<'overview' | 'tags' | 'resources'>('overview');
  const [rows, setRows] = useState(group && Object.keys(group.tags).length ? Object.entries(group.tags).map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }]);
  const [error, setError] = useState('');
  if (!group) return <div className="portal-page"><Notice>Ce groupe n’est plus dans l’inventaire de cet essai.</Notice><button className="button azure-button" onClick={() => openPortal('groups')}>Revenir à la liste</button></div>;
  const canWrite = writable(group.subscriptionId);
  const save = () => {
    const errors = validateTags(rows);
    if (errors.length) { setError(errors.join(' ')); return; }
    dispatch({ type: 'SAVE_TAGS', groupId: group.id, rows, now: Date.now() });
    setError('');
    showToast('Étiquettes du groupe enregistrées.');
  };
  return <div className="portal-page">
    <Breadcrumb items={['Groupes de ressources', group.name]} onHome={() => openPortal('home')} />
    <div className="azure-page-heading group-heading"><div className="group-title"><Layers3 size={31} /><div><h2>{group.name}</h2><p>Groupe de ressources</p></div></div><Badge tone={canWrite ? 'green' : 'neutral'}>{canWrite ? 'DEV' : 'Lecture seule'}</Badge></div>
    <div className="azure-toolbar"><button className="toolbar-button" onClick={() => showToast('Propriétés du groupe actualisées.')}><RefreshCw size={15} />Actualiser</button>
      <button className="toolbar-button danger-text" disabled={!canWrite || group.origin !== 'session' || group.resources.length > 0} title="Dans cet exercice, seuls tes groupes vides peuvent être supprimés" onClick={() => setModal({ kind: 'delete', groupId: group.id })}><Trash2 size={15} />Supprimer le groupe</button></div>
    <div className="detail-tabs" role="tablist" aria-label="Informations du groupe">{[{ key: 'overview' as const, label: 'Vue d’ensemble' }, { key: 'tags' as const, label: 'Étiquettes' }, { key: 'resources' as const, label: 'Ressources (' + group.resources.length + ')' }].map(item => <button role="tab" key={item.key} aria-selected={tab === item.key} className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>{item.label}</button>)}</div>
    {tab === 'overview' && <>
      {group.origin === 'session' && <div className="group-created"><CheckCircle2 size={17} />Groupe disponible dans ton environnement de formation</div>}
      <dl className="property-grid"><div><dt>Abonnement</dt><dd><button className="text-button" onClick={() => { dispatch({ type: 'UI', patch: { selectedSubscriptionId: group.subscriptionId } }); openPortal('subscriptions'); }}>{subscriptionName(group.subscriptionId)}<ExternalLink size={12} /></button></dd></div><div><dt>Région</dt><dd>{regionName(group.location)}</dd></div><div><dt>Annuaire</dt><dd>Atelier IT</dd></div><div><dt>État</dt><dd><span className="status-dot" />Disponible</dd></div></dl>
      <div className="resources-stat"><span className="resources-stat-icon"><Box size={25} /></span><div><strong>{group.resources.length}</strong><span>ressource{group.resources.length > 1 ? 's' : ''} dans ce groupe</span></div><button className="text-button" onClick={() => setTab('resources')}>Consulter<ArrowRight size={14} /></button></div>
      <div className="section-line"><h3>Étiquettes</h3><button className="text-button" onClick={() => setTab('tags')}>{canWrite ? 'Modifier les étiquettes' : 'Consulter'}</button></div><TagSummary tags={group.tags} />
      <div className="portal-next-action"><p>Ta configuration correspond au ticket ?</p><button className="button button-outline" onClick={() => { dispatch({ type: 'ATTACH', groupId: group.id }); dispatch({ type: 'UI', patch: { activeApp: 'tickets' } }); }}>Joindre ce groupe au ticket <ArrowRight size={15} /></button></div>
    </>}
    {tab === 'tags' && <section className="form-section"><h3>Étiquettes du groupe</h3><p>Les modifications s’appliquent à ce groupe.</p>{!canWrite && <Notice>Ce groupe est accessible en lecture seule.</Notice>}{group.origin === 'baseline' && canWrite && <Notice>Ce groupe existait avant la mission. Le ticket demande de conserver sa configuration.</Notice>}{error && <Notice error>{error}</Notice>}<TagEditor rows={rows} onChange={setRows} disabled={!canWrite} />{canWrite && <button className="button azure-button" onClick={save}>Enregistrer les étiquettes</button>}</section>}
    {tab === 'resources' && (group.resources.length ? <div className="table-scroll"><table className="azure-table"><thead><tr><th>Nom</th><th>Type</th><th>Région</th></tr></thead><tbody>{group.resources.map(r => <tr key={r.name}><td>{r.name}</td><td>{r.type}</td><td>{regionName(r.location)}</td></tr>)}</tbody></table></div> : <div className="empty-state"><FolderOpen size={38} /><h3>Ton groupe est vide</h3><p>Les services de l’application seront ajoutés dans une prochaine mission.</p><Badge tone="green">0 ressource · prêt pour la suite</Badge></div>)}
  </div>;
}
function ActivityPage() {
  const { run, openPortal } = useWorkspace();
  return <div className="portal-page"><Breadcrumb items={['Activité de cet essai']} onHome={() => openPortal('home')} /><div className="azure-page-heading"><div><h2>Activité de cet essai</h2><p>Les opérations réalisées dans ton environnement de formation.</p></div><List size={28} className="azure-heading-icon" /></div>
    {!run.notifications.length ? <div className="empty-state"><Activity size={35} /><h3>Tout commence ici</h3><p>Tes créations, modifications et suppressions simulées apparaîtront dans ce journal.</p></div> : <div className="activity-list">{run.notifications.map(n => <div key={n.id}><CheckCircle2 size={19} /><span><strong>{n.title}</strong><p>{n.body}</p></span><time>{new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>{n.groupId && run.groups.some(g => g.id === n.groupId) && <button className="text-button" onClick={() => openPortal('detail', n.groupId)}>Ouvrir<ArrowRight size={13} /></button>}</div>)}</div>}
  </div>;
}
