import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, ChevronDown, ChevronUp, ExternalLink, Flag, GraduationCap, Lightbulb, Maximize2, Monitor, MoreHorizontal, RotateCcw, Undo2 } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';
import { LearningPanelContent } from './Dialogs';
import { Teacher } from './Teacher';
import { INTRO_SCENE_COUNT } from '../domain/teacher';

export function MissionPanel({ onNewCourse }: { onNewCourse?: () => void }) {
  const { state, run, assessment, openApp, openPortal, modal, setModal, dispatch, toast, showToast, saveOk, recovered } = useWorkspace();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const learningView = modal && modal.kind !== 'delete' ? modal.kind : null;
  const collapsed = state.ui.missionPanelCollapsed && !learningView;
  const title = run.scenarioKey === 'demandesetude' ? 'Mission 1 · Préparer DEV' : 'Mission 1 · Défi autonome';
  const menuId = 'mission-options';
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => document.documentElement.style.setProperty('--mission-panel-clearance', element.offsetHeight + 24 + 'px');
    update();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    observer?.observe(element);
    return () => { observer?.disconnect(); document.documentElement.style.removeProperty('--mission-panel-clearance'); };
  }, []);
  useEffect(() => {
    if (learningView) ref.current?.querySelector<HTMLElement>('[data-learning-view]')?.focus({ preventScroll: true });
  }, [learningView]);
  const collapse = () => {
    setOptionsOpen(false);
    setModal(null);
    dispatch({ type: 'UI', patch: { missionPanelCollapsed: true } });
  };
  const menuAction = (action: () => void) => { setOptionsOpen(false); setModal(null); action(); };
  const fullScreen = async () => {
    setOptionsOpen(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else showToast('Le mode plein écran est disponible avec la touche F11 de ton navigateur.');
    } catch { showToast('Le navigateur n’a pas activé le plein écran. Tu peux utiliser F11.'); }
  };
  return <aside ref={ref} className={'mission-panel ' + (state.ui.activeApp !== 'azure' ? 'mission-panel-on-desktop ' : '') + (collapsed ? 'mission-panel-collapsed' : '') + (learningView ? 'mission-panel-expanded' : '')} aria-label="Accompagnement de la mission" onKeyDown={event => { if (event.key === 'Escape') { setOptionsOpen(false); setModal(null); } }}>
    <header className="mission-panel-header">
      {learningView && <button className="icon-button" aria-label="Revenir à la mission" onClick={() => setModal(null)}><ArrowLeft size={16} /></button>}
      <h2>{title}</h2>
      {collapsed && <span className="mission-mini-progress">{assessment.passed}/9</span>}
      {!collapsed && <button className="icon-button mission-options-trigger" aria-label="Options de la mission" aria-controls={menuId} aria-expanded={optionsOpen} onClick={() => setOptionsOpen(!optionsOpen)}><MoreHorizontal size={18} /></button>}
      <button className="icon-button" aria-label={collapsed ? 'Développer l’encadré de mission' : 'Réduire l’encadré de mission'} aria-expanded={!collapsed} onClick={() => collapsed ? dispatch({ type: 'UI', patch: { missionPanelCollapsed: false } }) : collapse()}>{collapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
    </header>
    {!collapsed && <>
      {optionsOpen && <nav id={menuId} className="mission-panel-options" aria-label="Outils de la mission">
        {onNewCourse && <button onClick={onNewCourse}><GraduationCap size={15} />Nouveau parcours · Application indisponible</button>}
        <button onClick={() => menuAction(() => dispatch({ type: 'UI', patch: { activeApp: null } }))}><Monitor size={15} />Afficher le bureau</button>
        <button onClick={() => menuAction(() => openPortal(state.ui.portalPage))}><ExternalLink size={15} />Ouvrir le portail Azure</button>
        <button onClick={() => menuAction(() => openApp('notes'))}><BookOpen size={15} />Ouvrir le carnet</button>
        <button onClick={() => menuAction(() => dispatch({ type: 'UI', patch: { activeApp: 'notes', notesTab: 'course' } }))}><BookOpen size={15} />Les notions utiles</button>
        <button onClick={() => menuAction(() => dispatch({ type: 'TEACHER_INTRO', step: 0 }))}><GraduationCap size={15} />Rejouer l’introduction de Nora</button>
        <button onClick={() => { setOptionsOpen(false); setModal({ kind: 'impact' }); }}><Lightbulb size={15} />Pourquoi ces étiquettes ?</button>
        <button onClick={() => { setOptionsOpen(false); setModal({ kind: 'recovery' }); }}><Undo2 size={15} />Corriger ou revenir en arrière</button>
        <button onClick={fullScreen}><Maximize2 size={15} />Mode plein écran</button>
        <button onClick={() => { setOptionsOpen(false); setModal({ kind: 'reset' }); }}><RotateCcw size={15} />Recommencer la mission</button>
        {assessment.complete && <button onClick={() => { setOptionsOpen(false); setModal({ kind: 'success' }); }}><Flag size={15} />Revoir ma réussite</button>}
        {run.scenarioKey === 'suiviinterventions' && <button onClick={() => menuAction(() => dispatch({ type: 'SWITCH_SCENARIO', key: 'demandesetude' }))}><ArrowLeft size={15} />Revenir à DemandesEtude</button>}
      </nav>}
      {learningView ? <div className="mission-panel-scroll" key={learningView}><LearningPanelContent /></div> : <>
        <Teacher />
        {run.teacherIntroStep >= INTRO_SCENE_COUNT && <>
        <div className="mission-panel-progress"><progress value={assessment.passed} max={9} aria-label="Progression de la mission" /><span>{assessment.passed} / 9 critères</span></div>
        <div className="mission-panel-actions">
          <button className="button button-outline" onClick={() => openApp('tickets')}><ExternalLink size={15} />Voir le ticket</button>
          <button className="button button-outline" onClick={() => setModal({ kind: 'hints' })}><Lightbulb size={16} />Indice</button>
          <button className="button azure-button" onClick={() => setModal({ kind: 'assessment' })}><Check size={16} />Vérifier</button>
        </div>
        <div className="mission-panel-tools"><button className="text-button" onClick={() => setModal({ kind: 'impact' })}>Pourquoi ces étiquettes ?</button><button className="text-button" onClick={() => setModal({ kind: 'recovery' })}><Undo2 size={13} />Corriger / revenir en arrière</button></div>
        </>}
      </>}
      {toast && <p className="mission-panel-toast" role="status"><Check size={14} />{toast}</p>}
      {(!saveOk || recovered) && <p className="mission-panel-storage" role="alert">{!saveOk ? 'Sauvegarde indisponible : garde cet onglet ouvert pour conserver cet essai.' : 'Une sauvegarde illisible a été remplacée par un nouvel essai.'}</p>}
    </>}
  </aside>;
}
