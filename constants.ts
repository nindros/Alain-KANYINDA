
import { Project, ProjectSector, ProjectStatus, UserRole, UserProfile, AuthorityType } from './types';

export const CONTRACTING_AUTHORITIES = [
  { name: "SNEL (Société Nationale d'Électricité)", sector: ProjectSector.ENERGY, ministry: "Ministère de l'Énergie" },
  { name: "ANSER (Agence de l'Électrification Rurale)", sector: ProjectSector.ENERGY, ministry: "Ministère de l'Énergie" },
  { name: "REGIDESO", sector: ProjectSector.INFRASTRUCTURE, ministry: "Ministère de l'Énergie" },
  { name: "OGEFREM (Office de Gestion du Fret Multimodal)", sector: ProjectSector.TRANSPORT, ministry: "Ministère des Transports" },
  { name: "DGCDI", sector: ProjectSector.INFRASTRUCTURE, ministry: "Ministère des ITPR" },
  { name: "AZES (Agence des Zones Économiques Spéciales)", sector: ProjectSector.INFRASTRUCTURE, ministry: "Ministère de l'Industrie" },
  { name: "UCM (Unité de Coordination des Projets)", sector: ProjectSector.ENERGY, ministry: "Ministère de l'Énergie" }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'UC-2024-001',
    title: 'Boucle Ferroviaire de Kinshasa (Urban Train)',
    description: 'Système de transport ferroviaire de masse pour désengorger la capitale.',
    sector: ProjectSector.TRANSPORT,
    location: 'Kinshasa (Boucle Intérieure)',
    status: ProjectStatus.P2_FEASIBILITY_PREP,
    authority: 'OGEFREM',
    parentMinistry: 'Ministère des Transports',
    authorityType: AuthorityType.ENTERPRISE,
    capex: 450000000,
    startDate: '2024-03-15',
    progress: 45,
    documents: [],
    approvalHistory: [
        { date: '2024-01-10', action: 'FAVORABLE', actor: 'Ministère des Transports', comment: 'Projet prioritaire pour la mobilité urbaine.' }
    ],
  },
  {
    id: 'UC-2024-005',
    title: 'Port en Eau Profonde de Banana',
    description: 'Construction et exploitation du terminal à conteneurs.',
    sector: ProjectSector.INFRASTRUCTURE,
    location: 'Muanda (Kongo Central)',
    status: ProjectStatus.P3_TENDERING,
    authority: 'DP World (AC Délégant: Min. Transports)',
    parentMinistry: 'Ministère des Transports',
    authorityType: AuthorityType.MINISTRY,
    capex: 1200000000,
    startDate: '2023-11-20',
    progress: 75,
    documents: [],
    approvalHistory: [
        { date: '2023-09-05', action: 'FAVORABLE', actor: 'Ministère des Transports', comment: 'Dossier stratégique national.' }
    ]
  },
  {
    id: 'UC-2024-009',
    title: 'Centrale Solaire de Kolwezi',
    description: 'Projet priorisé en attente de validation par le Ministère du Plan.',
    sector: ProjectSector.ENERGY,
    location: 'Lualaba',
    status: ProjectStatus.P1_UC_CONFORMITY,
    authority: 'ANSER',
    parentMinistry: "Ministère de l'Énergie",
    authorityType: AuthorityType.ESTABLISHMENT,
    capex: 85000000,
    startDate: '2024-06-01',
    progress: 25,
    documents: [],
    approvalHistory: [
        { date: '2024-05-15', action: 'RESERVE', actor: "Ministère de l'Énergie", comment: 'Favorable sous réserve de précision sur le tracé des lignes.' }
    ]
  },
  {
    id: 'UC-2024-008',
    title: 'Parc Agro-Industriel de Bukanga Lonzo',
    description: 'Partenariat pour la relance de la production céréalière nationale.',
    sector: ProjectSector.AGRICULTURE,
    location: 'Kwilu',
    status: ProjectStatus.P1_IDENTIFICATION,
    authority: 'Ministère de l\'Agriculture',
    parentMinistry: 'Ministère de l\'Agriculture',
    authorityType: AuthorityType.MINISTRY,
    capex: 120000000,
    startDate: '2024-05-10',
    progress: 10,
    documents: [],
    approvalHistory: []
  }
];

export const MOCK_USERS: UserProfile[] = [
  { id: 'u1', name: 'Coordination UC-PPP', role: UserRole.COORDINATOR, email: 'dir@ucppp.cd', status: 'Active' },
  { id: 'u2', name: 'Expert DGCMP', role: UserRole.ANALYST, email: 'control@dgcmp.cd', status: 'Active' },
  { id: 'u3', name: 'Ministère du Plan', role: UserRole.VALIDATOR, email: 'valid@plan.gouv.cd', status: 'Active' }
];

export const AVAILABLE_ROLES = Object.values(UserRole);
