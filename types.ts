
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
  P1_IDENTIFICATION = 'P1: Identification & Fiche Projet',
  P1_SECTORIAL_VALIDATION = 'P1: Validation Ministère Sectoriel',
  P1_UC_CONFORMITY = 'P1: Avis Conforme UC-PPP (Initial)',
  P1_PIP_INSCRIPTION = 'P1: Inscription PIP / Plan',
  P2_FEASIBILITY_PREP = 'P2: Préparation Étude de Faisabilité',
  P2_MULTILATERAL_AVIS = 'P2: Avis Conforme 4 Organes (20j)',
  P2_BUDGET_PROGRAMMING = 'P2: Programmation Budgétaire (60j)',
  P3_DAO_PREP = 'P3: Préparation Documents Passation (15j)',
  P3_UC_SIMPLE_AVIS = 'P3: Avis Simple UC-PPP (15j)',
  P3_DGCMP_ANO_DAO = 'P3: ANO DGCMP (Passation)',
  P3_PREQUALIFICATION = 'P3: Procédure Préqualification',
  P3_TENDERING = 'P3: Appel d\'Offres (45j)',
  P3_EVALUATION = 'P3: Évaluation & Avis UC (15j)',
  P3_NEGOTIATION = 'P3: Négociations (45j)',
  P3_VISA_UC_FINAL = 'P3: Visa Approbation UC (20j)',
  P3_APPROBATION = 'P3: Approbation Finale (20j)',
  P3_PUBLICATION = 'P3: Publication du Contrat',
  ACTIVE = 'Phase 4: Exécution / Exploitation',
  REJECTED = 'Rejeté / Abandonné',
  SUBMITTED = 'Dossier Soumis'
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

export interface ProjectTimeline {
  studies?: string;
  procurement?: string;
  construction?: string;
  operation?: string;
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
  
  // DESCRIPTION DU PROJET (Page 1)
  alignment?: string;
  priorityDegree?: string;
  purpose?: string;
  expectedResults?: string;
  activities?: string;
  contractualForm?: string;
  durationYears?: number;
  pppJustification?: string;

  // CONTEXTE DU PROJET (Page 1)
  gpsCoordinates?: string;
  impactZone?: string;
  legalFramework?: string;
  relatedProjects?: string;

  // INFORMATION FINANCIERE (Page 1 & 2)
  totalCost?: number; // (1)+(2)
  capex: number; // Coûts d’investissements estimés (1)
  publicContributionCapex?: number; // Contribution financière publique (1)
  privateContributionCapex?: number; // Contribution financière privée (1)
  
  opex?: number; // Coûts d’exploitation, d’entretien et de maintenance estimés (2)
  publicContributionOpex?: number; // Contribution financière publique (2)
  privateContributionOpex?: number; // Contribution financière privée (2)
  
  estimatedRevenue?: string; // Revenus estimés du projet
  remunerationMode?: string; // Mode de rémunération du partenaire privé

  // MISE EN ŒUVRE DU PROJET (Page 2)
  timeline?: ProjectTimeline;
  developmentStage?: string; // Etape de développement du projet
  nextStep?: string; // Prochaine étape envisagée

  // CONTACT (Page 2)
  contactPerson?: string; // Contact au sein de l'autorité contractante

  // System Fields
  startDate: string;
  progress: number;
  documents: Document[];
  approvalHistory: ApprovalLog[];
  avisFinances?: boolean;
  avisBudget?: boolean;
  avisAmenagement?: boolean;
  avisRegulateur?: boolean;
  privatePartner?: string;
}

export interface User {
  name: string;
  role: UserRole;
}

export interface UserProfile extends User {
  id: string;
  email: string;
  department?: string;
  status: 'Active' | 'Inactive';
  lastLogin?: string;
}
