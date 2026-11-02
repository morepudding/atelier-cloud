import type { HintTopic, ResourceGroup, ScenarioKey, Tags } from './types';

export const STORAGE_KEY = 'atelier-cloud.workspace.v1';
export const SUBSCRIPTIONS = [
  { id: 'formation-sub-dev', name: 'FORMATION-IT-DEV', environment: 'DEV', role: 'Contributeur', writable: true },
  { id: 'formation-sub-int', name: 'FORMATION-IT-INT', environment: 'INT', role: 'Lecteur', writable: false },
  { id: 'formation-sub-prd', name: 'FORMATION-IT-PRD', environment: 'PRD', role: 'Lecteur', writable: false },
] as const;
export const DEV_ID = SUBSCRIPTIONS[0].id;
export const REGIONS = [
  { id: 'francecentral', name: 'France Central' },
  { id: 'westeurope', name: 'West Europe' },
  { id: 'northeurope', name: 'North Europe' },
];
export const regionName = (id: string) => REGIONS.find(r => r.id === id)?.name ?? id;
export const subscriptionName = (id: string) => SUBSCRIPTIONS.find(s => s.id === id)?.name ?? id;
export interface Scenario {
  key: ScenarioKey;
  application: string;
  ticket: string;
  targetName: string;
  title: string;
}
export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  demandesetude: {
    key: 'demandesetude', application: 'DemandesEtude', ticket: 'DEM-001',
    targetName: 'rg-demandesetude-dev-frc-01', title: 'Préparer l’environnement DEV',
  },
  suiviinterventions: {
    key: 'suiviinterventions', application: 'SuiviInterventions', ticket: 'VAR-001',
    targetName: 'rg-suiviinterventions-dev-frc-01', title: 'Le défi en autonomie',
  },
};
export const expectedTags = (scenario: Scenario): Tags => ({
  Application: scenario.application, Environment: 'DEV', Owner: 'equipe-webapps', CostCenter: 'IT-FORMATION',
});
export function baselineGroups(): ResourceGroup[] {
  return [
    { id: 'seed-catalogue', name: 'rg-catalogue-dev-frc-01', subscriptionId: DEV_ID, location: 'francecentral',
      tags: { Application: 'Catalogue', Environment: 'DEV' },
      resources: [{ name: 'app-catalogue-dev', type: 'App Service', location: 'francecentral' }],
      origin: 'baseline', createdAt: 0 },
    { id: 'seed-demandes-int', name: 'rg-demandesetude-int-frc-01', subscriptionId: SUBSCRIPTIONS[1].id,
      location: 'francecentral', tags: { Application: 'DemandesEtude', Environment: 'INT' },
      resources: [{ name: 'app-demandesetude-int', type: 'App Service', location: 'francecentral' }],
      origin: 'baseline', createdAt: 0 },
    { id: 'seed-demandes-prd', name: 'rg-demandesetude-prd-frc-01', subscriptionId: SUBSCRIPTIONS[2].id,
      location: 'francecentral', tags: { Application: 'DemandesEtude', Environment: 'PRD' },
      resources: [
        { name: 'app-demandesetude-prd', type: 'App Service', location: 'francecentral' },
        { name: 'st-demandesetude-prd', type: 'Compte de stockage', location: 'francecentral' },
      ], origin: 'baseline', createdAt: 0 },
  ];
}
export const QUIZ = [
  { title: 'Un groupe vide, ça veut dire quoi ?', question: 'Ton groupe est créé et contient 0 ressource. Où en est l’application ?',
    options: ['Elle est déjà hébergée dans Azure.', 'Son organisation est préparée ; son hébergement reste à configurer.', 'La création a échoué, car le groupe est vide.'],
    correct: 1, explanation: 'Le groupe sert à organiser et gérer des ressources. L’application sera hébergée par un service ajouté lors d’une prochaine mission.' },
  { title: 'La région du prochain service', question: 'Le groupe est dans France Central. Une future application web sera-t-elle forcément hébergée dans cette région ?',
    options: ['Oui, toutes les ressources reprennent la région du groupe.', 'Seulement si le groupe porte une étiquette Region.', 'Il faut choisir et vérifier la région du service lui-même.'],
    correct: 2, explanation: 'La région du groupe concerne notamment ses métadonnées. Une ressource à l’intérieur du groupe peut avoir une autre région.' },
  { title: 'Les étiquettes des futures ressources', question: 'Environment = DEV est présent sur le groupe. Les futures ressources recevront-elles automatiquement cette étiquette ?',
    options: ['Il faudra la renseigner ou prévoir un mécanisme pour l’appliquer.', 'Oui, les étiquettes sont toujours héritées.', 'Oui, si la ressource est dans la même région.'],
    correct: 0, explanation: 'Les étiquettes du groupe ne sont pas automatiquement transmises aux ressources. Une stratégie peut aider à les appliquer.' },
];
export const HINTS: Record<HintTopic, { title: string; hints: string[] }> = {
  subscription: { title: 'Choisir l’abonnement', hints: ['Quel environnement est autorisé dans le ticket ?', 'Compare les abonnements et leurs rôles dans le portail.', 'Dans le formulaire de création, sélectionne FORMATION-IT-DEV.'] },
  find: { title: 'Retrouver mon groupe', hints: ['Que limite la liste affichée ?', 'Regarde le filtre Abonnements et le champ de recherche.', 'Affiche DEV, efface la recherche et actualise. Tu peux aussi ouvrir la notification de création.'] },
  tags: { title: 'Renseigner les étiquettes', hints: ['Compare le groupe aux quatre paires du ticket.', 'Les étiquettes sont modifiables depuis la fiche du groupe.', 'Ouvre Étiquettes, ajoute ou corrige Application, Environment, Owner et CostCenter, puis enregistre.'] },
  region: { title: 'Comprendre la région', hints: ['Quel objet es-tu en train de configurer ?', 'Un groupe et les ressources qu’il contient ont des propriétés distinctes.', 'France Central est demandé pour ce groupe. Les futurs services auront leur propre configuration de région.'] },
};
