import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BatteryFull, BookOpen, Check, Cloud, LockKeyhole, Mail, Maximize2, Minus, Monitor, NotebookPen, RotateCcw, Volume2, Wifi, X } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';
import type { AppName } from '../domain/types';
import { AzureLogo, Badge } from './Shared';
import { Portal } from './Portal';
import { Ticket } from './Ticket';
import { Notes } from './Notes';

const APPLICATIONS: { key: AppName; name: string; subtitle: string }[] = [
  { key: 'tickets', name: 'Tickets', subtitle: 'Ta mission du jour' },
  { key: 'azure', name: 'Microsoft Azure', subtitle: 'Portail de formation' },
  { key: 'notes', name: 'Carnet', subtitle: 'Notes et notions' },
];
function AppIcon({ app, size = 24 }: { app: AppName; size?: number }) {
  if (app === 'azure') return <AzureLogo size={size} />;
  return app === 'tickets' ? <Mail size={size} /> : <NotebookPen size={size} />;
}
export function Desktop({ onOpenCoach }: { onOpenCoach: () => void }) {
  const { state, scenario, assessment, dispatch, saveOk, recovered, openApp, setModal, toast } = useWorkspace();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60000); return () => window.clearInterval(timer); }, []);
  const current = APPLICATIONS.find(app => app.key === state.ui.activeApp);
  return <div className="workspace-area">
    <header className="workspace-header"><div className="workspace-location"><button className="mobile-only icon-button" aria-label="Afficher le panneau de mission" onClick={onOpenCoach}><BookOpen size={20} /></button><span className="workspace-location-icon"><Monitor size={17} /></span><span>Mon poste de travail<span className="workspace-slash">/</span><strong>Mission 01</strong></span><Badge tone="green"><span className="live-dot" />Simulation</Badge></div>
      <div className="workspace-status"><span className={saveOk ? 'save-state' : 'save-state save-error'}><span />{saveOk ? 'Progression sauvegardée' : 'Sauvegarde indisponible'}</span><button className="reset-button" onClick={() => setModal({ kind: 'reset' })} aria-label="Recommencer la mission"><RotateCcw size={15} /><span>Recommencer</span></button><span className="profile-avatar">R</span></div>
    </header>
    <section className={'desktop ' + (state.ui.maximized ? 'desktop-maximized' : '')} aria-label="Poste de travail simulé">
      <div className="wallpaper-art" aria-hidden="true"><span /><span /><span /><div className="wallpaper-grid" /></div>
      <div className="desktop-context"><div><span className="desktop-date">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span><p>Un nouveau geste.<br /><strong>Une compétence de plus.</strong></p></div><span className="desktop-session"><span /> SESSION DE ROMAIN</span></div>
      <div className="desktop-shortcuts">{APPLICATIONS.map(app => <button key={app.key} onClick={() => openApp(app.key)} aria-label={app.name + ' sur le bureau'}><span className={'shortcut-icon app-icon-' + app.key}><AppIcon app={app.key} size={29} />{app.key === 'tickets' && !assessment.complete && <b>1</b>}</span><span>{app.name}</span></button>)}</div>
      {!current && <div className="desktop-welcome"><Cloud size={48} strokeWidth={1} /><h2>À toi de jouer.</h2><p>Retrouve ton ticket ou ouvre le portail pour poursuivre ta mission.</p><button className="button button-mint" onClick={() => openApp('tickets')}>Reprendre mon ticket<ArrowRight size={16} /></button></div>}
      {current && <div className="app-window">
        <div className="window-chrome"><div className="window-title"><span className={'window-app-icon app-icon-' + current.key}><AppIcon app={current.key} size={15} /></span>{current.name}<span className="window-title-separator">—</span><span className="window-subtitle">{current.subtitle}</span></div><div className="window-controls"><button aria-label="Réduire la fenêtre" onClick={() => dispatch({ type: 'UI', patch: { activeApp: null } })}><Minus size={15} /></button><button aria-label={state.ui.maximized ? 'Restaurer la fenêtre' : 'Agrandir la fenêtre'} onClick={() => dispatch({ type: 'UI', patch: { maximized: !state.ui.maximized } })}><Maximize2 size={13} /></button><button className="window-close" aria-label="Fermer la fenêtre" onClick={() => dispatch({ type: 'UI', patch: { activeApp: null } })}><X size={16} /></button></div></div>
        {current.key === 'azure' && <div className="browser-chrome"><button className="icon-button" aria-label="Retour à l’accueil du portail" onClick={() => dispatch({ type: 'UI', patch: { portalPage: 'home' } })}><ArrowLeft size={15} /></button><div className="browser-address"><LockKeyhole size={12} /><span>portal.azure.formation</span><Badge>Simulation</Badge></div></div>}
        <div className="window-content" key={current.key}>{current.key === 'tickets' ? <Ticket /> : current.key === 'azure' ? <Portal /> : <Notes />}</div>
      </div>}
      {(recovered || !saveOk) && <div className="storage-warning" role="alert">{!saveOk ? 'Le navigateur ne peut pas sauvegarder cet essai. Garde cet onglet ouvert pour conserver ta progression.' : 'Une ancienne sauvegarde illisible a été remplacée par un nouvel essai.'}</div>}
      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
      <footer className="desktop-taskbar"><span className="taskbar-environment"><LockKeyhole size={12} />Environnement fictif</span><div className="taskbar-apps"><button className="launcher-button" aria-label="Afficher le bureau" onClick={() => dispatch({ type: 'UI', patch: { activeApp: null } })}><span /><span /><span /><span /></button><span className="taskbar-divider" />{APPLICATIONS.map(app => <button className={'taskbar-app ' + (state.ui.activeApp === app.key ? 'taskbar-active' : '')} key={app.key} aria-label={'Ouvrir ' + app.name} title={app.name} onClick={() => openApp(app.key)}><span className={'dock-icon app-icon-' + app.key}><AppIcon app={app.key} size={24} /></span></button>)}</div><div className="taskbar-system"><Wifi size={14} /><Volume2 size={15} /><BatteryFull size={17} /><span>{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}<small>{now.toLocaleDateString('fr-FR')}</small></span></div></footer>
    </section>
    <footer className="workspace-footer"><span><span className="live-dot" />Atelier prêt<span className="footer-dot">·</span>{scenario.application} / DEV</span><span>Apprendre en faisant.</span></footer>
  </div>;
}
