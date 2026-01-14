
import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus, ProjectSector } from '../types';
import { 
  Search, Filter, Eye, Trash2, RotateCcw, ShieldCheck, Zap, AlertCircle, 
  Tag, Send, CheckCircle, XCircle, Microscope, MapPin, FolderOpen, 
  Landmark, Layers, Scale, Handshake, Building2, BadgeCheck, ShieldAlert,
  Clock, ChevronDown, UserCheck, ClipboardCheck, FileCheck, Lock, Globe, PlayCircle,
  FileClock
} from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  isAdmin: boolean;
  onDeleteProject?: (projectId: string) => void;
  onAddNewProject?: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, isAdmin, onDeleteProject, onAddNewProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('submission_desc');

  const getSubmissionDateTimestamp = (project: Project) => {
    const submissionLog = (project.approvalHistory || []).find(log => log.action === 'SUBMIT');
    const dateStr = submissionLog ? submissionLog.date : project.startDate;
    const timestamp = new Date(dateStr).getTime();
    return isNaN(timestamp) ? 0 : timestamp;
  };

  const filteredAndSortedProjects = useMemo(() => {
    return projects
      .filter(project => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            project.title.toLowerCase().includes(term) || 
            project.location.toLowerCase().includes(term) ||
            project.authority.toLowerCase().includes(term) ||
            project.parentMinistry.toLowerCase().includes(term);

        const matchesSector = filterSector === 'All' || project.sector === filterSector;
        const matchesStatus = filterStatus === 'All' || project.status === filterStatus;
        return matchesSearch && matchesSector && matchesStatus;
      })
      .sort((a, b) => {
        const timestampA = getSubmissionDateTimestamp(a);
        const timestampB = getSubmissionDateTimestamp(b);

        switch(sortBy) {
            case 'submission_desc': return timestampB - timestampA;
            case 'submission_asc': return timestampA - timestampB;
            case 'budget_desc': return (b.capex || 0) - (a.capex || 0);
            case 'budget_asc': return (a.capex || 0) - (b.capex || 0);
            case 'title_asc': return a.title.localeCompare(b.title);
            default: return 0;
        }
      });
  }, [projects, searchTerm, filterSector, filterStatus, sortBy]);

  const resetFilters = () => {
      setSearchTerm('');
      setFilterSector('All');
      setFilterStatus('All');
      setSortBy('submission_desc');
  };

  const getSectorialAvis = (project: Project) => {
    const avis = project.approvalHistory.find(log => 
        log.actor === project.parentMinistry || log.actor.includes('Ministère Sectoriel')
    );

    if (!avis) return { label: 'En attente', color: 'bg-gray-50 text-gray-400 border-gray-100', icon: <FileClock size={10}/> };
    
    switch(avis.action) {
        case 'FAVORABLE': return { label: 'Favorable', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <BadgeCheck size={10}/> };
        case 'RESERVE': return { label: 'Sous Réserve', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: <ShieldAlert size={10}/> };
        case 'REJET': return { label: 'Rejeté', color: 'bg-red-50 text-red-700 border-red-100', icon: <XCircle size={10}/> };
        default: return { label: 'En attente', color: 'bg-gray-50 text-gray-400 border-gray-100', icon: <FileClock size={10}/> };
    }
  };

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      // PHASE 1
      case ProjectStatus.SUBMITTED:
        return { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <FileClock size={12} />, label: 'En attente' };
      case ProjectStatus.P1_IDENTIFICATION:
        return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Search size={12} />, label: 'Identification' };
      case ProjectStatus.P1_SECTORIAL_VALIDATION:
        return { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <UserCheck size={12} />, label: 'Validation Sectorielle' };
      case ProjectStatus.P1_UC_CONFORMITY:
        return { color: 'bg-blue-600 text-white border-blue-700', icon: <ShieldCheck size={12} />, label: 'Avis UC-PPP' };
      case ProjectStatus.P1_PIP_INSCRIPTION: 
        return { color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: <FileCheck size={12} />, label: 'Inscrit PIP' };

      // PHASE 2
      case ProjectStatus.P2_FEASIBILITY_PREP:
        return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Microscope size={12} />, label: 'Études de Faisabilité' };
      case ProjectStatus.P2_MULTILATERAL_AVIS:
        return { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: <Layers size={12} />, label: 'Instruction 4 Organes' };
      case ProjectStatus.P2_BUDGET_PROGRAMMING:
        return { color: 'bg-amber-600 text-white border-amber-700', icon: <Landmark size={12} />, label: 'Prog. Budgétaire' };

      // PHASE 3
      case ProjectStatus.P3_DAO_PREP:
        return { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <FolderOpen size={12} />, label: 'Préparation DAO' };
      case ProjectStatus.P3_TENDERING:
        return { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: <Scale size={12} />, label: 'Appel d\'Offres' };
      case ProjectStatus.P3_EVALUATION:
        return { color: 'bg-indigo-200 text-indigo-900 border-indigo-400', icon: <ClipboardCheck size={12} />, label: 'Évaluation' };
      case ProjectStatus.P3_NEGOTIATION:
        return { color: 'bg-violet-600 text-white border-violet-700', icon: <Handshake size={12} />, label: 'Négociations' };
      case ProjectStatus.P3_VISA_UC_FINAL:
        return { color: 'bg-violet-500 text-white border-violet-600', icon: <Zap size={12} />, label: 'Visa Final UC' };
      case ProjectStatus.P3_APPROBATION:
        return { color: 'bg-primary-900 text-white border-primary-950', icon: <Lock size={12} />, label: 'Approbation Finale' };
      case ProjectStatus.P3_PUBLICATION:
        return { color: 'bg-primary-700 text-accent-400 border-primary-800', icon: <Globe size={12} />, label: 'Publication' };

      // AUTRES
      case ProjectStatus.ACTIVE: 
        return { color: 'bg-emerald-600 text-white border-emerald-700', icon: <PlayCircle size={12} />, label: 'En Exploitation' };
      case ProjectStatus.REJECTED:
        return { color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle size={12} />, label: 'Rejeté' };
      
      default: 
        return { color: 'bg-gray-100 text-gray-600', icon: <AlertCircle size={12} />, label: status.split(':')[0] };
    }
  };

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-900 rounded-2xl text-white shadow-lg">
            <FolderOpen size={28} />
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-black text-primary-900 tracking-tight uppercase">Suivi Analytique Pipeline</h2>
            <p className="text-sm text-gray-500 font-medium italic">Visibilité transverse du portefeuille national PPP.</p>
          </div>
        </div>
        {isAdmin && (
            <button onClick={onAddNewProject} className="px-6 py-2.5 bg-primary-700 text-white rounded-xl hover:bg-primary-800 transition-all shadow-lg font-bold flex items-center gap-2">
                <Tag size={18} /> Nouvelle Fiche
            </button>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-4 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Recherche..."
                    className="pl-11 pr-4 w-full rounded-xl border-gray-200 border py-3 text-xs font-bold focus:ring-4 focus:ring-primary-500/10 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="lg:col-span-3 relative">
                <select 
                    className="w-full appearance-none bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-[10px] font-black uppercase focus:outline-none pr-10"
                    value={filterSector}
                    onChange={(e) => setFilterSector(e.target.value)}
                >
                    <option value="All">Tous les secteurs</option>
                    {Object.values(ProjectSector).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="lg:col-span-3 relative">
                <select 
                    className="w-full appearance-none bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-[10px] font-black uppercase focus:outline-none pr-10"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="All">Toutes les phases</option>
                    {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="lg:col-span-2 relative">
              <button onClick={resetFilters} className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                <RotateCcw size={14} /> Reset
              </button>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Projet / Lieu</th>
                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Autorité (AC)</th>
                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Ministère Tutelle</th>
                <th className="px-6 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Avis Sectoriel</th>
                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">CAPEX (M$)</th>
                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Phase Actuelle</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredAndSortedProjects.length > 0 ? filteredAndSortedProjects.map((project) => {
                const status = getStatusConfig(project.status);
                const avis = getSectorialAvis(project);
                return (
                  <tr key={project.id} className="hover:bg-primary-50/30 transition-all cursor-pointer group" onClick={() => onSelectProject(project)}>
                    <td className="px-6 py-5">
                      <div className="flex flex-col text-left">
                          <span className="text-sm font-black text-primary-900 tracking-tighter uppercase leading-tight">{project.title}</span>
                          <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                            <MapPin size={10} /> {project.location}
                          </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-left">
                      <div className="flex items-center gap-2">
                         <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500"><Building2 size={12}/></div>
                         <span className="text-[10px] font-black text-gray-700 uppercase">{project.authority}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-left">
                      <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded-lg border border-primary-100 uppercase">{project.parentMinistry}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className={`px-2 py-1 inline-flex items-center gap-1.5 text-[8px] font-black uppercase rounded-full border shadow-sm ${avis.color}`}>
                          {avis.icon}
                          {avis.label}
                       </div>
                    </td>
                    <td className="px-6 py-5 text-left">
                      <span className="text-sm text-gray-900 font-black">{(project.capex / 1000000).toLocaleString('fr-FR')}</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-left">
                      <div className={`px-3 py-1.5 inline-flex items-center gap-2 text-[9px] font-black uppercase rounded-lg border shadow-sm ${status.color}`}>
                        {status.icon}
                        <span className="max-w-[120px] truncate">{status.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Search size={48} className="text-gray-200" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aucun projet ne correspond à ces critères</p>
                      <button onClick={resetFilters} className="text-[10px] font-black text-primary-600 uppercase tracking-widest underline decoration-2 underline-offset-4">Réinitialiser les filtres</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectList;
