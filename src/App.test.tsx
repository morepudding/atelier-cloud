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
const panel = () => screen.getByRole('complementary', { name: 'Accompagnement de la mission' });
async function openCreate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Voir le ticket' }));
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
async function attachGroup(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Voir le ticket' }));
  await user.selectOptions(screen.getByLabelText('Groupe à joindre au ticket'), screen.getByRole('option', { name: new RegExp(scenario.targetName) }));
}
async function usePanelMenu(user: ReturnType<typeof userEvent.setup>, action: string) {
  await user.click(screen.getByRole('button', { name: 'Options de la mission' }));
  await user.click(within(panel()).getByRole('button', { name: action }));
}
describe('Mission jouable dans un portail ou un moniteur immersif', () => {
  it('termine la mission avec un seul encadré, puis retrouve le résultat après rechargement', async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    expect(screen.getByRole('region', { name: 'Portail Azure' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Moniteur du poste de travail' })).toBeNull();
    expect(screen.getAllByRole('complementary', { name: 'Accompagnement de la mission' })).toHaveLength(1);
    await openCreate(user);
    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: 'Suivant : Étiquettes' }));
    await fillTags(user);
    await user.click(screen.getByRole('button', { name: 'Suivant : Vérifier + créer' }));
    expect(screen.getByText('Validation technique réussie')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Créer' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: scenario.targetName })).toBeTruthy(), { timeout: 3000 });
    await attachGroup(user);
    await user.click(screen.getByRole('button', { name: 'Soumettre pour vérification' }));
    expect(within(panel()).getByRole('region', { name: 'Bilan de compréhension' })).toBeTruthy();
    for (const question of QUIZ) await user.click(within(panel()).getByLabelText(question.options[question.correct]));
    await user.click(within(panel()).getByRole('button', { name: 'Vérifier mes réponses' }));
    await waitFor(() => expect(within(panel()).getByRole('region', { name: 'Mission accomplie' })).toBeTruthy());
    expect(within(panel()).getByText('Réussie en autonomie')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(within(panel()).getByRole('button', { name: 'Reprendre le portail' }));
    const saved = deserialize(localStorage.getItem(STORAGE_KEY)).state;
    expect(assess(saved.run).complete).toBe(true);
    expect(saved.run.report?.resourceCount).toBe(0);
    view.unmount();
    render(<App />);
    expect(screen.getByRole('heading', { name: scenario.targetName })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Voir le ticket' }));
    expect(screen.getByText('Résolu', { selector: '.ticket-topline .badge' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Moniteur du poste de travail' })).toBeTruthy();
  }, 20000);
  it('signale les étiquettes manquantes dans le même encadré et permet leur correction dans le portail', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openCreate(user);
    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: 'Vérifier + créer' }));
    await user.click(screen.getByRole('button', { name: 'Créer' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: scenario.targetName })).toBeTruthy(), { timeout: 3000 });
    await attachGroup(user);
    await user.click(screen.getByRole('button', { name: 'Soumettre pour vérification' }));
    expect(within(panel()).getByText(/À renseigner ou corriger : Application/)).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(within(panel()).getByRole('button', { name: 'Revenir à la mission' }));
    await user.click(screen.getByRole('button', { name: 'Ouvrir Microsoft Azure' }));
    await user.click(screen.getByRole('tab', { name: 'Étiquettes' }));
    await fillTags(user);
    await user.click(screen.getByRole('button', { name: 'Enregistrer les étiquettes' }));
    await user.click(screen.getByRole('button', { name: 'Voir le ticket' }));
    await user.click(screen.getByRole('button', { name: 'Actualiser et soumettre à nouveau' }));
    expect(screen.getByRole('heading', { name: 'Configuration et compte rendu vérifiés' })).toBeTruthy();
    expect(within(panel()).getByRole('region', { name: 'Bilan de compréhension' })).toBeTruthy();
    expect(screen.queryByText(/À renseigner ou corriger : Application/)).toBeNull();
  }, 20000);
  it('refuse l’écriture en PRD et conserve le brouillon en passant du portail au moniteur', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openCreate(user);
    await fillBasics(user, SUBSCRIPTIONS[2].id);
    await user.click(screen.getByRole('button', { name: 'Suivant : Étiquettes' }));
    expect(screen.getAllByRole('alert').some(alert => alert.textContent?.includes('Lecteur'))).toBe(true);
    expect(deserialize(localStorage.getItem(STORAGE_KEY)).state.run.groups).toHaveLength(3);
    await usePanelMenu(user, 'Ouvrir le carnet');
    await user.type(screen.getByLabelText('CE QUE JE VEUX RETENIR'), 'Le ticket limite mon intervention à DEV.');
    await user.click(screen.getByRole('button', { name: 'Ouvrir Microsoft Azure' }));
    expect((screen.getByLabelText(/^Groupe de ressources/) as HTMLInputElement).value).toBe(scenario.targetName);
    expect((screen.getByRole('combobox', { name: /^Abonnement/ }) as HTMLSelectElement).value).toBe(SUBSCRIPTIONS[2].id);
  }, 15000);
  it('garde les indices et les confirmations dans l’encadré, y compris sur le bureau vide', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Indice' }));
    expect(within(panel()).getByRole('region', { name: 'Un petit coup de main' })).toBeTruthy();
    await user.click(within(panel()).getByRole('button', { name: 'Afficher un indice' }));
    expect(within(panel()).getByText('Quel environnement est autorisé dans le ticket ?')).toBeTruthy();
    await user.click(within(panel()).getByRole('button', { name: 'Reprendre' }));
    await user.click(screen.getByRole('button', { name: 'Voir le ticket' }));
    await user.click(screen.getByRole('button', { name: 'Réduire la fenêtre' }));
    expect(screen.getByRole('region', { name: 'Moniteur du poste de travail' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /Un espace/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Voir le ticket' })).toBeTruthy();
    await usePanelMenu(user, 'Recommencer la mission');
    await user.click(within(panel()).getByRole('button', { name: 'Conserver ma progression' }));
    expect(deserialize(localStorage.getItem(STORAGE_KEY)).state.run.hints.subscription).toBe(1);
    await usePanelMenu(user, 'Recommencer la mission');
    await user.click(within(panel()).getByRole('button', { name: 'Recommencer cet essai' }));
    expect(deserialize(localStorage.getItem(STORAGE_KEY)).state.run.hints.subscription).toBe(0);
    expect(screen.getByRole('region', { name: 'Portail Azure' })).toBeTruthy();
  }, 15000);
  it('conserve la réduction de l’encadré entre outils et après rechargement', async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    await user.click(screen.getByRole('button', { name: 'Réduire l’encadré de mission' }));
    expect(within(panel()).queryByRole('button', { name: 'Voir le ticket' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Consulter les notions Azure' }));
    expect(screen.getByRole('region', { name: 'Moniteur du poste de travail' })).toBeTruthy();
    expect(within(panel()).getByRole('button', { name: 'Développer l’encadré de mission' })).toBeTruthy();
    view.unmount();
    render(<App />);
    expect(within(panel()).getByRole('button', { name: 'Développer l’encadré de mission' })).toBeTruthy();
    await user.click(within(panel()).getByRole('button', { name: 'Développer l’encadré de mission' }));
    await usePanelMenu(user, 'Ouvrir le portail Azure');
    expect(screen.getByRole('region', { name: 'Portail Azure' })).toBeTruthy();
    expect(screen.getAllByRole('complementary', { name: 'Accompagnement de la mission' })).toHaveLength(1);
  }, 15000);
});
