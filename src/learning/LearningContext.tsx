import { useEffect, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { learningReducer } from './reducer';
import { deserializeLearning, LEARNING_KEY, loadLearning } from './persistence';
import { LearningContext } from './context';
export function LearningProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(loadLearning);
  const [state, dispatch] = useReducer(learningReducer, loaded.state);
  const [saveOk, setSaveOk] = useState(true);
  const serialized = useRef('');
  useEffect(() => {
    try { const raw = JSON.stringify(state); if (raw !== serialized.current) { localStorage.setItem(LEARNING_KEY, raw); serialized.current = raw; } setSaveOk(true); }
    catch { setSaveOk(false); }
  }, [state]);
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key !== LEARNING_KEY || !event.newValue || event.newValue === serialized.current) return;
      const incoming = deserializeLearning(event.newValue);
      if (!incoming.recovered) { serialized.current = JSON.stringify(incoming.state); dispatch({ type: 'SYNC', state: incoming.state }); }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);
  useEffect(() => {
    const due = [...state.world.apps, ...state.demo.apps].flatMap(app => app.operation ? [app.operation.completeAt] : []);
    if (!due.length) return;
    const timer = window.setTimeout(() => dispatch({ type: 'SETTLE', now: Date.now() }), Math.max(0, Math.min(...due) - Date.now()) + 5);
    return () => window.clearTimeout(timer);
  }, [state.world.apps, state.demo.apps]);
  const world = state.ui.scope === 'lab' ? state.world : state.demo;
  const appStatus = world.apps.find(app => app.id === state.ui.selectedId)?.status;
  useEffect(() => {
    if (state.ui.surface === 'azure' && state.ui.page === 'app' && state.ui.appTab !== 'deployment' && appStatus) dispatch({ type: 'OBSERVE_APP', scope: state.ui.scope, appId: state.ui.selectedId, now: Date.now() });
  }, [state.ui.surface, state.ui.page, state.ui.scope, state.ui.selectedId, state.ui.appTab, appStatus]);
  return <LearningContext value={{ state, dispatch, saveOk, recovered: loaded.recovered }}>{children}</LearningContext>;
}
