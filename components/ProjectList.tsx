
import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus, ProjectSector } from '../types';
import { 
  Search, Filter, RotateCcw, ShieldCheck, Zap, AlertCircle, 
  Tag, XCircle, Microscope, MapPin, FolderOpen, 
  Building2, BadgeCheck, ShieldAlert, ChevronDown, UserCheck, 
  FileCheck, Lock, Globe, PlayCircle, FileClock, Landmark
} from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  isAdmin: boolean;
  onDeleteProject?: (projectId: string) => void;
  onAddNewProject?: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, isAdmin, onAddNewProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterMinistry, setFilterMinistry] = useState<string>('All');

  // Extraction dynamique des ministères uniques présents dans la liste des projets
  const uniqueMinistries = useMemo(() => {
    const ministries = projects.map(p => p.parentMinistry).filter(m => m && m.trim() !== '');
    return Array.from(new Set(ministries)).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = project.title.toLowerCase().includes(term) || project.location.toLowerCase().includes(term);
      const matchesSector = filterSector === 'All' || project.sector === filterSector;
      const matchesStatus = filterStatus === 'All' || project.status === filterStatus;
      const matchesMinistry = filterMinistry === 'All' || project.parentMinistry === filterMinistry;
      
      return matchesSearch && matchesSector && matchesStatus && matchesMinistry;
    });
  }, [projects, searchTerm, filterSector, filterStatus, filterMinistry]);

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.SUBMITTED: return { color: 'bg-slate-50 text-slate-600', icon: <FileClock size={10} />, label: 'En attente' };
      // Fix: Using valid enum property P1_SECTORIAL_VALIDATION
      case ProjectStatus.P1_SECTORIAL_VALIDATION: return { color: 'bg-blue-600 text-white', icon: <ShieldCheck size={10} />, label: 'Avis UC-PPP' };
      case ProjectStatus.ACTIVE: return { color: 'bg-emerald-600 text-white', icon: <PlayCircle size={10} />, label: 'Exploitation' };
      case ProjectStatus.REJECTED: return { color: 'bg-red-50 text-red-700', icon: <XCircle size={10} />, label: 'Rejeté' };
      default: return { color: 'bg-gray-50 text-gray-600', icon: <FileCheck size={10} />, label: status.split(':')[0] };
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterSector('All');
    setFilterStatus('All');
    setFilterMinistry('All');
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in text-left">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-900 rounded-xl text-white shadow-lg"><FolderOpen size={20} /></div>
          <div>
            <h2 className="text-lg font-black text-primary-900 tracking-tight uppercase leading-none">Pipeline National</h2>
            <p className="text-[8px] text-gray-500 font-medium uppercase mt-1">Visibilité transverse du portefeuille</p>
          </div>
        </div>
        {isAdmin && (
            <button onClick={onAddNewProject} className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                <Tag size={14} /> Nouvelle Fiche
            </button>
        )}
      </div>

      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-2">
            {/* Recherche */}
            <div className="md:col-span-3 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Recherche..." className="pl-9 pr-3 w-full rounded-xl border-gray-200 border py-2 text-[10px] font-bold outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* Filtre Ministère (Nouveau) */}
            <div className="md:col-span-3 relative">
                <Landmark size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select 
                  className="w-full appearance-none bg-gray-50 border border-gray-200 pl-9 pr-3 py-2 rounded-xl text-[9px] font-black uppercase outline-none truncate" 
                  value={filterMinistry} 
                  onChange={(e) => setFilterMinistry(e.target.value)}
                >
                    <option value="All">Tous Ministères</option>
                    {uniqueMinistries.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Filtre Secteur */}
            <div className="md:col-span-3 relative">
                <select className="w-full appearance-none bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-[9px] font-black uppercase outline-none" value={filterSector} onChange={(e) => setFilterSector(e.target.value)}>
                    <option value="All">Tous Secteurs</option>
                    {Object.values(ProjectSector).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Filtre Phase + Reset */}
            <div className="md:col-span-3 relative flex gap-2">
                <select className="flex-1 appearance-none bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-[9px] font-black uppercase outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">Toutes Phases</option>
                    {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleResetFilters} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200" title="Réinitialiser les filtres"><RotateCcw size={14} /></button>
            </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-5 py-3 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Projet</th>
                <th className="px-5 py-3 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Autorité & Tutelle</th>
                <th className="px-5 py-3 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Budget (M$)</th>
                <th className="px-5 py-3 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Phase</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredProjects.length > 0 ? filteredProjects.map((project) => {
                const status = getStatusConfig(project.status);
                return (
                  <tr key={project.id} className="hover:bg-primary-50/50 transition-all cursor-pointer group" onClick={() => onSelectProject(project)}>
                    <td className="px-5 py-3">
                      <div className="flex flex-col text-left">
                          <span className="text-[11px] font-black text-primary-900 tracking-tight uppercase leading-tight truncate max-w-[200px]">{project.title}</span>
                          <span className="text-[9px] text-gray-400 font-bold flex items-center gap-1"><MapPin size={8} /> {project.location}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-left">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-700 uppercase flex items-center gap-2">
                            <Building2 size={10} className="text-gray-300"/> {project.authority}
                          </span>
                          {project.parentMinistry && (
                            <span className="text-[8px] font-bold text-gray-400 uppercase pl-4">
                               Tutelle: {project.parentMinistry}
                            </span>
                          )}
                       </div>
                    </td>
                    <td className="px-5 py-3 text-left">
                      <span className="text-xs text-gray-900 font-black">{(project.capex / 1000000).toLocaleString('fr-FR')}</span>
                    </td>
                    <td className="px-5 py-3 text-left">
                      <div className={`px-2 py-1 inline-flex items-center gap-1.5 text-[8px] font-black uppercase rounded-lg border shadow-sm ${status.color}`}>
                        {status.icon} <span className="max-w-[100px] truncate">{status.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-[9px] font-black text-gray-300 uppercase tracking-widest">Aucun projet trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectList;
