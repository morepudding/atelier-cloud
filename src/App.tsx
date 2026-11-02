import { Component, useEffect, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { WorkspaceProvider } from './WorkspaceContext';
import { MissionPanel } from './components/MissionPanel';
import { Desktop } from './components/Desktop';
import { Dialogs } from './components/Dialogs';
import { STORAGE_KEY } from './domain/scenario';
import { LearningApp } from './learning/LearningApp';
import { LEARNING_KEY } from './learning/persistence';

class ErrorBoundary extends Component<{ children: ReactNode; storageKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Atelier Cloud : erreur de rendu', error.message, info.componentStack); }
  render() {
    if (this.state.failed) return <main className="recovery-screen"><h1>Reprenons depuis le bureau.</h1><p>Un problème empêche d’afficher cet essai. Tu peux recharger la page ou repartir d’un nouvel essai.</p><button className="button button-dark" onClick={() => window.location.reload()}>Recharger la page</button><button className="button button-outline" onClick={() => { try { const raw = localStorage.getItem(this.props.storageKey); if (raw) localStorage.setItem(this.props.storageKey + '.recovery', raw); localStorage.removeItem(this.props.storageKey); } catch { /* Storage may be unavailable. */ } window.location.reload(); }}>Réinitialiser la sauvegarde locale</button></main>;
    return this.props.children;
  }
}
function Workspace({ onNewCourse }: { onNewCourse?: () => void }) {
  return <div className="immersive-app"><a className="skip-link" href="#workspace-main">Aller au poste de travail</a><div id="workspace-main" className="immersive-workspace"><Desktop /></div><MissionPanel onNewCourse={onNewCourse} /><Dialogs /></div>;
}
export function LegacyApp({ onNewCourse }: { onNewCourse?: () => void }) {
  return <ErrorBoundary storageKey={STORAGE_KEY}><WorkspaceProvider><Workspace onNewCourse={onNewCourse} /></WorkspaceProvider></ErrorBoundary>;
}
export function App() {
  const readRoute = () => new URLSearchParams(window.location.search).get('parcours') === 'groupes' ? 'legacy' : 'learning';
  const [mode, setMode] = useState(readRoute);
  useEffect(() => { const change = () => setMode(readRoute()); window.addEventListener('popstate', change); return () => window.removeEventListener('popstate', change); }, []);
  const navigate = (next: 'legacy' | 'learning') => {
    const url = new URL(window.location.href);
    if (next === 'legacy') url.searchParams.set('parcours', 'groupes'); else url.searchParams.delete('parcours');
    window.history.pushState(null, '', url);
    setMode(next);
  };
  return mode === 'legacy' ? <LegacyApp onNewCourse={() => navigate('learning')} /> : <ErrorBoundary storageKey={LEARNING_KEY}><LearningApp onLegacy={() => navigate('legacy')} /></ErrorBoundary>;
}
