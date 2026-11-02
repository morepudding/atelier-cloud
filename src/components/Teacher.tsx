import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, GraduationCap, Square, Volume2 } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';
import { introduction, INTRO_SCENE_COUNT, teacherGuidance } from '../domain/teacher';
import type { TeacherAction } from '../domain/teacher';

function Narration({ text }: { text: string }) {
  const [reading, setReading] = useState(false);
  const [failed, setFailed] = useState(false);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const supported = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
  const stop = () => {
    if (utterance.current) {
      utterance.current.onend = null;
      utterance.current.onerror = null;
      utterance.current = null;
      window.speechSynthesis.cancel();
    }
  };
  useEffect(() => {
    const hide = () => { if (document.hidden) { stop(); setReading(false); } };
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); stop(); };
  }, []);
  if (!supported) return null;
  const listen = () => {
    stop();
    if (reading) { setReading(false); return; }
    try {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = 'fr-FR';
      speech.rate = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === 'fr-FR' && v.localService) ?? voices.find(v => v.lang.startsWith('fr'));
      if (voice) speech.voice = voice;
      speech.onend = () => { utterance.current = null; setReading(false); };
      speech.onerror = () => { utterance.current = null; setReading(false); setFailed(true); };
      utterance.current = speech;
      setFailed(false);
      setReading(true);
      window.speechSynthesis.speak(speech);
    } catch { stop(); setReading(false); setFailed(true); }
  };
  return <div className="teacher-audio"><button className="icon-button" onClick={listen} aria-label={reading ? 'Arrêter la lecture de Nora' : 'Écouter Nora'} title={reading ? 'Arrêter la lecture' : 'Écouter cette réplique'} aria-pressed={reading}>{reading ? <Square size={15} /> : <Volume2 size={17} />}</button>{failed && <span role="status">Lecture indisponible. Le dialogue reste affiché.</span>}</div>;
}

export function Teacher() {
  const { state, run, dispatch, openApp, openPortal, setModal } = useWorkspace();
  const isIntro = run.teacherIntroStep < INTRO_SCENE_COUNT;
  const guidance = !isIntro ? teacherGuidance(run, state.ui) : null;
  const scene = isIntro ? introduction(run)[run.teacherIntroStep] : guidance!;
  const nextAction = guidance?.action;
  const finish = (openTicket: boolean) => {
    dispatch({ type: 'TEACHER_INTRO', step: INTRO_SCENE_COUNT });
    if (openTicket) openApp('tickets');
  };
  const act = (action: TeacherAction) => {
    if (action.kind === 'portal') openPortal(action.page, action.groupId);
    else if (action.kind === 'ticket') openApp('tickets');
    else setModal({ kind: action.kind });
  };
  return <section className={'teacher ' + (isIntro ? 'teacher-intro' : '')} aria-label={isIntro ? 'Introduction avec Nora' : 'La prochaine consigne de Nora'}>
    <div className="teacher-identity"><span className="teacher-avatar" aria-hidden="true">N<GraduationCap size={13} /></span><div><strong>Nora</strong><span>Ta professeure · Azure</span></div><Narration key={run.scenarioKey + ':' + scene.id + ':' + scene.message} text={scene.title + ' ' + scene.message} /></div>
    {isIntro && <div className="teacher-scene-label">LE BRIEFING <span>{run.teacherIntroStep + 1} / {INTRO_SCENE_COUNT}</span></div>}
    <div className="teacher-dialogue" aria-live="polite" aria-atomic="true"><h3>{scene.title}</h3><p>{scene.message}</p></div>
    {isIntro ? <>
      <div className="teacher-scene-actions">{run.teacherIntroStep > 0 && <button className="icon-button" aria-label="Réplique précédente" onClick={() => dispatch({ type: 'TEACHER_INTRO', step: run.teacherIntroStep - 1 })}><ArrowLeft size={17} /></button>}<div className="teacher-scene-dots" aria-hidden="true">{[0, 1, 2].map(step => <span key={step} className={step === run.teacherIntroStep ? 'active' : ''} />)}</div><button className="button azure-button" onClick={() => run.teacherIntroStep === INTRO_SCENE_COUNT - 1 ? finish(true) : dispatch({ type: 'TEACHER_INTRO', step: run.teacherIntroStep + 1 })}>{run.teacherIntroStep === INTRO_SCENE_COUNT - 1 ? 'C’est parti · Lire le ticket' : 'Continuer'}<ArrowRight size={15} /></button></div>
      <button className="text-button teacher-skip" onClick={() => finish(false)}>Passer l’introduction</button>
    </> : nextAction && nextAction.kind !== 'ticket' && nextAction.kind !== 'assessment' && <button className="text-button teacher-next" onClick={() => act(nextAction)}>{guidance?.actionLabel}<ArrowRight size={14} /></button>}
  </section>;
}
