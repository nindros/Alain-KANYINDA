
import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus, UserRole } from '../types';
import { 
  CheckCircle, Clock, FileText, ArrowRight, AlertCircle, ShieldCheck, 
  Send, Microscope, Filter, ChevronRight, Landmark, Gavel, Zap, 
  Search, Eye, ShieldAlert, BadgeCheck, PenTool, LayoutDashboard,
  Target, Activity
} from 'lucide-react';

interface ApprovalCenterProps {
  projects: Project[];
  currentUserRole: UserRole;
  currentUserName: string;
  onSelectProject: (project: Project) => void;
}

const ApprovalCenter: React.FC<ApprovalCenterProps> = ({ projects, currentUserRole, currentUserName, onSelectProject }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'consultation' | 'veille'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Rôles ayant droit à la veille stratégique
  const hasVeilleAccess = [UserRole.VALIDATOR, UserRole.COORDINATOR, UserRole.ADMIN, UserRole.FINANCE, UserRole.BUDGET].includes(currentUserRole);

  const getRelevantStatuses = (role: UserRole): ProjectStatus[] => {
    switch (role) {
      case UserRole.MINISTRY: return [ProjectStatus.SUBMITTED, ProjectStatus.P2_FEASIBILITY];
      case UserRole.COORDINATOR: return [
        ProjectStatus.P1_SECTORIAL_VALIDATION, 
        ProjectStatus.P1_UC_AVIS_CONFORME, 
        ProjectStatus.P2_UC_AVIS_CONFORME, 
        ProjectStatus.P3_NEGOTIATION,
        ProjectStatus.P3_VISA_UC_FINAL
      ];
      case UserRole.VALIDATOR: return [ProjectStatus.P1_PLAN_VALIDATION]; 
      case UserRole.FINANCE:
      case UserRole.BUDGET:
        // Inclusion large de la Phase 2 pour Finances/Budget afin de voir les dossiers dès la faisabilité
        return [ProjectStatus.P2_FEASIBILITY, ProjectStatus.P2_UC_AVIS_CONFORME, ProjectStatus.P2_BUDGET_PROGRAMMING];
      case UserRole.SPATIAL_PLANNING:
      case UserRole.REGULATOR: return [ProjectStatus.P2_UC_AVIS_CONFORME]; // Phase 2: Avis transversaux
      case UserRole.ANALYST: return [ProjectStatus.P3_PREP_DAO, ProjectStatus.P3_DGCMP_ANO];
      case UserRole.ADMIN: return [ProjectStatus.P3_APPROBATION];
      default: return [];
    }
  };

  const relevantStatuses = getRelevantStatuses(currentUserRole);

  const pendingProjects = useMemo(() => {
    return projects.filter(p => {
      const lastLog = p.approvalHistory.length > 0 ? p.approvalHistory[p.approvalHistory.length - 1] : null;
      const isReserved = lastLog?.action === 'RESERVE';
      const isOwner = p.authority === currentUserName || (currentUserRole === UserRole.COORDINATOR && p.authority === 'UC-PPP');
      const isMyStepTurn = relevantStatuses.includes(p.status) && !isReserved;
      
      // Cas spécifique Tutelle
      const isMyTutelle = currentUserRole === UserRole.MINISTRY ? p.parentMinistry === currentUserName : true;
      
      // Cas spécifique Correction
      const isMyCorrectionTurn = isReserved && isOwner;

      return (isMyStepTurn && isMyTutelle) || isMyCorrectionTurn;
    });
  }, [projects, currentUserRole, currentUserName, relevantStatuses]);

  const veilleProjects = useMemo(() => {
    return projects.filter(p => p.status === ProjectStatus.SUBMITTED || p.status === ProjectStatus.P2_FEASIBILITY);
  }, [projects]);

  const consultationProjects = useMemo(() => {
    return projects.filter(p => 
      ![ProjectStatus.ACTIVE, ProjectStatus.REJECTED].includes(p.status) &&
      !pendingProjects.some(pp => pp.id === p.id)
    );
  }, [projects, pendingProjects]);

  const displayList = activeTab === 'pending' ? pendingProjects : (activeTab === 'veille' ? veilleProjects : consultationProjects);

  return (
    <div className="p-4 lg:p-8 animate-fade-in max-w-7xl mx-auto space-y-10 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="text-left space-y-2">
          <h2 className="text-3xl font-black text-primary-900 tracking-tighter flex items-center gap-4">
            <div className="p-3 bg-primary-900 text-accent-400 rounded-2xl shadow-xl"><ShieldCheck size={32} /></div>
            Centre de Visas & Habilitations
          </h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] ml-2">
              Instruction multilatérale des dossiers (Décret PPP 2025)
          </p>
        </div>
        <div className="bg-white p-2 rounded-[24px] shadow-xl border border-gray-100 flex items-center gap-4">
            <div className="px-6 py-3 bg-primary-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3">
                <Landmark size={14} className="text-accent-400" /> {currentUserRole}
            </div>
            {currentUserRole === UserRole.VALIDATOR && (
                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 mr-2">Inscription PIP</span>
            )}
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-100">
          {[
            {id: 'pending', label: 'Actions Requises', count: pendingProjects.length, color: 'text-primary-900', bar: 'bg-primary-900'},
            {id: 'veille', label: 'Veille Entrante', count: veilleProjects.length, color: 'text-blue-600', bar: 'bg-blue-600', hidden: !hasVeilleAccess},
            {id: 'consultation', label: 'Registre Global', count: consultationProjects.length, color: 'text-gray-500', bar: 'bg-gray-400'},
          ].filter(t => !t.hidden).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`pb-5 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === t.id ? t.color : 'text-gray-400 hover:text-gray-600'}`}>
              {t.label} ({t.count})
              {activeTab === t.id && <div className={`absolute bottom-0 left-0 w-full h-1.5 ${t.bar} rounded-full`}></div>}
            </button>
          ))}
      </div>

      <div className="bg-white rounded-[50px] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-12 py-8 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-gray-500 italic flex items-center gap-4">
                {activeTab === 'veille' ? <Target size={18} className="text-blue-600" /> : <Activity size={18} className="text-primary-600" />}
                {activeTab === 'pending' ? 'Visas en attente de votre signature' : (activeTab === 'veille' ? 'Dossiers entrants pour pré-analyse' : 'Portefeuille en cours d\'instruction')}
            </h3>
            <div className="relative w-full md:w-80">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Chercher un identifiant..." className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-14 pr-6 py-4 text-[11px] font-bold outline-none focus:border-primary-500 transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </div>
        
        {displayList.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-12 py-6 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Dossier & Identification</th>
                            <th className="px-12 py-6 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Phase Légale</th>
                            <th className="px-12 py-6 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {displayList.map((project) => (
                            <tr key={project.id} className="hover:bg-primary-50/40 transition-all cursor-pointer group" onClick={() => onSelectProject(project)}>
                                <td className="px-12 py-8 text-left">
                                    <div className="flex items-center">
                                        <div className={`h-16 w-16 rounded-[24px] flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110 ${activeTab === 'veille' ? 'bg-blue-600 text-white' : 'bg-primary-900 text-white'}`}>
                                            <FileText size={24} />
                                        </div>
                                        <div className="ml-6 text-left space-y-1">
                                            <div className="text-sm font-black text-gray-900 uppercase tracking-tight">{project.title}</div>
                                            <div className="text-[10px] text-gray-400 font-black uppercase flex items-center gap-2">
                                              {project.authority} <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span> {project.sector}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-12 py-8 text-left">
                                    <div className="flex flex-col gap-2">
                                      <span className={`px-4 py-2 inline-flex items-center text-[9px] font-black uppercase rounded-xl border-2 w-fit ${
                                          project.status.includes('P1') ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                                          project.status.includes('P2') ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-800 border-blue-100'
                                      }`}>
                                          <Clock size={12} className="mr-2" /> 
                                          {project.status.split(':')[0]}
                                      </span>
                                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest italic">{project.status.split(':')[1]}</p>
                                    </div>
                                </td>
                                <td className="px-12 py-8 text-right">
                                    <button className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-4 ml-auto shadow-xl ${
                                        activeTab === 'pending' ? 'bg-primary-900 text-white hover:bg-black shadow-primary-900/20' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {activeTab === 'pending' ? 'Dossier Technique' : 'Consulter'} <ChevronRight size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="py-48 text-center opacity-20">
                <LayoutDashboard size={80} className="mx-auto mb-6 text-primary-900" />
                <p className="text-primary-900 font-black uppercase text-sm tracking-[0.5em]">Registre Vierge</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalCenter;
