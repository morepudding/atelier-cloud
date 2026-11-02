import { LearningProvider } from './LearningContext';
import { useLearning } from './context';
import { AzureWorkspace } from './ui/AzureWorkspace';
import { Workstation } from './ui/Workstation';
import { CoachPanel } from './ui/CoachPanel';

function Workspace({ onLegacy }: { onLegacy: () => void }) {
  const { state } = useLearning();
  return <div className="immersive-app learning-app"><a className="skip-link" href="#learning-workspace">Aller au poste de travail</a><div id="learning-workspace" className="immersive-workspace">{state.ui.surface === 'azure' ? <section className="portal-fullscreen" aria-label="Portail Azure"><AzureWorkspace /></section> : <Workstation />}</div><CoachPanel onLegacy={onLegacy} /></div>;
}
export function LearningApp({ onLegacy }: { onLegacy: () => void }) {
  return <LearningProvider><Workspace onLegacy={onLegacy} /></LearningProvider>;
}
