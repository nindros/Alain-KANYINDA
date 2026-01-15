
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, UserRole, ApprovalLog } from '../types';
import { 
  ArrowLeft, ShieldCheck, Clock, CheckCircle2, 
  Building2, MessageSquare, Calendar, FolderOpen,
  XCircle, BadgeCheck, ShieldAlert, RotateCcw, FileCheck, Sparkles, Loader2,
  ChevronRight, Landmark, Gavel, Target, Coins, Receipt, AlertTriangle, MapPin
} from 'lucide-react';
import { generateProjectRiskAnalysis } from '../services/geminiService';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  isAdmin: boolean;
  userRole: UserRole;
  onUpdateProject?: (project: Project) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, userRole, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'docs' | 'avis' | 'ai'>('flow');
  const [comment, setComment] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * DEFINITION DU CIRCUIT : Le rôle indique qui doit VALIDER cette étape pour passer à la suivante.
   * Si le projet est à 'SUBMITTED', c'est à l'UC-PPP de donner son avis de conformité.
   */
  const institutionalSteps = [
    { id: ProjectStatus.SUBMITTED, label: 'Examen Conformité UC-PPP', role: UserRole.COORDINATOR, icon: ShieldCheck },
    { id: ProjectStatus.P1_UC_CONFORMITY, label: 'Validation Min. Plan (PIP)', role: UserRole.VALIDATOR, icon: Target },
    { id: ProjectStatus.P1_PIP_INSCRIPTION, label: 'Avis Soutenabilité Finances', role: UserRole.FINANCE, icon: Coins },
    { id: ProjectStatus.P2_MULTILATERAL_AVIS, label: 'ANO Passation DGCMP', role: UserRole.ANALYST, icon: Gavel },
    { id: ProjectStatus.P3_DGCMP_ANO_DAO, label: 'Visa Approbation UC-PPP', role: UserRole.COORDINATOR, icon: ShieldCheck },
    { id: ProjectStatus.P3_VISA_UC_FINAL, label: 'Signature & Approbation', role: UserRole.ADMIN, icon: BadgeCheck }
  ];

  const currentStepIndex = institutionalSteps.findIndex(s => s.id === project.status);
  // On autorise l'UC-PPP et l'Admin à agir si c'est leur étape ou si le projet vient d'être soumis
  const isMyTurn = (currentStepIndex !== -1 && institutionalSteps[currentStepIndex].role === userRole) || userRole === UserRole.ADMIN;

  useEffect(() => {
    const fetchAI = async () => { 
      if (activeTab === 'ai' && !aiAnalysis) {
        setIsAnalyzing(true); 
        setAiAnalysis(await generateProjectRiskAnalysis(project)); 
        setIsAnalyzing(false); 
      }
    };
    fetchAI();
  }, [activeTab]);

  const handleValidation = (decision: 'FAVORABLE' | 'RESERVE' | 'REJET') => {
    if (!onUpdateProject) return;
    if (!comment.trim()) {
      alert("Un commentaire technique est obligatoire pour motiver votre avis.");
      return;
    }

    let nextStatus = project.status;
    if (decision === 'FAVORABLE' || decision === 'RESERVE') {
      const nextStep = institutionalSteps[currentStepIndex + 1];
      nextStatus = nextStep ? nextStep.id : ProjectStatus.ACTIVE;
    } else if (decision === 'REJET') {
      nextStatus = ProjectStatus.REJECTED;
    }

    const newLog: ApprovalLog = { 
      date: new Date().toLocaleDateString('fr-FR'), 
      action: decision, 
      actor: `${userRole}`, 
      comment: comment 
    };

    onUpdateProject({ 
      ...project, 
      status: nextStatus, 
      approvalHistory: [...(project.approvalHistory || []), newLog] 
    });

    setComment('');
    setActiveTab('avis');
  };

  return (
    <div className="p-3 lg:p-4 animate-fade-in max-w-7xl mx-auto space-y-4 text-left">
      <button onClick={onBack} className="flex items-center text-gray-400 hover:text-primary-900 font-black text-[9px] uppercase tracking-widest transition-all">
        <ArrowLeft size={14} className="mr-2" /> Retour au portefeuille
      </button>

      {/* Header Info Projet */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
             <span className="px-2 py-0.5 bg-primary-900 text-accent-400 text-[8px] font-black uppercase rounded-md">ID: {project.id}</span>
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{project.sector}</span>
          </div>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-tight">{project.title}</h1>
          <p className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-2">
            <Building2 size={12} className="text-gray-300"/> {project.authority}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-center">
              <span className="text-[7px] font-black text-gray-400 uppercase block tracking-widest">Budget CAPEX</span>
              <span className="text-lg font-black text-primary-900">{(project.capex/1000000).toLocaleString()} M$</span>
            </div>
            <div className={`px-4 py-2 rounded-2xl border flex flex-col items-center justify-center min-w-[120px] ${project.status === ProjectStatus.REJECTED ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                <span className="text-[7px] font-black text-blue-900/40 uppercase block tracking-widest">État du Dossier</span>
                <span className="text-[9px] font-black text-blue-900 uppercase truncate max-w-[100px]">
                    {project.status === ProjectStatus.SUBMITTED ? "À Instruire" : project.status.split(':')[0]}
                </span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1">
            <button onClick={() => setActiveTab('flow')} className={`flex items-center justify-between px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'flow' ? 'bg-primary-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3"><RotateCcw size={14} /> Circuit de Visa</div>
              <ChevronRight size={12} className={activeTab === 'flow' ? 'opacity-100' : 'opacity-0'} />
            </button>
            <button onClick={() => setActiveTab('ai')} className={`flex items-center justify-between px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'ai' ? 'bg-primary-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3"><Sparkles size={14} className={isAnalyzing ? 'animate-spin' : ''} /> Analyse IA</div>
              <ChevronRight size={12} className={activeTab === 'ai' ? 'opacity-100' : 'opacity-0'} />
            </button>
            <button onClick={() => setActiveTab('avis')} className={`flex items-center justify-between px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'avis' ? 'bg-primary-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3"><MessageSquare size={14} /> Registre Avis</div>
              <ChevronRight size={12} className={activeTab === 'avis' ? 'opacity-100' : 'opacity-0'} />
            </button>
          </div>

          {/* Panneau de Validation : Visible pour l'UC-PPP si le projet est SUBMITTED */}
          <div className={`bg-white p-5 rounded-3xl shadow-sm border-2 transition-all ${isMyTurn ? 'border-accent-400 ring-4 ring-accent-400/5 bg-accent-50/5' : 'border-gray-50 opacity-60'}`}>
             <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isMyTurn ? 'bg-accent-500 text-primary-900' : 'bg-gray-100 text-gray-400'}`}>
                   <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-primary-900">Visa Technique</h4>
                  <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">
                    {isMyTurn ? 'Votre action est requise' : 'En attente d\'une autre étape'}
                  </p>
                </div>
             </div>

             <textarea 
               disabled={!isMyTurn}
               value={comment} 
               onChange={(e) => setComment(e.target.value)} 
               className="w-full bg-white border border-gray-200 rounded-xl p-3 text-[10px] font-medium outline-none h-24 focus:border-primary-500 transition-all mb-4 disabled:bg-gray-50 disabled:cursor-not-allowed" 
               placeholder={isMyTurn ? "Saisissez votre avis technique motivé ici..." : "Consultation uniquement"} 
             />

             <div className="space-y-2">
                <button 
                  disabled={!isMyTurn}
                  onClick={() => handleValidation('FAVORABLE')} 
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle2 size={14} /> Avis Favorable
                </button>
                
                <button 
                  disabled={!isMyTurn}
                  onClick={() => handleValidation('RESERVE')} 
                  className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg"
                >
                  <AlertTriangle size={14} /> Favorable avec Réserves
                </button>

                <button 
                  disabled={!isMyTurn}
                  onClick={() => handleValidation('REJET')} 
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  <XCircle size={14} /> Refuser le Dossier
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-9 h-full">
           <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full overflow-hidden">
              {activeTab === 'flow' && (
                <div className="animate-fade-in flex flex-col h-full">
                   <h3 className="text-[11px] font-black text-primary-900 uppercase tracking-widest mb-10 flex items-center gap-2">
                      <RotateCcw size={16} className="text-blue-500" /> Étapes Institutionnelles
                   </h3>

                   <div className="relative flex-1 px-4 overflow-y-auto no-scrollbar">
                      <div className="absolute left-[34px] top-0 bottom-0 w-1 bg-gray-100 rounded-full"></div>
                      <div className="space-y-6 relative">
                          {institutionalSteps.map((step, idx) => {
                              const isCompleted = idx < currentStepIndex;
                              const isCurrent = idx === currentStepIndex;
                              const StepIcon = step.icon;

                              return (
                                <div key={idx} className={`flex items-start gap-6 transition-all ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-30'}`}>
                                   <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white transition-all ${
                                     isCompleted ? 'bg-emerald-500 text-white' : 
                                     isCurrent ? 'bg-blue-600 text-white scale-110' : 'bg-gray-100 text-gray-400'
                                   }`}>
                                      {isCompleted ? <CheckCircle2 size={20} /> : <StepIcon size={20} />}
                                   </div>
                                   <div className="flex-1 pt-1">
                                      <div className="flex items-center justify-between">
                                        <h4 className={`text-[10px] font-black uppercase tracking-tight ${isCurrent ? 'text-blue-700 font-black' : 'text-gray-900'}`}>{step.label}</h4>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                          isCompleted ? 'bg-emerald-50 text-emerald-600' : 
                                          isCurrent ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-400'
                                        }`}>
                                          {step.role}
                                        </span>
                                      </div>
                                   </div>
                                </div>
                              );
                          })}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'avis' && (
                <div className="space-y-4 animate-fade-in h-full flex flex-col">
                   <h3 className="text-[11px] font-black text-primary-900 uppercase flex items-center gap-2">
                     <MessageSquare size={16} className="text-emerald-500" /> Historique des Visas
                   </h3>
                   <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {project.approvalHistory.length > 0 ? project.approvalHistory.slice().reverse().map((log, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl border flex flex-col gap-3 group transition-all ${
                            log.action === 'RESERVE' ? 'bg-amber-50/50 border-amber-100' : 'bg-gray-50 border-gray-100'
                        }`}>
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm border ${
                                     log.action === 'RESERVE' ? 'bg-amber-500 text-white border-amber-400' : 'bg-white text-primary-900 border-gray-100'
                                 }`}>{log.actor.charAt(0)}</div>
                                 <div className="text-left">
                                    <p className="text-[9px] font-black text-primary-900 uppercase">{log.actor}</p>
                                    <p className="text-[8px] text-gray-400 font-bold">{log.date}</p>
                                 </div>
                              </div>
                              <span className={`px-3 py-1 text-[8px] font-black uppercase rounded-full shadow-sm ${
                                log.action === 'REJET' ? 'bg-red-600 text-white' : 
                                log.action === 'RESERVE' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                              }`}>
                                {log.action === 'RESERVE' ? 'AVIS SOUS RÉSERVE' : `AVIS ${log.action}`}
                              </span>
                           </div>
                           <p className="text-[10px] text-gray-600 leading-relaxed italic bg-white p-3 rounded-xl border border-gray-100">"{log.comment}"</p>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                           <FileCheck size={48} className="text-gray-300 mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Aucun visa enregistré pour le moment</p>
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
