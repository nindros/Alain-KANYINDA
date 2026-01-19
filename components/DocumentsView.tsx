
import React, { useState, useMemo } from 'react';
import { Project, Document, ProjectSector } from '../types';
import { 
  Search, FileText, Filter, Download, Calendar, Building2, 
  Database, FolderOpen, Tag, ArrowUpRight, HardDrive, FileCheck
} from 'lucide-react';

interface DocumentsViewProps {
  projects: Project[];
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ projects }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterSector, setFilterSector] = useState<string>('All');

  const allDocuments = useMemo(() => {
    return projects.flatMap(p => (p.documents || []).map(d => ({
      ...d,
      projectTitle: p.title,
      projectId: p.id,
      projectSector: p.sector,
      projectAuthority: p.authority
    })));
  }, [projects]);

  const filteredDocs = allDocuments.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.projectTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || doc.type === filterType;
    const matchesSector = filterSector === 'All' || doc.projectSector === filterSector;
    return matchesSearch && matchesType && matchesSector;
  });

  const docTypes = Array.from(new Set(allDocuments.map(d => d.type)));
  const totalSize = filteredDocs.length * 2.5; // Mock size calculation

  return (
    <div className="p-4 lg:p-8 animate-fade-in max-w-7xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="bg-primary-900 rounded-[40px] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl border border-white/10">
         <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
           <Database size={280} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="text-left space-y-3">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-emerald-500 text-primary-900 rounded-2xl shadow-xl shadow-emerald-500/20"><FolderOpen size={32} /></div>
                 <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Banque Documentaire</h1>
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Archives Nationales des PPP</p>
                 </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-sm">
                    <p className="text-[8px] font-black text-white/40 uppercase mb-1 tracking-widest">Fichiers Indexés</p>
                    <p className="text-2xl font-black text-white">{allDocuments.length}</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-sm">
                    <p className="text-[8px] font-black text-white/40 uppercase mb-1 tracking-widest">Volume Estimé</p>
                    <p className="text-2xl font-black text-emerald-400">{totalSize.toFixed(1)} <span className="text-sm text-white/60">MB</span></p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
         <div className="md:col-span-5 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher un document ou un projet..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold outline-none focus:border-primary-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="md:col-span-3 relative">
            <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase outline-none appearance-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
               <option value="All">Tous les types</option>
               {docTypes.map(t => <option key={t as string} value={t as string}>{(t as string).replace('_', ' ')}</option>)}
            </select>
         </div>
         <div className="md:col-span-3 relative">
            <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase outline-none appearance-none"
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
            >
               <option value="All">Tous les secteurs</option>
               {Object.values(ProjectSector).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>
         <div className="md:col-span-1 flex justify-center">
            <button className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
               <Filter size={18} />
            </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
               <thead className="bg-gray-50/50">
                  <tr>
                     <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Document</th>
                     <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Projet Associé</th>
                     <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Métadonnées</th>
                     <th className="px-8 py-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Accès</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
                     <tr key={doc.id} className="hover:bg-primary-50/30 transition-all group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm group-hover:bg-primary-900 group-hover:text-white">
                                 <FileText size={20} />
                              </div>
                              <div>
                                 <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight mb-1">{doc.name}</p>
                                 <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[8px] font-bold uppercase tracking-wide">{doc.type.replace('_', ' ')}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-primary-900 line-clamp-1">{doc.projectTitle}</p>
                              <p className="text-[9px] font-medium text-gray-400 flex items-center gap-1.5"><Building2 size={10} /> {doc.projectAuthority}</p>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-gray-500 flex items-center gap-1.5"><Calendar size={10}/> {doc.dateUploaded}</span>
                              <span className="text-[9px] font-bold text-gray-400">Par: {doc.author}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button className="px-4 py-2 bg-gray-50 text-primary-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary-900 hover:text-white transition-all flex items-center gap-2 ml-auto border border-gray-200 hover:border-primary-900">
                              <Download size={12} /> Télécharger
                           </button>
                        </td>
                     </tr>
                  )) : (
                     <tr>
                        <td colSpan={4} className="py-24 text-center">
                           <div className="opacity-20 flex flex-col items-center">
                              <HardDrive size={64} className="text-gray-400 mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Aucun document trouvé</p>
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

export default DocumentsView;