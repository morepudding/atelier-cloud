import { createContext, useContext } from 'react';
import type { Dispatch } from 'react';
import type { Action, LearningState } from './types';

interface Value { state: LearningState; dispatch: Dispatch<Action>; saveOk: boolean; recovered: boolean }
export const LearningContext = createContext<Value | null>(null);
export function useLearning() {
  const value = useContext(LearningContext);
  if (!value) throw new Error('LearningProvider manquant');
  return value;
}
