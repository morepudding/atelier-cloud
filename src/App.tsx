import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { WorkspaceProvider } from './WorkspaceContext';
import { MissionPanel } from './components/MissionPanel';
import { Desktop } from './components/Desktop';
import { Dialogs } from './components/Dialogs';
import { STORAGE_KEY } from './domain/scenario';

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Atelier Cloud : erreur de rendu', error.message, info.componentStack); }
  render() {
    if (this.state.failed) return <main className="recovery-screen"><h1>Reprenons depuis le bureau.</h1><p>Un problème empêche d’afficher cet essai. Tu peux recharger la page ou repartir d’un nouvel essai.</p><button className="button button-dark" onClick={() => window.location.reload()}>Recharger la page</button><button className="button button-outline" onClick={() => { try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ } window.location.reload(); }}>Réinitialiser la sauvegarde locale</button></main>;
    return this.props.children;
  }
}
function Workspace() {
  return <div className="immersive-app"><a className="skip-link" href="#workspace-main">Aller au poste de travail</a><div id="workspace-main" className="immersive-workspace"><Desktop /></div><MissionPanel /><Dialogs /></div>;
}
export function App() {
  return <ErrorBoundary><WorkspaceProvider><Workspace /></WorkspaceProvider></ErrorBoundary>;
}
