
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, UserRole, ApprovalLog } from '../types';
import { 
  ArrowLeft, ArrowRight, ShieldCheck, Clock, CheckCircle2, 
  Building2, MessageSquare, Calendar, FolderOpen,
  XCircle, BadgeCheck, ShieldAlert, RotateCcw, FileCheck, Sparkles, Loader2,
  ChevronRight, ChevronLeft, Landmark, Gavel, Target, Coins, Receipt, AlertTriangle, MapPin,
  Edit3, Layout, Send, FileText, Printer, Activity, Info, Globe, Map, DollarSign, Rocket
} from 'lucide-react';
import { generateProjectRiskAnalysis } from '../services/geminiService';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  isAdmin: boolean;
  userRole: UserRole;
  userName?: string; 
  onUpdateProject?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, userRole, userName, onUpdateProject, onEditProject }) => {
  const [activeTab, setActiveTab] = useState<'fiche' | 'flow' | 'docs' | 'avis' | 'ai'>('fiche');
  const [comment, setComment] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ÉTAPES LÉGALES
  const institutionalSteps = [
    // Phase 1
    { id: ProjectStatus.SUBMITTED, label: 'Validation Tutelle', role: UserRole.MINISTRY, icon: Landmark, desc: 'Accord du Ministre sectoriel' },
    { id: ProjectStatus.P1_SECTORIAL_VALIDATION, label: 'Avis Conforme UC-PPP', role: UserRole.COORDINATOR, icon: ShieldCheck, desc: 'Examen technique (Délai: 60j)', color: 'border-purple-500' },
    { id: ProjectStatus.P1_UC_AVIS_CONFORME, label: 'Priorisation UC-PPP', role: UserRole.COORDINATOR, icon: Activity, desc: 'Inscription base projets identifiés' },
    { id: ProjectStatus.P1_PLAN_VALIDATION, label: 'Validation Min. Plan', role: UserRole.VALIDATOR, icon: Target, desc: 'Validation stratégique nationale' },
    
    // Phase 2
    { id: ProjectStatus.P2_FEASIBILITY, label: 'Études de Faisabilité', role: UserRole.MINISTRY, icon: FileText, desc: 'Réalisation par l\'AC' },
    { id: ProjectStatus.P2_UC_AVIS_CONFORME, label: 'Avis Conforme UC (Phase 2)', role: UserRole.COORDINATOR, icon: ShieldCheck, desc: 'Consultation Finances/Budget/AT (20j)', color: 'border-purple-500' },
    
    // Phase 3
    { id: ProjectStatus.P3_PREP_DAO, label: 'DAO & Passation', role: UserRole.ANALYST, icon: Gavel, desc: 'ANO DGCMP et mise en concurrence' },
    { id: ProjectStatus.P3_NEGOTIATION, label: 'Négociation & Visa Final', role: UserRole.COORDINATOR, icon: ShieldCheck, desc: 'Visa approbation UC (20j)' },
    { id: ProjectStatus.P3_VISA_UC_FINAL, label: 'Approbation Finale', role: UserRole.ADMIN, icon: BadgeCheck, desc: 'Dossier d\'approbation (20j)' }
  ];

  const currentStepIndex = institutionalSteps.findIndex(s => s.id === project.status);
  const isReserved = project.approvalHistory.length > 0 && project.approvalHistory[project.approvalHistory.length - 1].action === 'RESERVE';

  const isOwner = project.authority === userName || (userRole === UserRole.COORDINATOR && project.authority === 'UC-PPP');
  
  // --- LOGIQUE DE PERMISSION (CORRIGÉE & ASSOUPLIE) ---
  const isMyTurn = React.useMemo(() => {
      // 1. Administrateur a toujours la main
      if (userRole === UserRole.ADMIN) return true;

      // 2. Ministère du Plan : Débloqué pour toute la Phase 1 (pour ne pas bloquer la démo)
      if (userRole === UserRole.VALIDATOR && project.status.startsWith('P1')) return true;

      // 3. Autorité Contractante (ex: SNEL) : Peut valider l'étape "Tutelle" (SUBMITTED) pour simuler l'accord sectoriel
      if (userRole === UserRole.MINISTRY && project.status === ProjectStatus.SUBMITTED && project.authority === userName) return true;

      // 4. Ministère des Finances & Budget : Débloqué pour TOUTE la Phase 2 (P2)
      // Permet à Finances ET Budget de donner leur avis technique dès que le projet entre en phase de structuration/faisabilité
      if ((userRole === UserRole.FINANCE || userRole === UserRole.BUDGET) && project.status.startsWith('P2')) return true;

      // 5. Logique Standard Séquentielle
      if (currentStepIndex !== -1) {
          const stepRole = institutionalSteps[currentStepIndex].role;
          
          // Si mon rôle correspond au rôle attendu par l'étape
          if (stepRole === userRole) {
             // Cas spécifique Ministère : Vérifier Tutelle OU Autorité (pour débloquer SNEL et son Ministère)
             if (stepRole === UserRole.MINISTRY) {
                 return project.parentMinistry === userName || project.authority === userName;
             }
             return true;
          }
      }

      // 6. Correction suite à réserve (si propriétaire)
      if (isReserved && isOwner) return true;

      return false;
  }, [currentStepIndex, userRole, project.status, project.parentMinistry, project.authority, userName, isReserved, isOwner]);

  const canManageSteps = userRole === UserRole.ADMIN || userRole === UserRole.COORDINATOR;

  useEffect(() => {
    if (activeTab === 'ai' && !aiAnalysis) {
      setIsAnalyzing(true);
      generateProjectRiskAnalysis(project).then(res => {
        setAiAnalysis(res);
        setIsAnalyzing(false);
      });
    }
  }, [activeTab]);

  const triggerConfirmation = () => {
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const handleManualStepChange = (direction: 'next' | 'prev') => {
    if (!onUpdateProject) return;

    const newIndex = direction === 'next' ? currentStepIndex + 1 : currentStepIndex - 1;
    if (newIndex < 0 || newIndex >= institutionalSteps.length) return;

    const nextStep = institutionalSteps[newIndex];
    const newLog: ApprovalLog = { 
      date: new Date().toLocaleDateString('fr-FR'), 
      action: direction === 'next' ? 'FAVORABLE' : 'REJET', 
      actor: `Admin Système (${userName})`, 
      comment: `Forçage manuel : Vers ${nextStep.label}` 
    };

    onUpdateProject({ 
      ...project, 
      status: nextStep.id, 
      approvalHistory: [...(project.approvalHistory || []), newLog] 
    });
    triggerConfirmation();
  };

  const handleValidation = (decision: 'FAVORABLE' | 'RESERVE' | 'REJET') => {
    if (!onUpdateProject || !comment.trim()) {
      alert("Un commentaire est requis pour valider cette étape.");
      return;
    }

    let nextStatus = project.status;
    if (decision === 'FAVORABLE') {
      const next = institutionalSteps[currentStepIndex + 1];
      nextStatus = next ? next.id : ProjectStatus.ACTIVE;
    } else if (decision === 'REJET') {
      nextStatus = ProjectStatus.REJECTED;
    }

    const newLog: ApprovalLog = { 
      date: new Date().toLocaleDateString('fr-FR'), 
      action: decision, 
      actor: `${userRole} (${userName})`, 
      comment: comment 
    };

    onUpdateProject({ ...project, status: nextStatus, approvalHistory: [...(project.approvalHistory || []), newLog] });
    setComment('');
    triggerConfirmation();
  };

  const handlePrint = () => {
    window.print();
  };

  const InfoRow = ({ label, value, large = false }: { label: string, value?: string | number, large?: boolean }) => (
    <div className={`py-3 border-b border-gray-100 flex flex-col gap-1 text-left ${large ? 'col-span-2' : ''}`}>
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <p className="text-[10px] font-bold text-gray-800 leading-relaxed uppercase">{value || "Non renseigné"}</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 animate-fade-in max-w-7xl mx-auto space-y-6 text-left relative">
      
      {showConfirmation && (
        <div className="no-print fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
           <div className="bg-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border-4 border-emerald-500/30 backdrop-blur-sm">
              <CheckCircle2 size={24} className="animate-pulse" />
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest">Mise à jour effectuée</p>
                 <p className="text-xs font-bold opacity-90">L'avancement du projet a été enregistré.</p>
              </div>
           </div>
        </div>
      )}

      {/* --- SECTION D'IMPRESSION (Invisible à l'écran) --- */}
      <div id="print-area" className="print-only bg-white text-black p-8 hidden">
         <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
            <div className="flex items-center gap-4">
               <div className="text-4xl font-black">UC-PPP</div>
               <div className="h-10 w-px bg-gray-400"></div>
               <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest">République Démocratique du Congo</p>
                  <p className="text-[10px] uppercase font-bold text-gray-600">Fiche de Projet Officielle</p>
               </div>
            </div>
            <div className="text-right">
               <div className="border border-black px-4 py-2">
                 <p className="text-[10px] font-black uppercase">Ref. Projet</p>
                 <p className="text-xl font-black">{project.id}</p>
               </div>
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-gray-100 p-6 border-l-4 border-black">
               <h1 className="text-2xl font-black uppercase mb-2">{project.title}</h1>
               <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                  <p><span className="font-bold uppercase">Secteur:</span> {project.sector}</p>
                  <p><span className="font-bold uppercase">Localisation:</span> {project.location}</p>
                  <p><span className="font-bold uppercase">Autorité:</span> {project.authority}</p>
                  <p><span className="font-bold uppercase">Tutelle:</span> {project.parentMinistry}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-10">
               <section>
                  <h3 className="text-sm font-black uppercase border-b border-black pb-2 mb-4">I. Description Technique</h3>
                  <div className="space-y-4 text-xs text-justify leading-relaxed">
                     <div><p className="font-bold uppercase mb-1">Résumé</p><p>{project.description}</p></div>
                     <div><p className="font-bold uppercase mb-1">Objectifs</p><p>{project.purpose}</p></div>
                     <div><p className="font-bold uppercase mb-1">Résultats</p><p>{project.expectedResults}</p></div>
                  </div>
               </section>

               <section>
                  <h3 className="text-sm font-black uppercase border-b border-black pb-2 mb-4">II. Données Financières</h3>
                  <div className="space-y-3 text-xs">
                     <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-bold">Coût Total</span>
                        <span className="font-black text-lg">{(project.totalCost || 0).toLocaleString()} USD</span>
                     </div>
                     <div className="flex justify-between">
                        <span>CAPEX</span>
                        <span className="font-bold">{(project.capex || 0).toLocaleString()} USD</span>
                     </div>
                     <div className="flex justify-between">
                        <span>OPEX (Annuel)</span>
                        <span className="font-bold">{(project.opex || 0).toLocaleString()} USD</span>
                     </div>
                     <div className="pt-4 mt-4 border-t border-black">
                        <p className="font-bold uppercase mb-1">Mode de Rémunération</p>
                        <p>{project.remunerationMode || "Non défini"}</p>
                     </div>
                  </div>
               </section>
            </div>

            <div className="mt-12 pt-8 border-t-2 border-black flex justify-between items-end">
               <div className="text-[10px] uppercase font-bold">
                  Date d'impression: {new Date().toLocaleDateString('fr-FR')}<br/>
                  Statut Actuel: {project.status}
               </div>
               <div className="text-center">
                  <div className="h-20 w-40 border border-black mb-1"></div>
                  <p className="text-[10px] uppercase font-black">Visa de Validation</p>
               </div>
            </div>
         </div>
      </div>

      {/* Header Actions */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button onClick={onBack} className="flex items-center text-gray-400 hover:text-primary-900 font-black text-[9px] uppercase tracking-widest transition-all">
          <ArrowLeft size={14} className="mr-2" /> Retour au portefeuille
        </button>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-200 transition-all border border-gray-200 shadow-sm"
          >
            <Printer size={14} /> Imprimer / PDF
          </button>
          {onEditProject && (
            <button onClick={() => onEditProject(project)} className="flex items-center gap-2 px-6 py-2.5 bg-primary-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">
              <Edit3 size={16} /> Éditer Technique
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Card (Écran) */}
      <div className="no-print bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
           <Landmark size={120} />
        </div>
        <div className="flex-1 space-y-2 relative z-10">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-primary-900 text-accent-400 text-[9px] font-black uppercase rounded-lg shadow-sm">ID: {project.id}</span>
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{project.sector}</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight">{project.title}</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
            <Building2 size={12} className="text-gray-300"/> {project.authority} 
            <span className="text-gray-200">|</span> 
            <span className="text-accent-600">Tutelle: {project.parentMinistry}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
            <div className="bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100 text-center shadow-inner">
              <span className="text-[8px] font-black text-gray-400 uppercase block tracking-widest mb-1">Budget CAPEX</span>
              <span className="text-2xl font-black text-primary-900">{(project.capex/1000000).toLocaleString()} M <small className="text-[10px]">USD</small></span>
            </div>
            <div className="bg-blue-50 px-6 py-4 rounded-3xl border border-blue-100 flex flex-col items-center justify-center min-w-[160px] shadow-sm">
                <span className="text-[8px] font-black text-blue-900/40 uppercase block tracking-widest mb-1 italic">Phase en cours</span>
                <span className="text-[10px] font-black text-blue-900 uppercase text-center leading-tight">
                    {institutionalSteps[currentStepIndex]?.label || "Identification"}
                </span>
            </div>
        </div>
      </div>

      {/* Tabs & Content (Écran) */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-3 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-1 tabs-navigation">
             {[
               {id: 'fiche', label: 'Fiche Technique', icon: Layout},
               {id: 'flow', label: 'Circuit Légal', icon: RotateCcw},
               {id: 'docs', label: 'Documents', icon: FolderOpen},
               {id: 'ai', label: 'Analyse Expert (IA)', icon: Sparkles},
               {id: 'avis', label: 'Historique Visas', icon: MessageSquare},
             ].map(t => (
               <button 
                 key={t.id} 
                 onClick={() => setActiveTab(t.id as any)} 
                 className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-primary-900 text-white shadow-lg translate-x-1' : 'text-gray-400 hover:bg-gray-50'}`}
               >
                 <t.icon size={16} className={activeTab === t.id ? 'text-accent-400' : 'text-gray-300'} /> {t.label}
               </button>
             ))}
          </div>

          {/* Validation Panel */}
          <div className={`validation-panel bg-white p-6 rounded-[32px] shadow-xl border-2 transition-all ${isMyTurn ? 'border-accent-400 bg-accent-50/10' : 'border-gray-50'}`}>
             <h4 className="text-[10px] font-black uppercase text-primary-900 mb-4 flex items-center gap-2">
               <ShieldCheck size={18} className={isMyTurn ? 'text-accent-500' : 'text-gray-300'} />
               {isMyTurn ? 'Instruction du Dossier' : 'Dossier en Consultation'}
             </h4>
             <textarea 
               disabled={!isMyTurn} 
               value={comment} 
               onChange={(e) => setComment(e.target.value)} 
               className={`w-full bg-white border border-gray-200 rounded-2xl p-4 text-[11px] font-medium outline-none h-32 focus:border-primary-500 transition-all mb-4 ${!isMyTurn ? 'bg-gray-50 text-gray-400' : ''}`} 
               placeholder={isMyTurn ? "Inscrire ici votre avis technique motivé..." : "Lecture seule pendant l'instruction"} 
             />
             
             <div className="space-y-2">
                <button 
                  disabled={!isMyTurn} 
                  onClick={() => handleValidation('FAVORABLE')} 
                  className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${isMyTurn ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                >
                  <CheckCircle2 size={16} /> Avis Favorable
                </button>
                <button 
                  disabled={!isMyTurn} 
                  onClick={() => handleValidation('RESERVE')} 
                  className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${isMyTurn ? 'bg-amber-500 text-primary-900 hover:bg-amber-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                >
                  <AlertTriangle size={16} /> Avis Favorable Sous Réserve
                </button>
                <button 
                  disabled={!isMyTurn} 
                  onClick={() => handleValidation('REJET')} 
                  className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isMyTurn ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  <XCircle size={16} /> Refus / Rejet
                </button>
             </div>

             {/* Contrôles de Navigation Admin */}
             {canManageSteps && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                   <button 
                      onClick={() => handleManualStepChange('prev')}
                      disabled={currentStepIndex <= 0}
                      className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                   >
                     <ChevronLeft size={12} /> Étape Préc.
                   </button>
                   <button 
                      onClick={() => handleManualStepChange('next')}
                      disabled={currentStepIndex >= institutionalSteps.length - 1}
                      className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                   >
                     Étape Suiv. <ChevronRight size={12} />
                   </button>
                </div>
             )}
          </div>
        </div>

        <div className="lg:col-span-9">
           <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 h-full min-h-[600px] overflow-hidden">
              {activeTab === 'fiche' && (
                <div className="animate-fade-in space-y-10 h-full overflow-y-auto pr-4 no-scrollbar">
                   <div className="flex items-center gap-6 pb-8 border-b border-gray-100">
                      <div className="p-4 bg-primary-900 text-white rounded-3xl"><FileText size={32} /></div>
                      <div>
                        <h3 className="text-xl font-black text-primary-900 uppercase tracking-tighter">Fiche Technique Complète</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Données officielles du projet</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-12">
                      <section className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                         <h4 className="bg-gray-50 px-6 py-4 text-[10px] font-black text-primary-900 uppercase tracking-widest border-b border-gray-100 flex items-center gap-2">
                            <Target size={14} className="text-accent-500" /> I. Identification & Description
                         </h4>
                         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <InfoRow label="Description Succincte" value={project.description} large />
                            <InfoRow label="Alignement Politique" value={project.alignment} />
                            <InfoRow label="Priorité" value={project.priorityDegree} />
                            <InfoRow label="Finalité / Objectifs" value={project.purpose} large />
                            <InfoRow label="Résultats Attendus" value={project.expectedResults} large />
                            <InfoRow label="Forme Contractuelle" value={project.contractualForm} />
                            <InfoRow label="Durée Estimée" value={project.durationYears ? `${project.durationYears} ans` : undefined} />
                         </div>
                      </section>

                      <section className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                         <h4 className="bg-gray-50 px-6 py-4 text-[10px] font-black text-primary-900 uppercase tracking-widest border-b border-gray-100 flex items-center gap-2">
                            <Map size={14} className="text-blue-500" /> II. Contexte & Localisation
                         </h4>
                         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <InfoRow label="Localisation" value={project.location} />
                            <InfoRow label="Coordonnées GPS" value={project.gpsCoordinates} />
                            <InfoRow label="Zone d'Impact" value={project.impactZone} />
                            <InfoRow label="Cadre Juridique" value={project.legalFramework} large />
                         </div>
                      </section>

                      <section className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                         <h4 className="bg-gray-50 px-6 py-4 text-[10px] font-black text-primary-900 uppercase tracking-widest border-b border-gray-100 flex items-center gap-2">
                            <DollarSign size={14} className="text-emerald-500" /> III. Aspects Financiers
                         </h4>
                         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="col-span-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                               <span className="text-[10px] font-black text-emerald-900 uppercase">Coût Total Estimé</span>
                               <span className="text-xl font-black text-emerald-700">{(project.totalCost || 0).toLocaleString()} USD</span>
                            </div>
                            <InfoRow label="Investissement (CAPEX)" value={(project.capex || 0).toLocaleString() + ' USD'} />
                            <InfoRow label="Maintenance (OPEX/an)" value={(project.opex || 0).toLocaleString() + ' USD'} />
                            <InfoRow label="Mode de Rémunération" value={project.remunerationMode} large />
                         </div>
                      </section>

                      <section className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                         <h4 className="bg-gray-50 px-6 py-4 text-[10px] font-black text-primary-900 uppercase tracking-widest border-b border-gray-100 flex items-center gap-2">
                            <Rocket size={14} className="text-amber-500" /> IV. Mise en Œuvre
                         </h4>
                         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <InfoRow label="Stade de Développement" value={project.developmentStage} />
                            <InfoRow label="Partenaire Privé" value={project.privatePartner} />
                            <InfoRow label="Contact Responsable" value={project.contactPerson} large />
                         </div>
                      </section>
                   </div>
                </div>
              )}

              {activeTab === 'flow' && (
                <div className="animate-fade-in h-full flex flex-col">
                   <h3 className="text-sm font-black text-primary-900 uppercase tracking-widest mb-12 flex items-center gap-3">
                      <RotateCcw size={20} className="text-blue-500" /> Circuit Institutionnel de Visa (Décret PPP)
                   </h3>
                   <div className="relative flex-1 px-8 overflow-y-auto no-scrollbar">
                      <div className="absolute left-[54px] top-0 bottom-0 w-1.5 bg-gray-100 rounded-full"></div>
                      <div className="space-y-12 relative">
                          {institutionalSteps.map((step, idx) => {
                              const isCompleted = idx < currentStepIndex;
                              const isCurrent = idx === currentStepIndex;
                              const Icon = step.icon;
                              return (
                                <div key={idx} className={`flex items-start gap-8 transition-all duration-500 ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-20'}`}>
                                   <div className={`relative z-10 w-16 h-16 rounded-[24px] flex items-center justify-center shadow-xl border-4 border-white transition-all ${
                                     isCompleted ? 'bg-emerald-500 text-white' : 
                                     isCurrent ? 'bg-blue-600 text-white scale-110 ring-8 ring-blue-500/10 shadow-blue-500/20' : 'bg-gray-100 text-gray-400'
                                   }`}>
                                      {isCompleted ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                                   </div>
                                   <div className="flex-1 pt-2">
                                      <div className="flex items-center justify-between">
                                        <div className="text-left">
                                          <h4 className={`text-xs font-black uppercase tracking-tight ${isCurrent ? 'text-blue-700' : 'text-gray-900'}`}>{step.label}</h4>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 italic">{step.desc}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                           <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg border ${
                                              isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                              isCurrent ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-100'
                                           }`}>Habilité: {step.role}</span>
                                           {step.id === ProjectStatus.P1_SECTORIAL_VALIDATION && <span className="text-[7px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">Délai Légal: 60 jours</span>}
                                        </div>
                                      </div>
                                   </div>
                                </div>
                              );
                          })}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="animate-fade-in space-y-8 h-full flex flex-col">
                   <div className="bg-primary-900 p-10 rounded-[40px] text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={100} /></div>
                      <div className="relative z-10 text-left">
                         <h3 className="text-2xl font-black uppercase tracking-tighter">Analyse Experte IA (Gemini 3)</h3>
                         <p className="text-accent-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Analyse multi-critères des risques & soutenabilité</p>
                      </div>
                   </div>
                   <div className="flex-1 bg-gray-50 p-10 rounded-[40px] border border-gray-100 overflow-y-auto text-left">
                      {isAnalyzing ? (
                         <div className="flex flex-col items-center justify-center h-full py-12 gap-6">
                            <Loader2 size={48} className="animate-spin text-primary-900" />
                            <p className="text-[10px] font-black text-primary-900 uppercase tracking-widest animate-pulse">L'IA de l'UC-PPP analyse les données technique...</p>
                         </div>
                      ) : (
                         <div className="prose prose-sm prose-blue max-w-none text-left" dangerouslySetInnerHTML={{ __html: aiAnalysis || "Lancer l'analyse pour voir les résultats." }} />
                      )}
                   </div>
                </div>
              )}

              {activeTab === 'avis' && (
                <div className="animate-fade-in space-y-6 h-full flex flex-col">
                   <h3 className="text-sm font-black text-primary-900 uppercase tracking-widest mb-4 flex items-center gap-3">
                      <MessageSquare size={20} className="text-accent-500" /> Registre Officiel des Visas Institutionnels
                   </h3>
                   <div className="flex-1 space-y-4 overflow-y-auto pr-2 no-scrollbar">
                      {project.approvalHistory.length > 0 ? [...project.approvalHistory].reverse().map((log, idx) => (
                         <div key={idx} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-start gap-6 hover:border-primary-100 transition-all text-left">
                            <div className={`p-4 rounded-2xl flex-shrink-0 ${
                              log.action === 'FAVORABLE' ? 'bg-emerald-50 text-emerald-600' : 
                              log.action === 'RESERVE' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                            }`}>
                               {log.action === 'FAVORABLE' ? <CheckCircle2 size={24} /> : log.action === 'RESERVE' ? <AlertTriangle size={24} /> : <XCircle size={24} />}
                            </div>
                            <div className="space-y-2">
                               <div className="flex items-center gap-4">
                                  <span className="text-xs font-black text-primary-900 uppercase">{log.actor}</span>
                                  <span className="text-[10px] font-bold text-gray-400">{log.date}</span>
                               </div>
                               <p className="text-xs text-gray-600 leading-relaxed font-medium italic">"{log.comment}"</p>
                            </div>
                         </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center h-64 opacity-20">
                           <MessageSquare size={64} className="mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Aucun visa enregistré à ce stade</p>
                        </div>
                      )}
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
