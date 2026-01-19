
export enum UserRole {
  ADMIN = 'Administrateur',
  COORDINATOR = 'Coordonnateur UC-PPP',
  VALIDATOR = 'Ministère du Plan',
  FINANCE = 'Ministère des Finances',
  BUDGET = 'Ministère du Budget',
  SPATIAL_PLANNING = 'Ministère de l’Aménagement du Territoire',
  REGULATOR = 'Régulateur Sectoriel',
  ANALYST = 'DGCMP',
  MINISTRY = 'Ministère Sectoriel / AC',
  PRIVATE = 'Partenaire Privé',
  PUBLIC = 'Public'
}

export enum ProjectStatus {
  // PHASE 1: IDENTIFICATION
  P1_IDENTIFICATION = 'P1: Identification AC',
  SUBMITTED = 'P1: Attente Validation Tutelle',
  P1_SECTORIAL_VALIDATION = 'P1: Attente Avis Conforme UC-PPP (60j)',
  P1_UC_AVIS_CONFORME = 'P1: Priorisation UC-PPP',
  P1_PLAN_VALIDATION = 'P1: Validation Min. Plan (Base de données PPP)',

  // PHASE 2: ETUDES
  P2_FEASIBILITY = 'P2: Étude de Faisabilité (AC)',
  P2_UC_AVIS_CONFORME = 'P2: Attente Avis UC (Consultation Multilatérale)',
  P2_BUDGET_PROGRAMMING = 'P2: Programmation Budgétaire',

  // PHASE 3: PASSATION
  P3_PREP_DAO = 'P3: Préparation Documents (DAO)',
  P3_DGCMP_ANO = 'P3: ANO DGCMP (DAO)',
  P3_TENDERING = 'P3: Procédure d\'Appel d\'Offres',
  P3_EVALUATION = 'P3: Évaluation des Offres',
  P3_NEGOTIATION = 'P3: Négociations Contractuelles',
  P3_VISA_UC_FINAL = 'P3: Visa Approbation UC-PPP (20j)',
  P3_APPROBATION = 'P3: Approbation Gouvernementale (20j)',
  P3_PUBLICATION = 'P3: Publication du Contrat (Journal Officiel)',

  ACTIVE = 'Phase 4: Exécution / Exploitation',
  REJECTED = 'Rejeté / Abandonné'
}

export enum AuthorityType {
  MINISTRY = 'Ministère',
  ENTERPRISE = 'Entreprise Publique',
  ESTABLISHMENT = 'Établissement Public',
  PROVINCE = 'Province / ETD'
}

export enum ProjectSector {
  ENERGY = 'Énergie',
  INFRASTRUCTURE = 'Infrastructures',
  TRANSPORT = 'Transport',
  HEALTH = 'Santé',
  AGRICULTURE = 'Agriculture',
  MINING = 'Mines'
}

export interface ApprovalLog {
  date: string;
  action: 'FAVORABLE' | 'RESERVE' | 'REJET' | 'SUBMIT';
  actor: string;
  comment: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'Fiche_Projet' | 'Etude_PreFais' | 'Etude_Fais' | 'DAO' | 'Contrat' | 'Avis_Technique' | 'ANO_DGCMP' | 'PV_Negociation';
  url: string; 
  dateUploaded: string;
  author: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  sector: ProjectSector;
  location: string;
  status: ProjectStatus;
  authority: string;
  parentMinistry: string;
  authorityType: AuthorityType;
  
  alignment?: string;
  priorityDegree?: string;
  purpose?: string;
  expectedResults?: string;
  activities?: string;
  contractualForm?: string;
  durationYears?: number;
  pppJustification?: string;
  gpsCoordinates?: string;
  impactZone?: string;
  totalCost?: number;
  capex: number;
  opex?: number;
  estimatedRevenue?: string;
  remunerationMode?: string;
  privatePartner?: string;

  // Additional fields for technical data and form compatibility
  legalFramework?: string;
  relatedProjects?: string;
  publicContributionCapex?: number;
  privateContributionCapex?: number;
  publicContributionOpex?: number;
  privateContributionOpex?: number;
  developmentStage?: string;
  nextStep?: string;
  contactPerson?: string;
  timeline?: {
    studies: string;
    procurement: string;
    construction: string;
    operation: string;
  };

  startDate: string;
  progress: number;
  documents: Document[];
  approvalHistory: ApprovalLog[];
  created_at?: string;
  updated_at?: string;
}

export interface User {
  name: string;
  role: UserRole;
}

export interface UserProfile extends User {
  id: string;
  email: string;
  department?: string;
  parentMinistry?: string;
  status: 'Active' | 'Inactive' | 'Rejected';
  lastLogin?: string;
  createdAt?: string;
}
