// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { assess, deserialize } from './domain/engine';
import { DEV_ID, expectedTags, QUIZ, SCENARIOS, STORAGE_KEY, SUBSCRIPTIONS } from './domain/scenario';

beforeEach(() => localStorage.clear());
afterEach(cleanup);
const scenario = SCENARIOS.demandesetude;
async function openCreate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Prendre en charge le ticket' }));
  await user.click(screen.getByRole('button', { name: 'Ouvrir le portail Azure' }));
  await user.click(screen.getByRole('button', { name: /Créer un groupe/ }));
}
async function fillBasics(user: ReturnType<typeof userEvent.setup>, subscription: string = DEV_ID) {
  await user.selectOptions(screen.getByRole('combobox', { name: /^Abonnement/ }), subscription);
  await user.type(screen.getByLabelText(/^Groupe de ressources/), scenario.targetName);
  await user.selectOptions(screen.getByLabelText(/^Région/), 'francecentral');
}
async function fillTags(user: ReturnType<typeof userEvent.setup>) {
  const rows = Object.entries(expectedTags(scenario));
  for (let index = 0; index < rows.length; index++) {
    if (index) await user.click(screen.getByRole('button', { name: '+ Ajouter une étiquette' }));
    await user.type(screen.getByLabelText('Nom de l’étiquette ' + (index + 1)), rows[index][0]);
    await user.type(screen.getByLabelText('Valeur de l’étiquette ' + (index + 1)), rows[index][1]);
  }
}
describe('Mission jouable depuis le poste de travail', () => {
  it('termine le ticket, la création, le compte rendu et le bilan, puis retrouve la réussite après rechargement', async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    expect(screen.getByRole('heading', { name: /Un espace pour la prochaine version/ })).toBeTruthy();
    await openCreate(user);
    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: 'Suivant : Étiquettes' }));
    await fillTags(user);
    await user.click(screen.getByRole('button', { name: 'Suivant : Vérifier + créer' }));
    expect(screen.getByText('Validation technique réussie')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Créer' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: scenario.targetName })).toBeTruthy(), { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: /Joindre ce groupe au ticket/ }));
    await user.click(screen.getByRole('button', { name: 'Soumettre pour vérification' }));
    expect(screen.getByRole('heading', { name: 'Trois situations pour faire le point' })).toBeTruthy();
    for (const question of QUIZ) await user.click(screen.getByLabelText(question.options[question.correct]));
    await user.click(screen.getByRole('button', { name: 'Vérifier mes réponses' }));
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Mission accomplie' })).toBeTruthy());
    expect(within(screen.getByRole('dialog')).getByText('Réussie en autonomie')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Retour à mon bureau/ }));
    const saved = deserialize(localStorage.getItem(STORAGE_KEY)).state;
    expect(assess(saved.run).complete).toBe(true);
    expect(saved.run.report?.resourceCount).toBe(0);
    view.unmount();
    render(<App />);
    expect(screen.getByText('Résolu', { selector: '.ticket-topline .badge' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Ouvrir Microsoft Azure' }));
    expect(screen.getByRole('heading', { name: scenario.targetName })).toBeTruthy();
  }, 20000);
  it('autorise un groupe sans étiquettes, signale l’écart au ticket puis permet de le corriger', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openCreate(user);
    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: 'Vérifier + créer' }));
    await user.click(screen.getByRole('button', { name: 'Créer' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: scenario.targetName })).toBeTruthy(), { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: /Joindre ce groupe au ticket/ }));
    await user.click(screen.getByRole('button', { name: 'Soumettre pour vérification' }));
    expect(screen.getByText(/À renseigner ou corriger : Application/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Ouvrir Microsoft Azure' }));
    await user.click(screen.getByRole('tab', { name: 'Étiquettes' }));
    await fillTags(user);
    await user.click(screen.getByRole('button', { name: 'Enregistrer les étiquettes' }));
    await user.click(screen.getByRole('button', { name: 'Ouvrir Tickets' }));
    await user.click(screen.getByRole('button', { name: 'Actualiser et soumettre à nouveau' }));
    expect(screen.getByRole('heading', { name: 'Configuration et compte rendu vérifiés' })).toBeTruthy();
    expect(screen.queryByText(/À renseigner ou corriger : Application/)).toBeNull();
  }, 20000);
  it('refuse l’écriture en PRD et conserve le brouillon en changeant d’application', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openCreate(user);
    await fillBasics(user, SUBSCRIPTIONS[2].id);
    await user.click(screen.getByRole('button', { name: 'Suivant : Étiquettes' }));
    expect(screen.getAllByRole('alert').some(alert => alert.textContent?.includes('Lecteur'))).toBe(true);
    expect(deserialize(localStorage.getItem(STORAGE_KEY)).state.run.groups).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Ouvrir Carnet' }));
    await user.type(screen.getByLabelText('CE QUE JE VEUX RETENIR'), 'Le ticket limite mon intervention à DEV.');
    await user.click(screen.getByRole('button', { name: 'Ouvrir Microsoft Azure' }));
    expect((screen.getByLabelText(/^Groupe de ressources/) as HTMLInputElement).value).toBe(scenario.targetName);
    expect((screen.getByRole('combobox', { name: /^Abonnement/ }) as HTMLSelectElement).value).toBe(SUBSCRIPTIONS[2].id);
  }, 15000);
  it('fait fonctionner les indices, la réduction de fenêtre et la réinitialisation confirmée', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Un indice' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Afficher un indice' }));
    expect(within(dialog).getByText('Quel environnement est autorisé dans le ticket ?')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Reprendre' }));
    await user.click(screen.getByRole('button', { name: 'Réduire la fenêtre' }));
    expect(screen.getByRole('heading', { name: 'À toi de jouer.' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Ouvrir Tickets' }));
    await user.click(screen.getByRole('button', { name: 'Recommencer la mission' }));
    await user.click(screen.getByRole('button', { name: 'Conserver ma progression' }));
    expect(deserialize(localStorage.getItem(STORAGE_KEY)).state.run.hints.subscription).toBe(1);
    await user.click(screen.getByRole('button', { name: 'Recommencer la mission' }));
    await user.click(screen.getByRole('button', { name: 'Recommencer cet essai' }));
    expect(deserialize(localStorage.getItem(STORAGE_KEY)).state.run.hints.subscription).toBe(0);
  }, 15000);
});
