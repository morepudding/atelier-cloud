import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { assess, loadWorkspace, workspaceReducer } from './domain/engine';
import { SCENARIOS, STORAGE_KEY } from './domain/scenario';
import type { Scenario } from './domain/scenario';
import type { Action, AppName, Assessment, PortalPage, RunState, WorkspaceState } from './domain/types';

export type ModalSpec = { kind: 'assessment' | 'hints' | 'reset' | 'success' | 'quiz' } | { kind: 'delete'; groupId: string } | null;
interface WorkspaceValue {
  state: WorkspaceState;
  run: RunState;
  scenario: Scenario;
  dispatch: Dispatch<Action>;
  assessment: Assessment;
  modal: ModalSpec;
  setModal: (modal: ModalSpec) => void;
  openApp: (app: AppName) => void;
  openPortal: (page: PortalPage, groupId?: string) => void;
  toast: string;
  showToast: (text: string) => void;
  saveOk: boolean;
  recovered: boolean;
}
const WorkspaceContext = createContext<WorkspaceValue | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(loadWorkspace);
  const [state, dispatch] = useReducer(workspaceReducer, loaded.state);
  const [modal, setModalState] = useState<ModalSpec>(null);
  const [toast, showToast] = useState('');
  const [saveOk, setSaveOk] = useState(true);
  const run = state.run;
  const assessment = assess(run);
  const setModal = (next: ModalSpec) => {
    setModalState(next);
    if (next && next.kind !== 'delete') dispatch({ type: 'UI', patch: { missionPanelCollapsed: false } });
  };
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setSaveOk(true); }
    catch { setSaveOk(false); }
  }, [state]);
  useEffect(() => {
    if (!run.pending) return;
    const timer = window.setTimeout(() => dispatch({ type: 'COMPLETE_CREATE', now: Date.now() }), Math.max(0, run.pending.completeAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [run.pending]);
  useEffect(() => {
    if (!assessment.complete || run.completedAt) return;
    dispatch({ type: 'COMPLETE_MISSION', now: Date.now() });
    setModal({ kind: 'success' });
  }, [assessment.complete, run.completedAt]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => showToast(''), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const openApp = (app: AppName) => dispatch({ type: 'UI', patch: { activeApp: app } });
  const openPortal = (page: PortalPage, groupId?: string) => {
    dispatch({ type: 'CLEAR_ERROR' });
    dispatch({ type: 'UI', patch: { activeApp: 'azure', portalPage: page, ...(groupId ? { selectedGroupId: groupId } : {}) } });
  };
  return <WorkspaceContext value={{
    state, run, scenario: SCENARIOS[run.scenarioKey], dispatch, assessment, modal, setModal,
    openApp, openPortal, toast, showToast, saveOk, recovered: loaded.recovered,
  }}>{children}</WorkspaceContext>;
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('WorkspaceProvider manquant');
  return context;
}
