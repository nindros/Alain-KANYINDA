
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, UserRole, ApprovalLog } from '../types';
import { 
  ArrowLeft, ShieldCheck, Clock, CheckCircle2, 
  Building2, MessageSquare, Calendar, FolderOpen,
  XCircle, BadgeCheck, ShieldAlert, RotateCcw, FileCheck, Sparkles, Loader2
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
  
  const getWorkflowSteps = () => {
    if (project.status.startsWith('P1')) return [
      { id: ProjectStatus.P1_IDENTIFICATION, label: 'Id' }, { id: ProjectStatus.P1_SECTORIAL_VALIDATION, label: 'Sector' }, 
      { id: ProjectStatus.P1_UC_CONFORMITY, label: 'UC' }, { id: ProjectStatus.P1_PIP_INSCRIPTION, label: 'Plan' }
    ];
    return [
      { id: ProjectStatus.P3_DAO_PREP, label: 'DAO' }, { id: ProjectStatus.P3_TENDERING, label: 'AO' }, 
      { id: ProjectStatus.P3_EVALUATION, label: 'Eval' }, { id: ProjectStatus.P3_NEGOTIATION, label: 'Neg' },
      { id: ProjectStatus.P3_VISA_UC_FINAL, label: 'Visa' }, { id: ProjectStatus.P3_APPROBATION, label: 'App' }
    ];
  };

  useEffect(() => {
    const fetchAI = async () => { setIsAnalyzing(true); setAiAnalysis(await generateProjectRiskAnalysis(project)); setIsAnalyzing(false); };
    fetchAI();
  }, [project.id]);

  const handleValidation = (decision: 'FAVORABLE' | 'RESERVE' | 'REJET') => {
    if (!onUpdateProject || !comment.trim()) return alert("Commentaire requis.");
    let nextStatus = decision === 'REJET' ? ProjectStatus.REJECTED : project.status; // Logique de transition simplifiée pour l'exemple
    const newLog: ApprovalLog = { date: new Date().toLocaleDateString('fr-FR'), action: decision as any, actor: userRole, comment: comment };
    onUpdateProject({ ...project, status: nextStatus, approvalHistory: [...(project.approvalHistory || []), newLog] });
    setComment(''); setActiveTab('avis');
  };

  const steps = getWorkflowSteps();
  const currentIndex = steps.findIndex(s => s.id === project.status);

  return (
    <div className="p-4 animate-fade-in max-w-7xl mx-auto space-y-4 text-left">
      <button onClick={onBack} className="flex items-center text-gray-400 hover:text-primary-900 font-black text-[9px] uppercase tracking-widest transition-colors">
        <ArrowLeft size={14} className="mr-2" /> Retour
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
             <span className="px-3 py-1 bg-primary-900 text-accent-400 text-[8px] font-black uppercase rounded-full">UC-PPP | {project.parentMinistry}</span>
             <span className="text-[8px] font-black text-gray-400 uppercase">{project.id}</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">{project.title}</h1>
          <div className="flex gap-4 text-[9px] font-bold text-gray-500 uppercase">
             <span className="flex items-center gap-1"><Building2 size={12}/> {project.authority}</span>
             <span className="text-primary-900 font-black flex items-center gap-1"><Clock size={12}/> {project.status}</span>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center min-w-[150px]">
          <span className="text-[8px] font-black text-gray-400 uppercase block tracking-widest">Budget CAPEX</span>
          <span className="text-xl font-black text-primary-900">{(project.capex/1000000).toLocaleString()} <small className="text-[10px]">M$</small></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-0.5">
            <button onClick={() => setActiveTab('flow')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'flow' ? 'bg-primary-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
              <RotateCcw size={16} /> Cycle de Vie
            </button>
            <button onClick={() => setActiveTab('ai')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'ai' ? 'bg-primary-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
              <Sparkles size={16} className={isAnalyzing ? 'animate-spin' : ''} /> Analyse Risque
            </button>
            <button onClick={() => setActiveTab('avis')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'avis' ? 'bg-primary-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
              <MessageSquare size={16} /> Registre Avis
            </button>
            <button onClick={() => setActiveTab('docs')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeTab === 'docs' ? 'bg-primary-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
              <FolderOpen size={16} /> Documents
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary-900/10 space-y-4">
             <h4 className="text-[9px] font-black uppercase text-primary-900 border-b border-gray-100 pb-2">Visa Technique</h4>
             <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs outline-none h-20" placeholder="Votre avis..." />
             <div className="flex flex-col gap-2">
                <button onClick={() => handleValidation('FAVORABLE')} className="w-full py-2 bg-emerald-600 text-white rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-emerald-700">Favorable</button>
                <button onClick={() => handleValidation('REJET')} className="w-full py-2 bg-red-50 text-red-600 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-red-100">Rejeté</button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-9">
           <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full">
              {activeTab === 'flow' && (
                <div className="space-y-8 animate-fade-in">
                   <div className="flex justify-between items-center"><h3 className="text-[10px] font-black text-primary-900 uppercase">Progression Réglementaire</h3></div>
                   <div className="relative px-4 pb-4">
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                      <div className="relative flex justify-between">
                          {steps.map((step, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-4 border-white shadow-md ${idx <= currentIndex ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                  {idx < currentIndex ? <CheckCircle2 size={16}/> : <FileCheck size={16}/>}
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">{step.label}</span>
                              </div>
                          ))}
                      </div>
                   </div>
                </div>
              )}
              {activeTab === 'ai' && (
                <div className="space-y-4 animate-fade-in">
                   <h3 className="text-[10px] font-black text-primary-900 uppercase flex items-center gap-2"><Sparkles size={16} className="text-accent-500" /> Analyse IA</h3>
                   {isAnalyzing ? <Loader2 size={24} className="animate-spin text-primary-600 mx-auto py-10" /> : <div className="text-[11px] text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 ai-content" dangerouslySetInnerHTML={{ __html: aiAnalysis || "Non disponible." }} />}
                </div>
              )}
              {activeTab === 'avis' && (
                <div className="space-y-4 animate-fade-in">
                   <h3 className="text-[10px] font-black text-primary-900 uppercase">Registre des Avis</h3>
                   <div className="space-y-2">
                      {project.approvalHistory.length > 0 ? project.approvalHistory.map((log, idx) => (
                        <div key={idx} className="p-3 rounded-xl border bg-gray-50 border-gray-100 flex justify-between items-center">
                           <div className="text-left"><p className="text-[9px] font-black text-primary-900">{log.actor}</p><p className="text-[8px] text-gray-400">{log.date}</p></div>
                           <span className={`px-2 py-0.5 text-[7px] font-black uppercase rounded-full ${log.action === 'REJET' ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>{log.action}</span>
                        </div>
                      )) : <p className="text-[9px] text-gray-300 uppercase py-10">Aucun avis enregistré</p>}
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
