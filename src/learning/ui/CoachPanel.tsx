import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, ExternalLink, GraduationCap, Maximize2, Monitor, MoreHorizontal, NotebookPen, RotateCcw } from 'lucide-react';
import { Narration } from '../../components/Teacher';
import { useLearning } from '../context';
import { LessonContent, lessonLead, phaseTitles } from './LessonContent';

export function CoachPanel({ onLegacy }: { onLegacy: () => void }) {
  const { state, dispatch, saveOk, recovered } = useLearning();
  const [menu, setMenu] = useState(false);
  const [fullScreenMessage, setFullScreenMessage] = useState('');
  const ref = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => document.documentElement.style.setProperty('--mission-panel-clearance', element.offsetHeight + 24 + 'px');
    update();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    observer?.observe(element);
    return () => { observer?.disconnect(); document.documentElement.style.removeProperty('--mission-panel-clearance'); };
  }, []);
  useEffect(() => { if (content.current) content.current.scrollTop = 0; }, [state.lesson.phase, state.lesson.demoStep, state.ui.panelView]);
  const act = (action: () => void) => { setMenu(false); action(); };
  const fullScreen = async () => {
    setMenu(false);
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { setFullScreenMessage('Le plein écran peut aussi être activé avec F11.'); }
  };
  return <aside ref={ref} aria-label="Accompagnement de Nora" className={'mission-panel learning-coach ' + (state.ui.surface !== 'azure' ? 'mission-panel-on-desktop ' : '') + (state.ui.collapsed ? 'mission-panel-collapsed' : '')} onKeyDown={event => { if (event.key === 'Escape') { setMenu(false); dispatch({ type: 'UI', patch: { panelView: 'lesson' } }); } }}>
    <header className="mission-panel-header">{state.ui.panelView !== 'lesson' && !state.ui.collapsed && <button className="icon-button" aria-label="Revenir au cours" onClick={() => dispatch({ type: 'UI', patch: { panelView: 'lesson' } })}><ArrowLeft size={16} /></button>}<h2>Application indisponible</h2>{!state.ui.collapsed && <button className="icon-button" aria-label="Options du parcours" aria-expanded={menu} onClick={() => setMenu(!menu)}><MoreHorizontal size={18} /></button>}<button className="icon-button" aria-label={state.ui.collapsed ? 'Développer l’encadré de Nora' : 'Réduire l’encadré de Nora'} aria-expanded={!state.ui.collapsed} onClick={() => { setMenu(false); dispatch({ type: 'UI', patch: { collapsed: !state.ui.collapsed } }); }}>{state.ui.collapsed ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button></header>
    {!state.ui.collapsed && <>{menu && <nav className="mission-panel-options" aria-label="Outils du parcours">
      <button onClick={() => act(() => dispatch({ type: 'OPEN_PORTAL_HELP' }))}><ExternalLink size={15} />Ouvrir App Services avec Nora</button><button onClick={() => act(() => dispatch({ type: 'UI', patch: { surface: 'desktop' } }))}><Monitor size={15} />Afficher le bureau</button><button onClick={() => act(() => dispatch({ type: 'UI', patch: { surface: 'notes' } }))}><NotebookPen size={15} />Ouvrir le carnet</button><button onClick={() => act(() => dispatch({ type: 'UI', patch: { panelView: 'evidence' } }))}><BookOpen size={15} />Mes preuves d’apprentissage</button><button onClick={() => act(() => dispatch({ type: 'REVIEW_EXPLANATION' }))}><GraduationCap size={15} />Revoir l’explication</button><button onClick={fullScreen}><Maximize2 size={15} />Mode plein écran</button><button onClick={() => act(() => dispatch({ type: 'UI', patch: { panelView: 'reset' } }))}><RotateCcw size={15} />Rejouer le cours</button><button onClick={() => act(onLegacy)}><ArrowLeft size={15} />Reprendre l’ancien exercice</button>
    </nav>}<div className="learning-coach-identity"><span className="teacher-avatar" aria-hidden="true">N<GraduationCap size={13} /></span><div><strong>Nora</strong><span>Comprendre · observer · expliquer</span></div><Narration key={state.lesson.phase + lessonLead(state)} text={phaseTitles[state.lesson.phase] + '. ' + lessonLead(state)} /></div><div ref={content} className="learning-coach-content" tabIndex={-1}><LessonContent /></div>{(!saveOk || recovered) && <p className="mission-panel-storage" role="alert">{!saveOk ? 'Sauvegarde indisponible : garde cet onglet ouvert.' : 'Une sauvegarde illisible a été conservée à part. Un nouvel atelier a été ouvert.'}</p>}{fullScreenMessage && <p className="mission-panel-storage" role="status">{fullScreenMessage}</p>}</>}
  </aside>;
}
