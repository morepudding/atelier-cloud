import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Award, CheckCircle2, Lightbulb, RotateCcw, Trash2 } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';
import { targetGroup } from '../domain/engine';
import { HINTS } from '../domain/scenario';
import type { HintTopic } from '../domain/types';
import { Badge, CheckDot, Modal, Notice, TeachingView } from './Shared';
import { Quiz } from './Ticket';
import { RecoveryView, TagLearningView } from './LearningTools';

export function Dialogs() {
  const { modal } = useWorkspace();
  return modal?.kind === 'delete' ? <DeleteDialog groupId={modal.groupId} /> : null;
}
export function LearningPanelContent() {
  const { modal } = useWorkspace();
  switch (modal?.kind) {
    case 'assessment': return <AssessmentView />;
    case 'hints': return <HintsView />;
    case 'reset': return <ResetView />;
    case 'success': return <SuccessView />;
    case 'quiz': return <TeachingView title="Bilan de compréhension"><Quiz /></TeachingView>;
    case 'recovery': return <RecoveryView />;
    case 'impact': return <TagLearningView />;
    default: return null;
  }
}
function AssessmentView() {
  const { assessment, run, setModal, openPortal, openApp } = useWorkspace();
  const next = assessment.checks.find(c => !c.passed);
  const correct = (id?: string) => {
    if (id === 'knowledge') { setModal({ kind: 'quiz' }); return; }
    if (id === 'inventory') { setModal({ kind: 'recovery' }); return; }
    setModal(null);
    if (id === 'report') openApp('tickets');
    else { const group = targetGroup(run); openPortal(group ? 'detail' : 'groups', group?.id); }
  };
  return <TeachingView title="Le point sur ta mission" className="assessment-view">
    <div className="assessment-summary">
      <div className="assessment-ring" style={{ '--progress': assessment.passed / 9 * 100 + '%' } as CSSProperties}><strong>{assessment.passed}<small>/9</small></strong></div>
      <div><Badge tone={assessment.complete ? 'green' : 'blue'}>{assessment.complete ? 'Mission réussie' : 'Mission en cours'}</Badge><p>Le contrôle porte sur l’état actuel de ton environnement.</p></div>
    </div>
    <ul className="criteria-list">{assessment.checks.map(c => <li key={c.id} className={c.passed ? 'passed' : ''}><CheckDot passed={c.passed} /><div><strong>{c.label}</strong><p>{c.detail}</p>{!c.passed && ['inventory', 'report', 'knowledge'].includes(c.id) && <button className="text-button criterion-action" onClick={() => correct(c.id)}>{c.id === 'inventory' ? 'Voir l’écart et le corriger' : c.id === 'report' ? 'Répondre au ticket' : 'Faire le bilan'}<ArrowRight size={12} /></button>}</div><span>{c.passed ? 'Validé' : ['report', 'knowledge'].includes(c.id) ? 'À terminer' : 'À faire'}</span></li>)}</ul>
    <div className="modal-actions"><button className="button azure-button" onClick={() => correct(next?.id)}>Continuer la mission<ArrowRight size={15} /></button><button className="text-button" onClick={() => setModal({ kind: 'hints' })}><Lightbulb size={15} />Un indice</button></div>
  </TeachingView>;
}
function HintsView() {
  const { run, dispatch, setModal } = useWorkspace();
  const [topic, setTopic] = useState<HintTopic>('subscription');
  const selected = HINTS[topic];
  const level = run.hints[topic];
  return <TeachingView title="Un petit coup de main">
    <p className="modal-intro">Choisis ce qui te bloque. Les indices se dévoilent progressivement.</p>
    <label className="form-field"><span>J’ai besoin d’aide pour…</span><select value={topic} onChange={e => setTopic(e.target.value as HintTopic)}>{Object.entries(HINTS).map(([key, value]) => <option key={key} value={key}>{value.title}</option>)}</select></label>
    <div className="hint-list">{level === 0 ? <div className="hint-empty"><Lightbulb size={27} /><p>Un premier indice pour t’orienter.</p></div> : selected.hints.slice(0, level).map((hint, index) => <div key={hint}><span>{index + 1}</span><p>{hint}</p></div>)}</div>
    <div className="modal-actions"><button className="button azure-button" disabled={level >= 3} onClick={() => dispatch({ type: 'HINT', topic })}><Lightbulb size={16} />{level === 0 ? 'Afficher un indice' : level < 3 ? 'Un indice plus précis' : 'Tous les indices sont affichés'}</button><button className="text-button" onClick={() => setModal(null)}>Reprendre</button></div>
    <p className="muted small">Tu peux réussir avec de l’aide. Les indices utilisés figurent dans ton bilan.</p>
  </TeachingView>;
}
function ResetView() {
  const { setModal, dispatch } = useWorkspace();
  return <TeachingView title="Recommencer cet essai ?">
    <p className="modal-intro">Le ticket, les groupes créés, les réponses et les indices de cet essai seront réinitialisés. Ton carnet et l’autre scénario seront conservés.</p>
    <div className="modal-actions"><button className="button azure-button" onClick={() => { dispatch({ type: 'RESET' }); setModal(null); }}><RotateCcw size={16} />Recommencer cet essai</button><button className="button button-outline" onClick={() => setModal(null)}>Conserver ma progression</button></div>
  </TeachingView>;
}
function DeleteDialog({ groupId }: { groupId: string }) {
  const { run, dispatch, setModal } = useWorkspace();
  const [confirmation, setConfirmation] = useState('');
  const group = run.groups.find(g => g.id === groupId);
  if (!group) return null;
  return <Modal title="Supprimer un groupe de ressources" onClose={() => setModal(null)}>
    <Notice>Vérifie le nom de ce groupe vide avant de confirmer sa suppression.</Notice>
    <div className="delete-group-name"><Trash2 size={21} /><strong>{group.name}</strong><Badge>0 ressource</Badge></div>
    <label className="form-field"><span>Recopie le nom exact du groupe</span><input value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" /></label>
    <div className="modal-actions"><button className="button button-danger" disabled={confirmation !== group.name} onClick={() => { dispatch({ type: 'DELETE_GROUP', groupId, confirmation, now: Date.now() }); setModal(null); }}>Supprimer le groupe simulé</button><button className="button button-outline" onClick={() => setModal(null)}>Annuler</button></div>
  </Modal>;
}
function SuccessView() {
  const { run, scenario, setModal, dispatch, openPortal } = useWorkspace();
  const hints = Object.values(run.hints).reduce((a, b) => a + b, 0);
  return <TeachingView title="Mission accomplie" className="success-view">
    <div className="mission-success-icon"><Award size={34} strokeWidth={1.5} /></div>
    <Badge tone="green">{hints ? 'Réussie avec aide' : 'Réussie en autonomie'}</Badge>
    <p>Ton environnement DEV est prêt. Le groupe est conservé pour la prochaine étape.</p>
    <div className="success-group"><CheckCircle2 size={19} /><div><strong>{scenario.targetName}</strong><span>DEV · France Central · 4 étiquettes demandées · 0 ressource</span></div></div>
    <div className="modal-actions"><button className="button azure-button" onClick={() => { setModal(null); openPortal('detail', targetGroup(run)?.id); }}>Reprendre le portail<ArrowRight size={15} /></button>
      {run.scenarioKey === 'demandesetude' && <button className="button button-outline" onClick={() => { dispatch({ type: 'SWITCH_SCENARIO', key: 'suiviinterventions' }); setModal(null); }}>Essayer le défi autonome</button>}
    </div>
    <p className="muted small">Le défi conserve ta mission DemandesEtude.</p>
  </TeachingView>;
}
