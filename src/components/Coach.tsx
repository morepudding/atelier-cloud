import { ArrowRight, BookOpen, ChevronLeft, Clock3, Flag, Lightbulb, ListChecks, RotateCcw } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';
import { Badge, Brand, CheckDot } from './Shared';

export function Coach({ onClose }: { onClose?: () => void }) {
  const { run, scenario, assessment, openApp, openPortal, setModal, dispatch } = useWorkspace();
  const stages = [
    { title: 'Lire la demande', subtitle: 'Comprendre le périmètre', done: Boolean(run.startedAt), action: () => openApp('tickets') },
    { title: 'Préparer Azure', subtitle: 'Abonnement et groupe', done: assessment.checks.slice(0, 4).every(c => c.passed), action: () => openPortal('groups') },
    { title: 'Identifier le projet', subtitle: 'Quatre étiquettes à vérifier', done: assessment.checks[4].passed, action: () => openPortal('groups') },
    { title: 'Rendre compte', subtitle: 'Contrôler puis répondre', done: assessment.checks[7].passed, action: () => openApp('tickets') },
    { title: 'Faire le bilan', subtitle: 'Comprendre tes gestes', done: assessment.checks[8].passed, action: () => openApp('tickets') },
  ];
  const firstIncomplete = stages.findIndex(s => !s.done);
  return <aside className="coach">
    <div className="coach-brand"><Brand />{onClose && <button className="icon-button mobile-only" aria-label="Fermer le panneau de mission" onClick={onClose}><ChevronLeft size={20} /></button>}</div>
    <div className="course-label"><span className="course-line" /> TON PARCOURS</div>
    <div className="course-name"><span className="course-icon"><BookOpen size={18} /></span><div><strong>Azure, en pratique</strong><span>Les fondamentaux · AZ-900</span></div></div>
    <div className="coach-rule" />
    <div className="mission-eyebrow">MISSION 01 <span>/ 06</span></div>
    <h1>{scenario.title}</h1>
    <p className="coach-intro">{scenario.application} a besoin d’un espace pour sa prochaine version. À toi de le préparer.</p>
    <div className="mission-meta"><Clock3 size={13} /> 25–30 min <span>·</span><Badge tone="green">Débutant</Badge></div>
    <div className="coach-progress"><div><span>Ta progression</span><strong>{assessment.passed}<span> / 9</span></strong></div><progress value={assessment.passed} max={9} aria-label="Progression de la mission" /></div>
    <nav className="mission-stages" aria-label="Étapes de la mission">{stages.map((stage, index) =>
      <button key={stage.title} className={'stage ' + (firstIncomplete === index ? 'stage-current' : '')} onClick={() => { stage.action(); onClose?.(); }}>
        <span className={'stage-number ' + (stage.done ? 'stage-done' : '')}>{stage.done ? <CheckDot passed /> : String(index + 1).padStart(2, '0')}</span>
        <span><strong>{stage.title}</strong><small>{stage.subtitle}</small></span>{firstIncomplete === index && <ArrowRight size={14} />}
      </button>)}</nav>
    <div className="coach-spacer" />
    <div className="coach-tip"><Lightbulb size={18} /><div><strong>Tu as le droit d’essayer.</strong><p>Trompe-toi, observe et corrige. Les indices sont là si tu en as besoin.</p></div></div>
    <button className="button button-dark full-width" onClick={() => setModal({ kind: 'assessment' })}><ListChecks size={17} />Vérifier ma mission</button>
    <div className="coach-bottom"><button onClick={() => setModal({ kind: 'hints' })}><Lightbulb size={14} />Un indice</button><button onClick={() => { dispatch({ type: 'UI', patch: { activeApp: 'notes', notesTab: 'course' } }); onClose?.(); }}><BookOpen size={14} />Les notions</button></div>
    {assessment.complete && <button className="text-button success-link" onClick={() => setModal({ kind: 'success' })}><Flag size={14} />Revoir ma réussite</button>}
    {run.scenarioKey === 'suiviinterventions' && <button className="text-button" onClick={() => dispatch({ type: 'SWITCH_SCENARIO', key: 'demandesetude' })}><RotateCcw size={13} />Revenir à DemandesEtude</button>}
  </aside>;
}
