import { useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';
import { inventoryIssues, targetGroup } from '../domain/engine';
import { tagConsequences, tagSource } from '../domain/tag-learning';
import { regionName, subscriptionName } from '../domain/scenario';
import { Notice, TeachingView } from './Shared';

export function InventoryHistoryControls() {
  const { run, dispatch } = useWorkspace();
  const past = run.inventoryHistory.past.at(-1);
  const future = run.inventoryHistory.future.at(-1);
  return <div className="inventory-history-controls"><button className="button button-outline" disabled={!past || Boolean(run.pending)} onClick={() => dispatch({ type: 'UNDO_INVENTORY', now: Date.now() })} title={past?.label}><Undo2 size={15} />Annuler ma dernière modification</button>{future && <button className="text-button" disabled={Boolean(run.pending)} onClick={() => dispatch({ type: 'REDO_INVENTORY', now: Date.now() })}><Redo2 size={14} />Rétablir la modification</button>}{past && <p className="muted">Dernière action : {past.label}</p>}</div>;
}

export function RecoveryView() {
  const { run, dispatch, setModal, openPortal, openApp, assessment } = useWorkspace();
  const issues = inventoryIssues(run);
  const openGroup = (id: string) => { setModal(null); openPortal('detail', id); };
  return <TeachingView title="Corriger sans tout recommencer">
    <p className="modal-intro">Modifier les étiquettes de ton groupe DEV est permis. Ce contrôle protège les groupes déjà présents et vérifie que tu n’as ajouté que le groupe du ticket.</p>
    <InventoryHistoryControls />
    {run.pending && <Notice>Attends la fin de la création avant d’annuler une action.</Notice>}
    {issues.changed.map(issue => <article className="recovery-card" key={issue.original.id}>
      <h4>{issue.original.name}</h4><p>Ce groupe était déjà présent au début de la mission.</p>
      <div className="recovery-differences">{issue.fields.map(field => <div key={field.label}><strong>{field.label}</strong><span>Actuel : <code>{field.current}</code></span><span>Initial : <code>{field.expected}</code></span></div>)}</div>
      <button className="button azure-button" disabled={Boolean(run.pending)} onClick={() => dispatch({ type: 'RESTORE_BASELINE', groupId: issue.original.id, now: Date.now() })}><RotateCcw size={14} />Restaurer ce groupe initial</button>
      <p className="muted">Ton groupe DEV, ton carnet et tes réponses sont conservés. Cette restauration peut ensuite être annulée.</p>
    </article>)}
    {issues.extras.map(group => <article className="recovery-card" key={group.id}><h4>{group.name}</h4><p>Groupe supplémentaire · {subscriptionName(group.subscriptionId)} · {regionName(group.location)} · {group.resources.length} ressource(s).</p><p>Il n’est pas demandé dans ce ticket. Ouvre-le et vérifie son nom avant de supprimer ce groupe vide dans Azure.</p><button className="button button-outline" onClick={() => openGroup(group.id)}>Examiner ce groupe<ArrowRight size={14} /></button></article>)}
    {!issues.changed.length && !issues.extras.length && <Notice><CheckCircle2 size={14} /> Les groupes initiaux sont intacts.{issues.target ? ' Seul le groupe demandé a été ajouté.' : ' Il reste à créer le groupe du ticket.'}</Notice>}
    {issues.target && <p className="recovery-target">Ton groupe de travail : <strong>{issues.target.name}</strong></p>}
    <div className="modal-actions"><button className="button azure-button" onClick={() => setModal({ kind: 'assessment' })}>Revoir les critères<ArrowRight size={14} /></button>{assessment.technicalReady && !assessment.checks.find(check => check.id === 'report')?.passed && <button className="button button-outline" onClick={() => { setModal(null); openApp('tickets'); }}>Répondre au ticket</button>}<button className="text-button" onClick={() => setModal(null)}>Reprendre la mission</button></div>
  </TeachingView>;
}

export function TagLearningView() {
  const { state, run, scenario, setModal, openPortal } = useWorkspace();
  const source = tagSource(run, state.ui);
  const [example, setExample] = useState(false);
  const examples = { Application: source.expected.Application, Environment: 'PRD', Owner: '', CostCenter: '' };
  const effects = tagConsequences(example ? examples : source.tags, run, source.expected);
  const group = targetGroup(run);
  return <TeachingView title="Pourquoi ces étiquettes ?">
    <p className="modal-intro">Une étiquette est une information attachée au groupe. Elle permet à l’équipe de retrouver l’application, savoir qui appeler et préparer le suivi des coûts.</p>
    <div className="tag-example-switch" role="group" aria-label="Comparer les conséquences"><button className={'button ' + (!example ? 'azure-button' : 'button-outline')} onClick={() => setExample(false)}>Mes valeurs</button><button className={'button ' + (example ? 'azure-button' : 'button-outline')} onClick={() => setExample(true)}>Voir un exemple d’erreur</button></div>
    <p className="tag-source-label">{example ? 'Exemple fictif : mauvaises étiquettes, sans modifier ton travail.' : (source.draft ? 'Aperçu du brouillon : ' : 'Valeurs enregistrées : ') + source.name}</p>
    {source.baseline && <Notice>Ce groupe existait avant le ticket. Conserve ses valeurs initiales ; les étiquettes de {scenario.application} concernent le nouveau groupe DEV.</Notice>}
    <div className="tag-consequences">{effects.map(effect => <article key={effect.key} className={effect.correct ? 'tag-effect-correct' : 'tag-effect-missing'}><div><code>{effect.key}</code><strong>{effect.question}</strong></div><p>{effect.purpose}</p><dl><div><dt>Valeur {example ? 'de l’exemple' : 'actuelle'}</dt><dd>{effect.value || 'Non renseignée'}</dd></div><div><dt>{source.baseline ? 'Valeur initiale à conserver' : 'Demandé par le ticket'}</dt><dd>{effect.expected || 'Absente à l’origine'}</dd></div></dl><p className="tag-effect-output">{effect.effect}</p></article>)}</div>
    <Notice>Ces résultats illustrent les vues de notre équipe fictive. Une étiquette PRD ne déplace pas le groupe dans l’abonnement PRD et ne change pas les droits. Les futurs services n’héritent pas automatiquement des étiquettes du groupe ; il faudra aussi les configurer pour suivre leurs coûts. Le groupe de cette mission reste vide.</Notice>
    <a className="teacher-doc-link" href="https://learn.microsoft.com/fr-fr/azure/azure-resource-manager/management/tag-resources" target="_blank" rel="noreferrer">Comprendre les étiquettes · Microsoft Learn</a>
    <div className="modal-actions"><button className="button azure-button" onClick={() => { setModal(null); if (group) openPortal('detail', group.id); }}>Reprendre la mission<ArrowRight size={14} /></button><button className="text-button" onClick={() => setModal({ kind: 'recovery' })}>Corriger ou annuler une action</button></div>
  </TeachingView>;
}
