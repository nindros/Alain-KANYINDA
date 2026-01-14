
import React from 'react';
import { Project, ProjectStatus, UserRole } from '../types';
import { CheckCircle, Clock, FileText, ArrowRight, AlertCircle, ShieldCheck, Send, Microscope, Filter, ChevronRight, Landmark, Gavel, Zap } from 'lucide-react';

interface ApprovalCenterProps {
  projects: Project[];
  currentUserRole: UserRole;
  onSelectProject: (project: Project) => void;
}

const ApprovalCenter: React.FC<ApprovalCenterProps> = ({ projects, currentUserRole, onSelectProject }) => {
  
  const getRelevantStatuses = (role: UserRole): ProjectStatus[] => {
    switch (role) {
      case UserRole.MINISTRY:
        return [ProjectStatus.SUBMITTED];
      case UserRole.COORDINATOR:
        // Fix: Using correct ProjectStatus properties for Phase 1 and Phase 2
        return [ProjectStatus.P1_UC_CONFORMITY, ProjectStatus.P2_FEASIBILITY_PREP, ProjectStatus.P3_VISA_UC_FINAL];
      case UserRole.VALIDATOR:
        return [ProjectStatus.P1_UC_CONFORMITY];
      case UserRole.FINANCE:
      case UserRole.BUDGET:
      case UserRole.SPATIAL_PLANNING:
      case UserRole.REGULATOR:
        return [ProjectStatus.P2_MULTILATERAL_AVIS];
      case UserRole.ANALYST: // DGCMP
        return [ProjectStatus.P3_DAO_PREP, ProjectStatus.P3_NEGOTIATION];
      default:
        return [];
    }
  };

  const relevantStatuses = getRelevantStatuses(currentUserRole);
  const pendingProjects = projects.filter(p => relevantStatuses.includes(p.status));

  return (
    <div className="p-6 animate-fade-in max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-primary-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-primary-600" size={32} /> Centre de Visas Techniques
          </h2>
          <p className="text-sm text-gray-500 mt-2 font-medium uppercase tracking-tight">
              Instruction multilatérale des dossiers PPP selon le manuel de procédures.
          </p>
        </div>
        <div className="bg-primary-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
            <span className="opacity-50 italic">Habilitation :</span> {currentUserRole}
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-10 py-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-black uppercase text-xs tracking-widest text-gray-500 italic">Dossiers en attente de votre visa</h3>
            <span className="text-[10px] font-black text-primary-600 bg-white px-4 py-1.5 rounded-full shadow-sm">{pendingProjects.length} En attente</span>
        </div>
        
        {pendingProjects.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-10 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Désignation Projet</th>
                            <th className="px-10 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Phase / État</th>
                            <th className="px-10 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Instruction</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {pendingProjects.map((project) => (
                            <tr key={project.id} className="hover:bg-primary-50/30 transition-all cursor-pointer group" onClick={() => onSelectProject(project)}>
                                <td className="px-10 py-6">
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 group-hover:bg-primary-900 group-hover:text-white transition-all shadow-inner">
                                            <FileText size={20} />
                                        </div>
                                        <div className="ml-5">
                                            <div className="text-sm font-black text-gray-900">{project.title}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">{project.authority}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <span className="px-4 py-2 inline-flex items-center text-[9px] font-black uppercase rounded-xl border bg-blue-50 text-blue-800 border-blue-100">
                                        <Clock size={12} className="mr-2" /> {project.status}
                                    </span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <button className="px-6 py-3 bg-primary-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 ml-auto shadow-lg shadow-primary-900/20">
                                        Analyser le dossier <ChevronRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="p-24 text-center">
                <Zap size={48} className="text-emerald-500 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Votre file d'attente est vide</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalCenter;