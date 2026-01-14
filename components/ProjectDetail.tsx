
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, UserRole, Document, ApprovalLog } from '../types';
import { 
  ArrowLeft, Microscope, ShieldCheck, Clock, CheckCircle2, 
  Building2, FileText, MessageSquare, Calendar, FolderOpen,
  XCircle, Plus, ChevronRight, BadgeCheck, ShieldAlert,
  RotateCcw, FileCheck, Landmark, AlertTriangle, Sparkles, Loader2
} from 'lucide-react';
import { generateProjectRiskAnalysis } from '../services/geminiService';

type ValidationDecision = 'FAVORABLE' | 'RESERVE' | 'REJET';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  isAdmin: boolean;
  userRole: UserRole;
  onUpdateProject?: (project: Project) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, isAdmin, userRole, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'docs' | 'avis' | 'ai'>('flow');
  const [comment, setComment] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const getWorkflowSteps = () => {
    if (project.status.startsWith('P1')) {
      return [
        { id: ProjectStatus.P1_IDENTIFICATION, label: 'Identification', days: 0 },
        { id: ProjectStatus.P1_SECTORIAL_VALIDATION, label: 'Val. Ministère', days: 15 },
        { id: ProjectStatus.P1_UC_CONFORMITY, label: 'Avis UC-PPP', days: 20 },
        { id: ProjectStatus.P1_PIP_INSCRIPTION, label: 'Inscription Plan', days: 10 }
      ];
    }
    if (project.status.startsWith('P2')) {
      return [
        { id: ProjectStatus.P2_FEASIBILITY_PREP, label: 'Faisabilité', days: 90 },
        { id: ProjectStatus.P2_MULTILATERAL_AVIS, label: 'Avis Organes', days: 20 },
        { id: ProjectStatus.P2_BUDGET_PROGRAMMING, label: 'Prog. Budget', days: 60 }
      ];
    }
    return [
      { id: ProjectStatus.P3_DAO_PREP, label: 'Préparation DAO', days: 15 },
      { id: ProjectStatus.P3_TENDERING, label: 'Appel d\'Offres', days: 45 },
      { id: ProjectStatus.P3_EVALUATION, label: 'Évaluation', days: 15 },
      { id: ProjectStatus.P3_NEGOTIATION, label: 'Négociations', days: 45 },
      { id: ProjectStatus.P3_VISA_UC_FINAL, label: 'Visa UC-PPP', days: 20 },
      { id: ProjectStatus.P3_APPROBATION, label: 'Approbation', days: 20 }
    ];
  };

  useEffect(() => {
    const fetchAIAnalysis = async () => {
      setIsAnalyzing(true);
      const analysis = await generateProjectRiskAnalysis(project);
      setAiAnalysis(analysis);
      setIsAnalyzing(false);
    };
    fetchAIAnalysis();
  }, [project.id]);

  const handleValidation = (decision: ValidationDecision) => {
    if (!onUpdateProject || !comment.trim()) {
      alert("Un commentaire technique est obligatoire pour apposer votre visa/avis.");
      return;
    }
    
    let nextStatus = project.status;
    
    if (decision !== 'REJET') {
      const current = project.status;
      if (current === ProjectStatus.SUBMITTED || current === ProjectStatus.P1_IDENTIFICATION) nextStatus = ProjectStatus.P1_SECTORIAL_VALIDATION;
      else if (current === ProjectStatus.P1_SECTORIAL_VALIDATION) nextStatus = ProjectStatus.P1_UC_CONFORMITY;
      else if (current === ProjectStatus.P1_UC_CONFORMITY) nextStatus = ProjectStatus.P1_PIP_INSCRIPTION;
      else if (current === ProjectStatus.P1_PIP_INSCRIPTION) nextStatus = ProjectStatus.P2_FEASIBILITY_PREP;
      else if (current === ProjectStatus.P2_FEASIBILITY_PREP) nextStatus = ProjectStatus.P2_MULTILATERAL_AVIS;
      else if (current === ProjectStatus.P2_MULTILATERAL_AVIS) nextStatus = ProjectStatus.P2_BUDGET_PROGRAMMING;
      else if (current === ProjectStatus.P2_BUDGET_PROGRAMMING) nextStatus = ProjectStatus.P3_DAO_PREP;
      else if (current === ProjectStatus.P3_DAO_PREP) nextStatus = ProjectStatus.P3_UC_SIMPLE_AVIS;
      else if (current === ProjectStatus.P3_UC_SIMPLE_AVIS) nextStatus = ProjectStatus.P3_DGCMP_ANO_DAO;
      else if (current === ProjectStatus.P3_DGCMP_ANO_DAO) nextStatus = ProjectStatus.P3_TENDERING;
      else if (current === ProjectStatus.P3_TENDERING) nextStatus = ProjectStatus.P3_EVALUATION;
      else if (current === ProjectStatus.P3_EVALUATION) nextStatus = ProjectStatus.P3_NEGOTIATION;
      else if (current === ProjectStatus.P3_NEGOTIATION) nextStatus = ProjectStatus.P3_VISA_UC_FINAL;
      else if (current === ProjectStatus.P3_VISA_UC_FINAL) nextStatus = ProjectStatus.P3_APPROBATION;
      else if (current === ProjectStatus.P3_APPROBATION) nextStatus = ProjectStatus.ACTIVE;
    } else {
      nextStatus = ProjectStatus.REJECTED;
    }

    const newLog: ApprovalLog = {
      date: new Date().toLocaleDateString('fr-FR'),
      action: decision as any,
      actor: userRole === UserRole.MINISTRY ? project.parentMinistry : userRole,
      comment: comment
    };

    const updatedProject = {
      ...project,
      status: nextStatus,
      approvalHistory: [...(project.approvalHistory || []), newLog],
      progress: Math.min(100, (project.progress || 0) + 5)
    };
    
    onUpdateProject(updatedProject);
    setComment('');
    setActiveTab('avis');
  };

  const steps = getWorkflowSteps();
  const currentIndex = steps.findIndex(s => s.id === project.status);

  const isAuthorized = (
    (userRole === UserRole.MINISTRY && project.status === ProjectStatus.P1_SECTORIAL_VALIDATION) ||
    (userRole === UserRole.COORDINATOR && (project.status === ProjectStatus.P1_UC_CONFORMITY || project.status === ProjectStatus.P3_UC_SIMPLE_AVIS || project.status === ProjectStatus.P3_VISA_UC_FINAL)) ||
    (userRole === UserRole.FINANCE && project.status === ProjectStatus.P2_MULTILATERAL_AVIS) ||
    (userRole === UserRole.BUDGET && project.status === ProjectStatus.P2_MULTILATERAL_AVIS) ||
    (userRole === UserRole.VALIDATOR && project.status === ProjectStatus.P1_PIP_INSCRIPTION) ||
    (userRole === UserRole.ANALYST && (project.status === ProjectStatus.P3_DGCMP_ANO_DAO || project.status === ProjectStatus.P3_APPROBATION))
  );

  return (
    <div className="p-6 animate-fade-in max-w-7xl mx-auto space-y-6 text-left">
      <button onClick={onBack} className="flex items-center text-gray-400 hover:text-primary-900 transition-colors font-black text-[10px] uppercase tracking-widest">
        <ArrowLeft size={16} className="mr-2" /> Retour Portefeuille
      </button>

      {/* Header Info */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
             <span className="px-4 py-1.5 bg-primary-900 text-accent-400 text-[10px] font-black uppercase rounded-full tracking-widest">
               UC-PPP RDC | Tutelle : {project.parentMinistry}
             </span>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{project.id}</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight uppercase tracking-tighter">{project.title}</h1>
          <div className="flex flex-wrap gap-4 text-[11px] font-bold text-gray-500 uppercase">
             <span className="flex items-center gap-1.5"><Building2 size={14} className="text-primary-500"/> Entité : {project.authority}</span>
             <span className="flex items-center gap-1.5 text-primary-900 bg-primary-50 px-3 py-1 rounded-lg border border-primary-100"><Clock size={14}/> Statut : {project.status}</span>
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center min-w-[200px]">
          <span className="text-[10px] font-black text-gray-400 uppercase block mb-1 tracking-widest">Budget CAPEX</span>
          <span className="text-3xl font-black text-primary-900">{(project.capex/1000000).toLocaleString()} <small className="text-xs font-bold">M$</small></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {isAuthorized && (
            <div className="bg-white p-8 rounded-[32px] shadow-2xl border-t-8 border-primary-900 space-y-6 animate-slide-up">
              <div className="flex items-center gap-3 text-primary-900">
                  <ShieldCheck size={20} className="text-accent-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Instruction Institutionnelle</h4>
              </div>
              
              <div className="space-y-2">
                 <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Motivation Technique</label>
                 <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-medium focus:ring-4 focus:ring-primary-500/10 outline-none h-32"
                  placeholder="Émettez votre avis motivé ici..."
                 />
              </div>

              <div className="flex flex-col gap-3">
                 <button onClick={() => handleValidation('FAVORABLE')} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3">
                    <BadgeCheck size={18} /> Avis Favorable
                 </button>
                 <button onClick={() => handleValidation('RESERVE')} className="w-full py-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center justify-center gap-3">
                    <ShieldAlert size={18} /> Sous réserve
                 </button>
                 <button onClick={() => handleValidation('REJET')} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-3">
                    <XCircle size={18} /> Émettre un Rejet
                 </button>
              </div>
            </div>
          )}

          <div className="bg-white p-2 rounded-[32px] shadow-sm border border-gray-100 flex flex-col gap-1">
            <button onClick={() => setActiveTab('flow')} className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'flow' ? 'bg-primary-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              <RotateCcw size={18} /> Cycle de Vie
            </button>
            <button onClick={() => setActiveTab('ai')} className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'ai' ? 'bg-primary-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              <Sparkles size={18} className={isAnalyzing ? 'animate-spin' : ''} /> Analyse IA Risque
            </button>
            <button onClick={() => setActiveTab('avis')} className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'avis' ? 'bg-primary-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              <MessageSquare size={18} /> Registre des Avis
            </button>
            <button onClick={() => setActiveTab('docs')} className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'docs' ? 'bg-primary-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
              <FolderOpen size={18} /> Documentation
            </button>
          </div>
        </div>

        {/* Espace Central */}
        <div className="lg:col-span-9">
           {activeTab === 'flow' && (
             <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 space-y-12">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-black text-primary-900 uppercase tracking-widest">Progression Réglementaire</h3>
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                     Dossier Actif
                   </span>
                </div>
                
                <div className="relative px-12 pb-8 overflow-x-auto no-scrollbar">
                   <div className="min-w-[600px] relative">
                      <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                      <div className="relative flex justify-between">
                          {steps.map((step, idx) => {
                            const isDone = idx < currentIndex;
                            const isCurrent = idx === currentIndex;
                            return (
                              <div key={idx} className="flex flex-col items-center gap-4 relative z-10 text-center">
                                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center border-4 border-white shadow-xl transition-all duration-500 ${
                                  isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-primary-900 text-accent-400 scale-125 ring-8 ring-primary-50' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {isDone ? <CheckCircle2 size={24}/> : <FileCheck size={24}/>}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-tight max-w-[80px] leading-tight ${isCurrent ? 'text-primary-900' : 'text-gray-400'}`}>
                                    {step.label}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'ai' && (
             <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 space-y-8 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-primary-900 uppercase tracking-widest flex items-center gap-3">
                    <Sparkles size={20} className="text-accent-500" /> Analyse de Risque Intelligente
                  </h3>
                  <div className="bg-accent-50 text-accent-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Gemini 3.0 Pro</div>
                </div>

                {isAnalyzing ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <Loader2 size={40} className="text-primary-600 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">L'expert IA analyse les données du projet...</p>
                  </div>
                ) : aiAnalysis ? (
                  <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 shadow-inner">
                    <div 
                      className="prose prose-sm max-w-none text-gray-700 font-medium leading-relaxed ai-content"
                      dangerouslySetInnerHTML={{ __html: aiAnalysis }}
                    />
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <AlertTriangle size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase">Impossible de charger l'analyse pour le moment</p>
                  </div>
                )}
             </div>
           )}

           {activeTab === 'avis' && (
             <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 space-y-8 animate-fade-in">
                <h3 className="text-sm font-black text-primary-900 uppercase tracking-widest">Journal des Avis & Tutelles</h3>
                <div className="space-y-6">
                   {project.approvalHistory && project.approvalHistory.length > 0 ? (
                      project.approvalHistory.map((log, idx) => (
                        <div key={idx} className={`p-6 rounded-[32px] border flex flex-col gap-4 ${
                          log.action === 'REJET' ? 'bg-red-50/50 border-red-100' : 
                          log.action === 'RESERVE' ? 'bg-amber-50/50 border-amber-100' : 
                          'bg-gray-50 border-gray-100'
                        }`}>
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="text-xs font-black text-primary-900 uppercase">{log.actor}</p>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase"><Calendar size={10} className="inline mr-1"/> {log.date}</p>
                              </div>
                              <span className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-full ${
                                log.action === 'REJET' ? 'bg-red-600 text-white' : 
                                log.action === 'RESERVE' ? 'bg-amber-500 text-white' : 
                                'bg-emerald-600 text-white'
                              }`}>
                                {log.action}
                              </span>
                           </div>
                           <p className="text-xs text-gray-600 font-medium italic">"{log.comment}"</p>
                        </div>
                      ))
                   ) : (
                      <div className="py-20 text-center text-gray-300 uppercase font-black text-[10px]">
                         Aucun avis sectoriel enregistré
                      </div>
                   )}
                </div>
             </div>
           )}
        </div>
      </div>
      <style>{`
        .ai-content ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 1rem; }
        .ai-content li { margin-bottom: 0.5rem; }
        .ai-content p { margin-bottom: 1rem; }
        .ai-content strong { color: #1e3a8a; }
      `}</style>
    </div>
  );
};

export default ProjectDetail;
