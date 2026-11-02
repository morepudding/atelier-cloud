import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, Check, ChevronRight, Cloud, X } from 'lucide-react';
import type { TagRow } from '../domain/types';

export function AzureLogo({ size = 28 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M14.5 3 3 23.5h7L18.5 3h-4Z" fill="currentColor" opacity=".8" />
    <path d="m20 6 9 23H12l12-3.5L20 6Z" fill="currentColor" />
  </svg>;
}
export function Brand({ small = false }: { small?: boolean }) {
  return <div className={'brand ' + (small ? 'brand-small' : '')}>
    <span className="brand-symbol"><Cloud size={small ? 19 : 23} strokeWidth={1.7} /></span>
    <span>atelier<span className="brand-light"> cloud</span><span className="brand-dot">.</span></span>
  </div>;
}
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'blue' | 'amber' }) {
  return <span className={'badge badge-' + tone}>{children}</span>;
}
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={'notice ' + (error ? 'notice-error' : '')} role={error ? 'alert' : 'note'}><AlertCircle size={17} /><div>{children}</div></div>;
}
export function Breadcrumb({ items, onHome }: { items: string[]; onHome?: () => void }) {
  return <nav className="breadcrumb" aria-label="Fil d’Ariane"><button onClick={onHome}>Accueil</button>{items.map((item, index) => <span key={index}><ChevronRight size={12} />{item}</span>)}</nav>;
}
export function TagEditor({ rows, onChange, disabled = false }: { rows: TagRow[]; onChange: (rows: TagRow[]) => void; disabled?: boolean }) {
  return <div className="tag-editor">
    <div className="tag-heading"><span>Nom</span><span>Valeur</span><span /></div>
    {rows.map((row, index) => <div className="tag-row" key={index}>
      <input aria-label={'Nom de l’étiquette ' + (index + 1)} placeholder="ex. Environment" value={row.key} disabled={disabled}
        onChange={e => onChange(rows.map((r, i) => i === index ? { ...r, key: e.target.value } : r))} />
      <input aria-label={'Valeur de l’étiquette ' + (index + 1)} placeholder="ex. DEV" value={row.value} disabled={disabled}
        onChange={e => onChange(rows.map((r, i) => i === index ? { ...r, value: e.target.value } : r))} />
      <button className="icon-button" aria-label={'Supprimer l’étiquette ' + (index + 1)} disabled={disabled}
        onClick={() => onChange(rows.length === 1 ? [{ key: '', value: '' }] : rows.filter((_, i) => i !== index))}><X size={15} /></button>
    </div>)}
    {!disabled && <button className="text-button" onClick={() => onChange([...rows, { key: '', value: '' }])}>+ Ajouter une étiquette</button>}
  </div>;
}
export function Modal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = ref.current;
    dialog?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(); }
      if (event.key !== 'Tab' || !dialog) return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')).filter(e => e.getClientRects().length);
      const first = elements[0];
      const last = elements.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} ref={ref} className={'modal ' + className}>
      <div className="modal-heading"><h2 id={id}>{title}</h2><button className="icon-button" aria-label="Fermer la fenêtre de dialogue" onClick={onClose}><X size={20} /></button></div>
      {children}
    </div>
  </div>;
}
export function CheckDot({ passed }: { passed: boolean }) {
  return <span className={'check-dot ' + (passed ? 'is-passed' : '')}>{passed ? <Check size={12} strokeWidth={3} /> : null}</span>;
}
