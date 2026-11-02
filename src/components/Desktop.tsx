import { useEffect, useState } from 'react';
import { BatteryFull, Mail, Maximize2, Minus, NotebookPen, Volume2, Wifi, X } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';
import type { AppName } from '../domain/types';
import { AzureLogo } from './Shared';
import { Portal } from './Portal';
import { Ticket } from './Ticket';
import { Notes } from './Notes';

const APPLICATIONS: { key: AppName; name: string }[] = [
  { key: 'tickets', name: 'Tickets' },
  { key: 'azure', name: 'Microsoft Azure' },
  { key: 'notes', name: 'Carnet' },
];
function AppIcon({ app, size = 24 }: { app: AppName; size?: number }) {
  if (app === 'azure') return <AzureLogo size={size} />;
  return app === 'tickets' ? <Mail size={size} /> : <NotebookPen size={size} />;
}
export function Desktop() {
  const { state, assessment, dispatch, openApp } = useWorkspace();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  if (state.ui.activeApp === 'azure') {
    return <section className="portal-fullscreen" aria-label="Portail Azure"><Portal /></section>;
  }
  const current = APPLICATIONS.find(app => app.key === state.ui.activeApp);
  return <section className={'desktop native-desktop ' + (state.ui.maximized ? 'desktop-maximized' : '')} aria-label="Moniteur du poste de travail">
    <div className="wallpaper-art" aria-hidden="true"><span /><span /><span /><div className="wallpaper-grid" /></div>
    <div className="desktop-shortcuts">{APPLICATIONS.map(app => <button key={app.key} onClick={() => openApp(app.key)} aria-label={app.name + ' sur le bureau'}>
      <span className={'shortcut-icon app-icon-' + app.key}><AppIcon app={app.key} size={31} />{app.key === 'tickets' && !assessment.complete && <b>1</b>}</span><span>{app.name}</span>
    </button>)}</div>
    {current && <div className="app-window">
      <div className="window-chrome"><div className="window-title"><span className={'window-app-icon app-icon-' + current.key}><AppIcon app={current.key} size={16} /></span>{current.name}</div>
        <div className="window-controls">
          <button aria-label="Réduire la fenêtre" onClick={() => dispatch({ type: 'UI', patch: { activeApp: null } })}><Minus size={16} /></button>
          <button aria-label={state.ui.maximized ? 'Restaurer la fenêtre' : 'Agrandir la fenêtre'} onClick={() => dispatch({ type: 'UI', patch: { maximized: !state.ui.maximized } })}><Maximize2 size={14} /></button>
          <button className="window-close" aria-label="Fermer la fenêtre" onClick={() => dispatch({ type: 'UI', patch: { activeApp: null } })}><X size={17} /></button>
        </div>
      </div>
      <div className="window-content" key={current.key}>{current.key === 'tickets' ? <Ticket /> : <Notes />}</div>
    </div>}
    <footer className="desktop-taskbar">
      <div className="taskbar-apps">
        <button className="launcher-button" aria-label="Afficher le bureau" onClick={() => dispatch({ type: 'UI', patch: { activeApp: null } })}><span /><span /><span /><span /></button><span className="taskbar-divider" />
        {APPLICATIONS.map(app => <button className={'taskbar-app ' + (state.ui.activeApp === app.key ? 'taskbar-active' : '')} key={app.key} aria-label={'Ouvrir ' + app.name} title={app.name} onClick={() => openApp(app.key)}><span className={'dock-icon app-icon-' + app.key}><AppIcon app={app.key} size={25} /></span></button>)}
      </div>
      <div className="taskbar-system"><Wifi size={15} /><Volume2 size={16} /><BatteryFull size={18} /><span>{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}<small>{now.toLocaleDateString('fr-FR')}</small></span></div>
    </footer>
  </section>;
}
