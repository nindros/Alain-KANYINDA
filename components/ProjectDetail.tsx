
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, UserRole, ApprovalLog } from '../types';
import { 
  ArrowLeft, ShieldCheck, Clock, CheckCircle2, 
  Building2, MessageSquare, Calendar, FolderOpen,
  XCircle, BadgeCheck, ShieldAlert, RotateCcw, FileCheck, Sparkles, Loader2,
  ChevronRight, Landmark, Gavel, Target, Coins, Receipt
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

  // Définition du circuit institutionnel officiel
  const institutionalSteps = [
    { id: ProjectStatus.SUBMITTED, label: 'Soumission AC', role: UserRole.MINISTRY, icon: Building2 },
    { id: ProjectStatus.P1_UC_CONFORMITY, label: 'Avis Conformité UC-PPP', role: UserRole.COORDINATOR, icon: ShieldCheck },
    { id: ProjectStatus.P1_PIP_INSCRIPTION, label: 'Validation Ministère du Plan (PIP)', role: UserRole.VALIDATOR, icon: Target },
    { id: ProjectStatus.P2_MULTILATERAL_AVIS, label: 'Soutenabilité Finances & Budget', role: UserRole.FINANCE, icon: Coins },
    { id: ProjectStatus.P3_DGCMP_ANO_DAO, label: 'ANO DGCMP (Passation)', role: UserRole.ANALYST, icon: Gavel },
    { id: ProjectStatus.P3_VISA_UC_FINAL, label: 'Visa Approbation UC-PPP', role: UserRole.COORDINATOR, icon: ShieldCheck },
    { id: ProjectStatus.P3_APPROBATION, label: 'Signature Finale', role: UserRole.ADMIN, icon: BadgeCheck }
  ];

  const currentStepIndex = institutionalSteps.findIndex(s => s.id === project.status);
  const isMyTurn = institutionalSteps[currentStepIndex]?.role === userRole || userRole === UserRole.ADMIN;

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

    // Calcul de la prochaine étape dans le circuit
    let nextStatus = project.status;
    if (decision === 'FAVORABLE') {
      const nextStep = institutionalSteps[currentStepIndex + 1];
      nextStatus = nextStep ? nextStep.id : ProjectStatus.ACTIVE;
    } else if (decision === 'REJET') {
      nextStatus = ProjectStatus.REJECTED;
    }

    const newLog: ApprovalLog = { 
      date: new Date().toLocaleDateString('fr-FR'), 
      action: decision as any, 
      actor: `${userRole} (${decision})`, 
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

      {/* Header Compact */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
             <span className="px-2 py-0.5 bg-primary-900 text-accent-400 text-[8px] font-black uppercase rounded-md">ID: {project.id}</span>
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{project.sector}</span>
          </div>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-tight">{project.title}</h1>
          <p className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-2">
            <Building2 size={12} className="text-gray-300"/> {project.authority} <span className="text-gray-200">|</span> <MapPin size={10}/> {project.location}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-center">
              <span className="text-[7px] font-black text-gray-400 uppercase block tracking-widest">Investissement</span>
              <span className="text-lg font-black text-primary-900">{(project.capex/1000000).toLocaleString()} M$</span>
            </div>
            <div className={`px-4 py-2 rounded-2xl border flex flex-col items-center justify-center min-w-[120px] ${project.status === ProjectStatus.REJECTED ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                <span className="text-[7px] font-black text-blue-900/40 uppercase block tracking-widest">Étape Actuelle</span>
                <span className="text-[9px] font-black text-blue-900 uppercase truncate max-w-[100px]">{project.status.split(':')[0]}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Navigation & Action Side */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1">
            <button onClick={() => setActiveTab('flow')} className={`flex items-center justify-between px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'flow' ? 'bg-primary-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3"><RotateCcw size={14} /> Circuit Public</div>
              <ChevronRight size={12} className={activeTab === 'flow' ? 'opacity-100' : 'opacity-0'} />
            </button>
            <button onClick={() => setActiveTab('ai')} className={`flex items-center justify-between px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'ai' ? 'bg-primary-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3"><Sparkles size={14} className={isAnalyzing ? 'animate-spin' : ''} /> Analyse Risque</div>
              <ChevronRight size={12} className={activeTab === 'ai' ? 'opacity-100' : 'opacity-0'} />
            </button>
            <button onClick={() => setActiveTab('avis')} className={`flex items-center justify-between px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'avis' ? 'bg-primary-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3"><MessageSquare size={14} /> Registre Avis</div>
              <ChevronRight size={12} className={activeTab === 'avis' ? 'opacity-100' : 'opacity-0'} />
            </button>
          </div>

          {/* Panneau de Validation Contextuel */}
          <div className={`bg-white p-5 rounded-3xl shadow-sm border-2 transition-all ${isMyTurn ? 'border-accent-400 ring-4 ring-accent-400/5' : 'border-gray-50 opacity-60'}`}>
             <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isMyTurn ? 'bg-accent-500 text-primary-900' : 'bg-gray-100 text-gray-400'}`}>
                   <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-primary-900">Visa Institutionnel</h4>
                  <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">{isMyTurn ? 'Action requise de votre part' : 'En attente d\'une autre instance'}</p>
                </div>
             </div>

             <textarea 
               disabled={!isMyTurn}
               value={comment} 
               onChange={(e) => setComment(e.target.value)} 
               className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-[10px] font-medium outline-none h-24 focus:border-primary-500 transition-all mb-4 disabled:cursor-not-allowed" 
               placeholder={isMyTurn ? "Saisissez votre avis technique motivé ici..." : "Consultation uniquement"} 
             />

             <div className="space-y-2">
                <button 
                  disabled={!isMyTurn}
                  onClick={() => handleValidation('FAVORABLE')} 
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 size={14} /> Émettre un Avis Favorable
                </button>
                <button 
                  disabled={!isMyTurn}
                  onClick={() => handleValidation('REJET')} 
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-30"
                >
                  Refuser / Dossier Non-Conforme
                </button>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 h-full">
           <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full overflow-hidden">
              {activeTab === 'flow' && (
                <div className="animate-fade-in flex flex-col h-full">
                   <div className="flex justify-between items-center mb-10">
                      <h3 className="text-[11px] font-black text-primary-900 uppercase tracking-widest flex items-center gap-2">
                        <RotateCcw size={16} className="text-blue-500" /> Circuit Institutionnel de Validation
                      </h3>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span className="text-[8px] font-black uppercase text-gray-400">Validé</span></div>
                         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> <span className="text-[8px] font-black uppercase text-gray-400">En cours</span></div>
                      </div>
                   </div>

                   <div className="relative flex-1 px-4">
                      {/* Ligne de connexion verticale */}
                      <div className="absolute left-[34px] top-0 bottom-0 w-1 bg-gray-50 rounded-full"></div>
                      
                      <div className="space-y-8 relative">
                          {institutionalSteps.map((step, idx) => {
                              const isCompleted = idx < currentStepIndex;
                              const isCurrent = idx === currentStepIndex;
                              const StepIcon = step.icon;

                              return (
                                <div key={idx} className={`flex items-start gap-6 transition-all ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                                   <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white transition-all ${
                                     isCompleted ? 'bg-emerald-500 text-white' : 
                                     isCurrent ? 'bg-blue-600 text-white scale-110' : 'bg-gray-100 text-gray-400'
                                   }`}>
                                      {isCompleted ? <CheckCircle2 size={20} /> : <StepIcon size={20} />}
                                   </div>
                                   <div className="flex-1 pt-1">
                                      <div className="flex items-center justify-between">
                                        <h4 className={`text-[10px] font-black uppercase tracking-tight ${isCurrent ? 'text-blue-700' : 'text-gray-900'}`}>{step.label}</h4>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                          isCompleted ? 'bg-emerald-50 text-emerald-600' : 
                                          isCurrent ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'
                                        }`}>
                                          {step.role}
                                        </span>
                                      </div>
                                      <p className="text-[9px] text-gray-400 mt-1 italic">
                                        {isCompleted ? 'Validation institutionnelle enregistrée.' : isCurrent ? 'Instruction en cours par l\'autorité compétente.' : 'En attente des visas précédents.'}
                                      </p>
                                   </div>
                                </div>
                              );
                          })}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-6 animate-fade-in overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                   <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm"><Sparkles className="text-accent-500" size={20} /></div>
                      <div>
                        <h3 className="text-[11px] font-black text-primary-900 uppercase">Assistant Expert PPP (IA)</h3>
                        <p className="text-[9px] text-primary-600 font-bold uppercase tracking-widest">Analyse de conformité & risques financiers</p>
                      </div>
                   </div>
                   {isAnalyzing ? (
                     <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 size={32} className="animate-spin text-primary-600" />
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Traitement des données projet en cours...</p>
                     </div>
                   ) : (
                     <div className="text-xs text-gray-700 leading-relaxed bg-white p-6 rounded-2xl border border-gray-100 shadow-inner ai-content space-y-4" dangerouslySetInnerHTML={{ __html: aiAnalysis || "L'analyse est prête à être générée." }} />
                   )}
                </div>
              )}

              {activeTab === 'avis' && (
                <div className="space-y-4 animate-fade-in h-full flex flex-col">
                   <h3 className="text-[11px] font-black text-primary-900 uppercase flex items-center gap-2">
                     <MessageSquare size={16} className="text-emerald-500" /> Registre d'Instruction Technique
                   </h3>
                   <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {project.approvalHistory.length > 0 ? project.approvalHistory.slice().reverse().map((log, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border bg-gray-50 border-gray-100 flex flex-col gap-3 group hover:border-primary-200 transition-all">
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary-900 font-black text-[10px] shadow-sm border border-gray-100">{log.actor.charAt(0)}</div>
                                 <div className="text-left">
                                    <p className="text-[9px] font-black text-primary-900 uppercase">{log.actor}</p>
                                    <p className="text-[8px] text-gray-400 font-bold">{log.date}</p>
                                 </div>
                              </div>
                              <span className={`px-3 py-1 text-[8px] font-black uppercase rounded-full shadow-sm ${
                                log.action === 'REJET' ? 'bg-red-600 text-white' : 
                                log.action === 'RESERVE' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                              }`}>{log.action}</span>
                           </div>
                           <p className="text-[10px] text-gray-600 leading-relaxed italic bg-white p-3 rounded-xl border border-gray-50">"{log.comment}"</p>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                           <FileCheck size={48} className="text-gray-400 mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Aucun avis technique enregistré</p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="space-y-6 animate-fade-in overflow-y-auto h-full custom-scrollbar">
                   <h3 className="text-[11px] font-black text-primary-900 uppercase">Documentation Technique du Dossier</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.documents.map((doc) => (
                        <div key={doc.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:bg-primary-900 hover:text-white transition-all cursor-pointer">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-white rounded-xl text-primary-600 group-hover:bg-primary-800 group-hover:text-accent-400 transition-all"><FolderOpen size={18} /></div>
                              <div className="text-left">
                                 <p className="text-[10px] font-black uppercase tracking-tight truncate max-w-[140px]">{doc.name}</p>
                                 <p className="text-[8px] opacity-60 uppercase font-bold">{doc.type}</p>
                              </div>
                           </div>
                           <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      ))}
                      <button className="p-4 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary-300 hover:bg-primary-50 transition-all">
                        <Plus className="text-gray-300" size={24} />
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Ajouter une pièce jointe</span>
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const MapPin = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const Plus = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>;

export default ProjectDetail;
