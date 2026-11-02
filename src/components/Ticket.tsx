import { ArrowRight, Check, CheckCircle2, ClipboardCheck, Clock3, Inbox, Mail, Paperclip, Send, ShieldCheck } from 'lucide-react';
import { useWorkspace } from '../WorkspaceContext';
import { expectedTags, QUIZ, regionName, subscriptionName } from '../domain/scenario';
import { snapshot, targetGroup } from '../domain/engine';
import { Badge, Notice } from './Shared';

export function Ticket() {
  const { run, scenario, assessment, openPortal, dispatch, setModal } = useWorkspace();
  const tags = expectedTags(scenario);
  const attached = run.groups.find(g => g.id === run.attachedId);
  const report = attached ? snapshot(attached) : null;
  const status = assessment.complete ? 'Résolu' : run.reportSubmittedAt ? 'À corriger' : run.startedAt ? 'En cours' : 'À prendre en charge';
  const submit = () => {
    dispatch({ type: 'SUBMIT_REPORT', now: Date.now() });
    setModal({ kind: assessment.technicalReady && attached?.id === targetGroup(run)?.id ? 'quiz' : 'assessment' });
  };
  return <div className="tickets-app">
    <aside className="ticket-sidebar"><div className="ticket-app-name"><span><Mail size={20} /></span>Tickets</div><div className="ticket-nav-label">MON ESPACE</div><div className="ticket-folder"><Inbox size={17} />Mes missions<span>1</span></div>
      <article className="ticket-preview" aria-label={'Ticket sélectionné ' + scenario.ticket}><div><span className="unread-dot" /><small>{scenario.ticket}</small><time>09:12</time></div><strong>Préparer le groupe DEV</strong><p>{scenario.application}</p><Badge tone={assessment.complete ? 'green' : 'amber'}>{status}</Badge></article>
      <div className="ticket-sidebar-bottom"><ShieldCheck size={16} /><p>Équipe WebApps<span>Environnement de formation</span></p></div>
    </aside>
    <main className="ticket-detail">
      <div className="ticket-topline"><span><Inbox size={14} />Mes missions <span>/</span> {scenario.ticket}</span><Badge tone={assessment.complete ? 'green' : run.startedAt ? 'blue' : 'amber'}>{status}</Badge></div>
      <div className="ticket-hero"><div className="ticket-eyebrow">DEMANDES ÉQUIPE WEBAPPS</div><h2>Un espace pour la<br className="desktop-break" /> prochaine version.</h2><p>Prépare le groupe de ressources DEV de <strong>{scenario.application}</strong>.</p></div>
      <div className="ticket-sender"><span className="avatar-camille">CL</span><div><strong>Camille Laurent<span>Responsable applicative</span></strong><small>À Romain · Équipe WebApps</small></div><Badge>Priorité normale</Badge></div>
      <div className="ticket-message"><p>Bonjour Romain,</p><p>Nous préparons une nouvelle version de {scenario.application}. L’équipe de développement a besoin d’un groupe de ressources dédié pour accueillir les futurs services de l’application.</p><p>Crée ce groupe avec les paramètres ci-dessous, puis vérifie sa configuration avant de me répondre.</p></div>
      <div className="ticket-spec"><div className="ticket-spec-title"><ClipboardCheck size={17} /><strong>Ce qui est attendu</strong><Badge tone="green">DEV uniquement</Badge></div>
        <dl><div><dt>Abonnement</dt><dd>FORMATION-IT-DEV</dd></div><div><dt>Nom du groupe</dt><dd><code>{scenario.targetName}</code></dd></div><div><dt>Région</dt><dd>France Central</dd></div></dl>
        <div className="ticket-tag-list"><span>ÉTIQUETTES À AJOUTER</span>{Object.entries(tags).map(([key, value]) => <div key={key}><code>{key}</code><span>=</span><strong>{value}</strong></div>)}</div>
      </div>
      <Notice>Le groupe doit rester <strong>vide</strong>. Conserve les environnements et les groupes déjà présents. L’hébergement sera préparé dans la prochaine mission.</Notice>
      <details className="naming-note"><summary><Paperclip size={14} />Note jointe · Convention de nommage</summary><p><code>rg</code> = groupe de ressources · <code>{scenario.key}</code> = application · <code>dev</code> = environnement · <code>frc</code> = France Central · <code>01</code> = premier groupe. C’est la convention de cette équipe fictive.</p></details>
      <div className="ticket-actions">{!run.startedAt ? <button className="button button-dark" onClick={() => dispatch({ type: 'TAKE_TICKET', now: Date.now() })}><Check size={16} />Prendre en charge le ticket</button> : <span className="ticket-taken"><CheckCircle2 size={16} />Tu as pris en charge cette demande</span>}<button className="button button-outline" onClick={() => openPortal('home')}>Ouvrir le portail Azure<ArrowRight size={16} /></button></div>
      <div className="ticket-divider" />
      <section className="report-section" aria-labelledby="report-heading"><div className="section-line"><div><span className="overline">TA RÉPONSE</span><h3 id="report-heading">Vérifier et rendre compte</h3></div><span className="report-icon"><Send size={21} /></span></div><p>Joins le groupe que tu as préparé. Son relevé sera actualisé lors de la soumission.</p>
        <label className="form-field"><span>Groupe à joindre au ticket</span><select value={run.attachedId} onChange={e => dispatch({ type: 'ATTACH', groupId: e.target.value })}><option value="">Choisir un groupe de ressources</option>{run.groups.map(g => <option key={g.id} value={g.id}>{g.name} · {subscriptionName(g.subscriptionId)}</option>)}</select></label>
        {report && <div className="report-preview"><div><Paperclip size={15} /><strong>Relevé du groupe joint</strong><Badge tone="blue">État actuel</Badge></div><dl><div><dt>Groupe</dt><dd>{report.name}</dd></div><div><dt>Abonnement</dt><dd>{subscriptionName(report.subscriptionId)}</dd></div><div><dt>Région</dt><dd>{regionName(report.location)}</dd></div><div><dt>Ressources</dt><dd>{report.resourceCount}</dd></div></dl><div className="report-tags">{Object.entries(report.tags).map(([key, value]) => <span key={key}>{key} = {value}</span>)}</div></div>}
        <label className="form-field"><span>Ton compte rendu</span><textarea rows={3} placeholder="Qu’as-tu préparé et à quoi servira ce groupe ?" value={run.comment} onChange={e => dispatch({ type: 'COMMENT', text: e.target.value })} maxLength={4000} /><small>Explique avec tes mots. La formulation de ce commentaire n’est pas notée automatiquement.</small></label>
        <div className="report-actions"><button className="button button-dark" onClick={submit}><Send size={15} />{run.reportSubmittedAt ? 'Actualiser et soumettre à nouveau' : 'Soumettre pour vérification'}</button><button className="text-button" onClick={() => setModal({ kind: 'assessment' })}>Voir les critères<ArrowRight size={14} /></button></div>
        {run.reportSubmittedAt && <div className="submission-result" aria-live="polite"><div className="section-line"><h4>{assessment.technicalReady && assessment.checks[7].passed ? 'Configuration et compte rendu vérifiés' : 'Quelques points sont à corriger'}</h4><Badge tone={assessment.technicalReady ? 'green' : 'amber'}>{assessment.passed} / 9 critères</Badge></div>
          {(!assessment.technicalReady || !assessment.checks[7].passed) && <p className="muted small">Le compte rendu est enregistré. Consulte les points à corriger dans l’encadré de mission.</p>}
          {assessment.technicalReady && assessment.checks[7].passed && <p className="positive-text"><CheckCircle2 size={16} />Ton environnement correspond au ticket. Termine le bilan dans l’encadré de mission.</p>}
        </div>}
      </section>
      <div className="ticket-footer"><Clock3 size={13} />Une erreur corrigée fait partie de l’apprentissage.</div>
    </main>
  </div>;
}
export function Quiz() {
  const { run, dispatch, assessment } = useWorkspace();
  return <section className="quiz-section" aria-labelledby="quiz-heading"><span className="overline">LE GESTE ET LE SENS</span><h3 id="quiz-heading">Trois situations pour faire le point</h3><p>Prends un instant pour comprendre ce que tu viens de préparer.</p>
    {QUIZ.map((question, index) => <fieldset className="quiz-question" key={question.title}><legend><span>{String(index + 1).padStart(2, '0')}</span>{question.title}</legend><p>{question.question}</p><div className="quiz-options">{question.options.map((option, optionIndex) => <label key={optionIndex} className={run.quiz.answers[index] === optionIndex ? 'selected' : ''}><input type="radio" name={'question-' + index} checked={run.quiz.answers[index] === optionIndex} onChange={() => dispatch({ type: 'ANSWER', question: index, answer: optionIndex })} /><span>{option}</span></label>)}</div>
      {run.quiz.submitted && <div className={'quiz-feedback ' + (run.quiz.answers[index] === question.correct ? 'correct' : 'incorrect')}><strong>{run.quiz.answers[index] === question.correct ? 'Bien compris.' : 'À revoir.'}</strong> {question.explanation}</div>}
    </fieldset>)}
    <button className="button button-dark" disabled={run.quiz.answers.some(answer => answer < 0)} onClick={() => dispatch({ type: 'CHECK_QUIZ' })}><ClipboardCheck size={16} />Vérifier mes réponses</button>
    {run.quiz.submitted && !assessment.checks[8].passed && <p className="quiz-retry" role="status">Lis les explications, ajuste tes réponses et réessaie.</p>}
    {assessment.checks[8].passed && <p className="positive-text"><CheckCircle2 size={16} />Les trois situations sont comprises.</p>}
  </section>;
}
