
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { MapPin, Calendar, ChevronDown, ChevronUp, LogIn } from 'lucide-react';
import { generatePublicSummary } from '../services/geminiService';

interface PublicPortalProps {
  projects: Project[];
  // Added onBackToLogin to fix type error in App.tsx
  onBackToLogin?: () => void;
}

const PublicPortal: React.FC<PublicPortalProps> = ({ projects, onBackToLogin }) => {
  // Fix: ProjectStatus.P1_PLAN_VALIDATION does not exist, using P1_PIP_INSCRIPTION for public projects
  const publicProjects = projects.filter(p => [ProjectStatus.P1_PIP_INSCRIPTION, ProjectStatus.ACTIVE].includes(p.status));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Generate AI summary on expand if not exists
      if (!aiSummaries[id]) {
        setLoadingSummary(id);
        const project = projects.find(p => p.id === id);
        if (project) {
            const summary = await generatePublicSummary(project);
            setAiSummaries(prev => ({ ...prev, [id]: summary }));
        }
        setLoadingSummary(null);
      }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-primary-900 text-white py-16 px-6 text-center relative overflow-hidden">
        {onBackToLogin && (
          <button 
            onClick={onBackToLogin}
            className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
          >
            <LogIn size={14} /> Connexion Agents
          </button>
        )}
        <div className="absolute top-0 left-0 w-full h-full bg-opacity-20 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center z-0 opacity-20"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Transparence des Projets PPP</h1>
            <p className="text-lg text-primary-100 mb-8">
                Portail officiel de l'Unité de Conseil et de Coordination du Partenariat Public-Privé de la RDC.
                Découvrez comment nous modernisons les infrastructures du pays.
            </p>
            <div className="flex justify-center gap-8">
                <div className="text-center">
                    <span className="block text-3xl font-bold text-accent-400">{publicProjects.length}</span>
                    <span className="text-sm opacity-80">Projets Publics</span>
                </div>
                 <div className="text-center">
                    <span className="block text-3xl font-bold text-accent-400">
                        {(publicProjects.reduce((acc, p) => acc + p.capex, 0) / 1000000000).toFixed(1)} Md$
                    </span>
                    <span className="text-sm opacity-80">Investissement Global</span>
                </div>
            </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 border-l-4 border-accent-500 pl-4">Projets en Cours & Réalisés</h2>
        
        <div className="space-y-6">
            {publicProjects.map(project => (
                <div key={project.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="p-6 cursor-pointer" onClick={() => toggleExpand(project.id)}>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-primary-900">{project.title}</h3>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded uppercase tracking-wide font-semibold">{project.sector}</span>
                                </div>
                                <div className="flex items-center text-gray-500 text-sm gap-4">
                                    <span className="flex items-center"><MapPin size={14} className="mr-1"/> {project.location}</span>
                                    <span className="flex items-center"><Calendar size={14} className="mr-1"/> Début: {project.startDate}</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                {expandedId === project.id ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
                            </div>
                        </div>
                    </div>

                    {expandedId === project.id && (
                        <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100 animate-fade-in">
                             <div className="mt-4">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Résumé Citoyen (IA)</h4>
                                {loadingSummary === project.id ? (
                                    <div className="text-sm text-gray-500 italic">Génération du résumé simplifié en cours...</div>
                                ) : (
                                    <p className="text-gray-600 text-sm leading-relaxed border-l-2 border-accent-400 pl-3">
                                        {aiSummaries[project.id] || project.description}
                                    </p>
                                )}
                             </div>
                             
                             <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-3 rounded border border-gray-200">
                                    <span className="block text-xs text-gray-400 uppercase">Autorité</span>
                                    <span className="font-medium text-gray-800 text-sm">{project.authority}</span>
                                </div>
                                <div className="bg-white p-3 rounded border border-gray-200">
                                    <span className="block text-xs text-gray-400 uppercase">Partenaire</span>
                                    <span className="font-medium text-gray-800 text-sm">{project.privatePartner || 'N/A'}</span>
                                </div>
                                <div className="bg-white p-3 rounded border border-gray-200">
                                    <span className="block text-xs text-gray-400 uppercase">Avancement</span>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div className="bg-green-500 h-2 rounded-full" style={{width: `${project.progress}%`}}></div>
                                    </div>
                                    <span className="text-xs text-right block mt-0.5">{project.progress}%</span>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-500 text-sm">
        <p>© 2024 UC-PPP République Démocratique du Congo. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default PublicPortal;
