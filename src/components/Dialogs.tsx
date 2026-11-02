import { useState } from 'react';
import { ArrowRight, Award, CheckCircle2, Lightbulb, RotateCcw, Trash2 } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';
import { targetGroup } from '../domain/engine';
import { HINTS } from '../domain/scenario';
import type { HintTopic } from '../domain/types';
import { Badge, CheckDot, Modal, Notice } from './Shared';

export function Dialogs() {
  const { modal, setModal } = useWorkspace();
  if (!modal) return null;
  if (modal.kind === 'assessment') return <AssessmentDialog />;
  if (modal.kind === 'hints') return <HintsDialog />;
  if (modal.kind === 'reset') return <ResetDialog />;
  if (modal.kind === 'success') return <SuccessDialog />;
  if (modal.kind === 'delete') return <DeleteDialog groupId={modal.groupId} />;
  return <Modal title="Mission" onClose={() => setModal(null)}><p>Reprends ta mission.</p></Modal>;
}
function AssessmentDialog() {
  const { assessment, run, setModal, openPortal, openApp } = useWorkspace();
  const next = assessment.checks.find(c => !c.passed);
  const resume = () => {
    setModal(null);
    if (next && ['report', 'knowledge'].includes(next.id)) openApp('tickets');
    else { const group = targetGroup(run); openPortal(group ? 'detail' : 'groups', group?.id); }
  };
  return <Modal title="Le point sur ta mission" onClose={() => setModal(null)} className="assessment-modal"><div className="assessment-summary"><div className="assessment-ring" style={{ '--progress': assessment.passed / 9 * 100 + '%' } as React.CSSProperties}><strong>{assessment.passed}<small>/9</small></strong></div><div><Badge tone={assessment.complete ? 'green' : 'blue'}>{assessment.complete ? 'Mission réussie' : 'Mission en cours'}</Badge><p>{assessment.complete ? 'Ton environnement et ton compte rendu sont conformes.' : 'Le contrôle porte sur l’état actuel de ton environnement.'}</p></div></div>
    <ul className="criteria-list">{assessment.checks.map(c => <li key={c.id} className={c.passed ? 'passed' : ''}><CheckDot passed={c.passed} /><div><strong>{c.label}</strong><p>{c.detail}</p></div><span>{c.passed ? 'Validé' : 'À faire'}</span></li>)}</ul>
    <div className="modal-actions"><button className="button button-dark" onClick={resume}>Continuer la mission<ArrowRight size={15} /></button><button className="text-button" onClick={() => setModal({ kind: 'hints' })}><Lightbulb size={15} />Un indice</button></div>
  </Modal>;
}
function HintsDialog() {
  const { run, dispatch, setModal } = useWorkspace();
  const [topic, setTopic] = useState<HintTopic>('subscription');
  const selected = HINTS[topic];
  const level = run.hints[topic];
  return <Modal title="Un petit coup de main" onClose={() => setModal(null)}><p className="modal-intro">Choisis ce qui te bloque. Les indices se dévoilent progressivement.</p><label className="form-field"><span>J’ai besoin d’aide pour…</span><select value={topic} onChange={e => setTopic(e.target.value as HintTopic)}>{Object.entries(HINTS).map(([key, value]) => <option key={key} value={key}>{value.title}</option>)}</select></label>
    <div className="hint-list">{level === 0 ? <div className="hint-empty"><Lightbulb size={30} /><p>Un premier indice pour t’orienter.</p></div> : selected.hints.slice(0, level).map((hint, index) => <div key={hint}><span>{index + 1}</span><p>{hint}</p></div>)}</div>
    <div className="modal-actions"><button className="button button-dark" disabled={level >= 3} onClick={() => dispatch({ type: 'HINT', topic })}><Lightbulb size={16} />{level === 0 ? 'Afficher un indice' : level < 3 ? 'Un indice plus précis' : 'Tous les indices sont affichés'}</button><button className="text-button" onClick={() => setModal(null)}>Reprendre</button></div><p className="muted small">Les indices utilisés sont indiqués dans ton bilan. Tu peux réussir avec de l’aide.</p>
  </Modal>;
}
function ResetDialog() {
  const { setModal, dispatch } = useWorkspace();
  return <Modal title="Recommencer cet essai ?" onClose={() => setModal(null)}><p className="modal-intro">Le ticket, les groupes créés, les réponses et les indices de cet essai seront réinitialisés. Ton carnet et l’autre scénario seront conservés.</p><div className="modal-actions"><button className="button button-dark" onClick={() => { dispatch({ type: 'RESET' }); setModal(null); }}><RotateCcw size={16} />Recommencer cet essai</button><button className="button button-outline" onClick={() => setModal(null)}>Conserver ma progression</button></div></Modal>;
}
function DeleteDialog({ groupId }: { groupId: string }) {
  const { run, dispatch, setModal } = useWorkspace();
  const [confirmation, setConfirmation] = useState('');
  const group = run.groups.find(g => g.id === groupId);
  if (!group) return null;
  return <Modal title="Supprimer ce groupe de formation" onClose={() => setModal(null)}><Notice>Cette action supprime le groupe vide créé pendant ton essai. Vérifie son nom avant de confirmer.</Notice><div className="delete-group-name"><Trash2 size={21} /><strong>{group.name}</strong><Badge>0 ressource</Badge></div><label className="form-field"><span>Recopie le nom exact du groupe</span><input value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" /></label><div className="modal-actions"><button className="button button-danger" disabled={confirmation !== group.name} onClick={() => { dispatch({ type: 'DELETE_GROUP', groupId, confirmation, now: Date.now() }); setModal(null); }}>Supprimer le groupe simulé</button><button className="button button-outline" onClick={() => setModal(null)}>Annuler</button></div></Modal>;
}
function SuccessDialog() {
  const { run, scenario, setModal, dispatch } = useWorkspace();
  const hints = Object.values(run.hints).reduce((a, b) => a + b, 0);
  return <Modal title="Mission accomplie" onClose={() => setModal(null)} className="success-modal"><div className="success-art"><span className="success-orbit orbit-one" /><span className="success-orbit orbit-two" /><div><Award size={49} strokeWidth={1.4} /></div><span className="success-spark spark-one">+</span><span className="success-spark spark-two">+</span><span className="success-spark spark-three">·</span></div><Badge tone="green">{hints ? 'Réussie avec aide' : 'Réussie en autonomie'}</Badge><h3>Ton premier environnement<br />est prêt pour la suite.</h3><p>Tu as transformé un ticket en configuration vérifiée, puis rendu compte de ton intervention.</p><div className="success-group"><CheckCircle2 size={21} /><div><strong>{scenario.targetName}</strong><span>DEV · France Central · 4 étiquettes · 0 ressource</span></div></div><p className="success-next">Prochaine étape du parcours : choisir l’hébergement de l’application. Ton groupe est conservé.</p><div className="modal-actions"><button className="button button-dark" onClick={() => setModal(null)}>Retour à mon bureau<ArrowRight size={15} /></button>{run.scenarioKey === 'demandesetude' && <button className="button button-outline" onClick={() => { dispatch({ type: 'SWITCH_SCENARIO', key: 'suiviinterventions' }); setModal(null); }}>Essayer le défi autonome</button>}</div><p className="muted small">Le défi utilise un autre ticket et conserve ta mission DemandesEtude.</p></Modal>;
}
