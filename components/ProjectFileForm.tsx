
import React, { useState, useEffect } from 'react';
import { ProjectSector, Project, ProjectStatus, AuthorityType, Document } from '../types';
import { 
  Save, X, FileText, Map, DollarSign, Rocket, User, ChevronRight, 
  ChevronLeft, FolderOpen, Plus, Trash2, FileUp, Calendar, Layout, Info,
  Search, ShieldCheck, Building2, Landmark, ListChecks
} from 'lucide-react';

interface ProjectFileFormProps {
  onSave: (project: Partial<Project>) => void;
  onCancel: () => void;
  defaultAuthority?: string;
}

const ProjectFileForm: React.FC<ProjectFileFormProps> = ({ onSave, onCancel, defaultAuthority }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<Document['type']>('Fiche_Projet');
  
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    description: '',
    location: '',
    sector: ProjectSector.INFRASTRUCTURE,
    authority: defaultAuthority || '',
    parentMinistry: '',
    authorityType: AuthorityType.MINISTRY,
    status: ProjectStatus.SUBMITTED,
    alignment: '',
    priorityDegree: 'Moyen',
    purpose: '',
    expectedResults: '',
    activities: '',
    contractualForm: '',
    durationYears: 0,
    pppJustification: '',
    gpsCoordinates: '',
    impactZone: '',
    legalFramework: '',
    relatedProjects: '',
    capex: 0,
    publicContributionCapex: 0,
    privateContributionCapex: 0,
    opex: 0,
    publicContributionOpex: 0,
    privateContributionOpex: 0,
    totalCost: 0,
    estimatedRevenue: '',
    remunerationMode: '',
    developmentStage: 'Identification',
    nextStep: '',
    contactPerson: '',
    timeline: {
      studies: '',
      procurement: '',
      construction: '',
      operation: ''
    },
    progress: 5,
    documents: [],
  });

  // Calcul automatique du coût total du projet (1)+(2)
  useEffect(() => {
    const total = (formData.capex || 0) + (formData.opex || 0);
    if (total !== formData.totalCost) {
      setFormData(prev => ({ ...prev, totalCost: total }));
    }
  }, [formData.capex, formData.opex]);

  const tabs = [
    { id: 'header', label: 'En-tête', icon: Layout },
    { id: 'desc', label: 'Description', icon: FileText },
    { id: 'context', label: 'Contexte', icon: Map },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'exec', label: 'Mise en œuvre', icon: Rocket },
    { id: 'docs', label: 'Documents', icon: FolderOpen },
  ];

  const handleInputChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTimelineChange = (field: keyof NonNullable<Project['timeline']>, value: string) => {
    setFormData(prev => ({
      ...prev,
      timeline: { ...prev.timeline, [field]: value }
    }));
  };

  const handleAddDocument = () => {
    if (!docName.trim()) return;
    const newDoc: Document = {
      id: `new-doc-${Date.now()}`,
      name: docName,
      type: docType,
      url: '#',
      dateUploaded: new Date().toISOString().split('T')[0],
      author: formData.authority || 'AC'
    };
    setFormData(prev => ({ ...prev, documents: [...(prev.documents || []), newDoc] }));
    setDocName('');
  };

  const handleRemoveDoc = (id: string) => {
    setFormData(prev => ({ ...prev, documents: (prev.documents || []).filter(d => d.id !== id) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden animate-fade-in max-w-6xl mx-auto my-8 border border-gray-100 relative">
      {/* Header Form */}
      <div className="bg-primary-900 p-10 text-white relative">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
           <Landmark size={120} />
        </div>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-6">
            <div className="bg-accent-400 p-4 rounded-3xl text-primary-900 shadow-xl transform rotate-3 hover:rotate-0 transition-transform">
              <FileUp size={32} />
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Modèle de fiche de projet de PPP</h2>
              <p className="text-primary-300 text-[10px] font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                 <ShieldCheck size={14} className="text-accent-400" /> UNITE DE CONSEIL & DE COORDINATION DU PARTENARIAT PUBLIC-PRIVE (UC-PPP)
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-3 hover:bg-white/10 rounded-full transition-colors border border-white/10"><X size={28} /></button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-gray-50 border-b border-gray-200 overflow-x-auto no-scrollbar">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-3 py-6 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === idx ? 'bg-white text-primary-900 border-b-4 border-primary-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-12 text-left">
        
        {/* TAB 0: EN-TETE / IDENTIFICATION */}
        {activeTab === 0 && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-primary-900 uppercase tracking-widest mb-3 italic">Nom du projet</label>
                <input 
                  type="text" 
                  className="w-full bg-primary-50 border-2 border-primary-100 rounded-2xl p-6 text-xl font-black text-primary-900 focus:border-primary-500 outline-none transition-all shadow-inner"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Inscrire ici le nom complet du projet"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Autorité contractante ou porteuse du projet</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold focus:border-primary-500 outline-none"
                  value={formData.authority}
                  onChange={(e) => handleInputChange('authority', e.target.value)}
                  placeholder="Ex: Ministère de l'Énergie / SNEL"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 italic">Secteur</label>
                <select 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold focus:border-primary-500 outline-none appearance-none"
                  value={formData.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                >
                  {Object.values(ProjectSector).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: DESCRIPTION DU PROJET */}
        {activeTab === 1 && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-l-8 border-primary-900 pl-6 mb-10">
              <h3 className="text-2xl font-black text-primary-900 uppercase tracking-tight">DESCRIPTION DU PROJET</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Présentation succincte du projet</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-medium h-28 focus:border-primary-500 outline-none leading-relaxed"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="[Présenter succinctement la nature du projet]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Alignement avec les politiques publiques</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold focus:border-primary-500 outline-none"
                    value={formData.alignment}
                    onChange={(e) => handleInputChange('alignment', e.target.value)}
                    placeholder="[Préciser dans quelle(s) politique(s) publiques le projet s’insère]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Degré de priorité</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold focus:border-primary-500 outline-none"
                    value={formData.priorityDegree}
                    onChange={(e) => handleInputChange('priorityDegree', e.target.value)}
                    placeholder="[Degré de priorité]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Finalité du projet</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-medium h-24 focus:border-primary-500 outline-none leading-relaxed"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  placeholder="[Présenter l’objectif général et les objectifs spécifiques du projet, notamment le Service public servi...]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Résultats attendus</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-medium h-24 focus:border-primary-500 outline-none leading-relaxed"
                  value={formData.expectedResults}
                  onChange={(e) => handleInputChange('expectedResults', e.target.value)}
                  placeholder="[Lister les résultats attendus en termes quantitatifs et qualitatifs, aussi bien en termes d’infrastructures que de services]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Activités du projet</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-medium h-28 focus:border-primary-500 outline-none leading-relaxed"
                  value={formData.activities}
                  onChange={(e) => handleInputChange('activities', e.target.value)}
                  placeholder="[Préciser les composantes du projet envisagé en PPP : Conception, construction, exploitation, financement, maintenance...]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Forme contractuelle</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold focus:border-primary-500 outline-none"
                    value={formData.contractualForm}
                    onChange={(e) => handleInputChange('contractualForm', e.target.value)}
                    placeholder="[Type(s) de PPP ou autre contrat de la commande publique envisagé, justification]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Durée</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold focus:border-primary-500 outline-none"
                    value={formData.durationYears ? formData.durationYears.toString() : ''}
                    onChange={(e) => handleInputChange('durationYears', parseInt(e.target.value) || 0)}
                    placeholder="[Durée estimative du contrat comprenant l’ensemble des phases]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Justification du recours au PPP</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-medium h-28 focus:border-primary-500 outline-none leading-relaxed"
                  value={formData.pppJustification}
                  onChange={(e) => handleInputChange('pppJustification', e.target.value)}
                  placeholder="[Motifs de complexité du projet ou du fait que l’Autorité contractante n’est pas en mesure de mobiliser seule les fonds requis...]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTEXTE DU PROJET */}
        {activeTab === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-l-8 border-blue-600 pl-6 mb-10">
              <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tight">CONTEXTE DU PROJET</h3>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Site du projet</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold focus:border-primary-500 outline-none"
                    value={formData.gpsCoordinates}
                    onChange={(e) => handleInputChange('gpsCoordinates', e.target.value)}
                    placeholder="[Site géographique, coordonnées GPS]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Zone d’impact</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-bold focus:border-primary-500 outline-none"
                    value={formData.impactZone}
                    onChange={(e) => handleInputChange('impactZone', e.target.value)}
                    placeholder="[Zone, environnement et population impactée]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Cadre juridique</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-medium h-24 focus:border-primary-500 outline-none leading-relaxed"
                  value={formData.legalFramework}
                  onChange={(e) => handleInputChange('legalFramework', e.target.value)}
                  placeholder="[Lister les références des textes et réglementation sectorielle applicable]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Projets connexes</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-sm font-medium h-24 focus:border-primary-500 outline-none leading-relaxed"
                  value={formData.relatedProjects}
                  onChange={(e) => handleInputChange('relatedProjects', e.target.value)}
                  placeholder="[Autres projets ou programmes d’infrastructures en cours ou prévus – liés au projet envisagé]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INFORMATION FINANCIERE */}
        {activeTab === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-l-8 border-emerald-600 pl-6 mb-10 flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tight">INFORMATION FINANCIERE</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Calcul automatique du coût total du projet (1)+(2)</p>
              </div>
              <div className="bg-emerald-950 p-6 rounded-[32px] text-right border-b-8 border-accent-400 shadow-2xl">
                 <span className="text-[9px] font-black text-accent-400 uppercase tracking-[0.3em] block mb-1">Coût total du projet (1)+(2)</span>
                 <p className="text-3xl font-black text-white">{(formData.totalCost || 0).toLocaleString()} <small className="text-xs uppercase opacity-60 ml-2">USD</small></p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {/* Section 1: Investissements */}
               <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-200 space-y-6">
                  <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-4">
                     <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl"><Plus size={16} /></div>
                     <h4 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Coûts d’investissements estimés (1)</h4>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-primary-900 uppercase mb-2">Montant total de l'investissement (1)</label>
                    <input type="number" className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 text-lg font-black text-emerald-700 focus:border-emerald-500 outline-none" value={formData.capex} onChange={(e) => handleInputChange('capex', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-gray-200">
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase mb-2">Contribution Publique (1)</label>
                      <input type="number" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold" value={formData.publicContributionCapex} onChange={(e) => handleInputChange('publicContributionCapex', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase mb-2">Contribution Privée (1)</label>
                      <input type="number" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold" value={formData.privateContributionCapex} onChange={(e) => handleInputChange('privateContributionCapex', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
               </div>

               {/* Section 2: Exploitation & Maintenance */}
               <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-200 space-y-6">
                  <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-4">
                     <div className="p-2 bg-blue-100 text-blue-700 rounded-xl"><ListChecks size={16} /></div>
                     <h4 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Coûts d’O&M estimés (2)</h4>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-primary-900 uppercase mb-2">Montant total O&M (2)</label>
                    <input type="number" className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 text-lg font-black text-blue-700 focus:border-blue-500 outline-none" value={formData.opex} onChange={(e) => handleInputChange('opex', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-gray-200">
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase mb-2">Contribution Publique (2)</label>
                      <input type="number" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold" value={formData.publicContributionOpex} onChange={(e) => handleInputChange('publicContributionOpex', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-gray-400 uppercase mb-2">Contribution Privée (2)</label>
                      <input type="number" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold" value={formData.privateContributionOpex} onChange={(e) => handleInputChange('privateContributionOpex', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
               <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Revenus estimés du projet</label>
                  <textarea 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl p-5 text-sm font-medium h-24 focus:border-primary-500 outline-none leading-relaxed shadow-inner"
                    value={formData.estimatedRevenue}
                    onChange={(e) => handleInputChange('estimatedRevenue', e.target.value)}
                    placeholder="[Identifier et si possible estimer les sources de revenu du projet – indiquer le montant et la monnaie]"
                  />
               </div>
               <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Mode de rémunération du partenaire privé</label>
                  <textarea 
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl p-5 text-sm font-medium h-24 focus:border-primary-500 outline-none leading-relaxed shadow-inner"
                    value={formData.remunerationMode}
                    onChange={(e) => handleInputChange('remunerationMode', e.target.value)}
                    placeholder="[Indiquer mode de rémunération envisagé pour le partenaire privé, en ligne avec le type de PPP envisagé]"
                  />
               </div>
            </div>
          </div>
        )}

        {/* TAB 4: MISE EN OEUVRE ET CONTACT */}
        {activeTab === 4 && (
          <div className="space-y-10 animate-fade-in">
            <div className="border-l-8 border-amber-500 pl-6 mb-10">
              <h3 className="text-2xl font-black text-amber-900 uppercase tracking-tight">MISE EN ŒUVRE DU PROJET</h3>
            </div>

            <div className="bg-gray-50 p-10 rounded-[48px] border border-gray-200">
               <h4 className="text-[12px] font-black text-primary-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                 <Calendar size={22} className="text-amber-500" /> Chronogramme prévisionnel
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-5 rounded-2xl border border-gray-100">
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Etudes</label>
                   <input type="text" className="w-full bg-transparent border-none p-0 text-sm font-black text-primary-900 focus:ring-0" value={formData.timeline?.studies} onChange={(e) => handleTimelineChange('studies', e.target.value)} placeholder="[début] – [fin]" />
                 </div>
                 <div className="bg-white p-5 rounded-2xl border border-gray-100">
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Phase de passation et contractualisation</label>
                   <input type="text" className="w-full bg-transparent border-none p-0 text-sm font-black text-primary-900 focus:ring-0" value={formData.timeline?.procurement} onChange={(e) => handleTimelineChange('procurement', e.target.value)} placeholder="[début] – [fin]" />
                 </div>
                 <div className="bg-white p-5 rounded-2xl border border-gray-100">
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Phase de construction</label>
                   <input type="text" className="w-full bg-transparent border-none p-0 text-sm font-black text-primary-900 focus:ring-0" value={formData.timeline?.construction} onChange={(e) => handleTimelineChange('construction', e.target.value)} placeholder="[début] – [fin]" />
                 </div>
                 <div className="bg-white p-5 rounded-2xl border border-gray-100">
                   <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Phase d'exploitation</label>
                   <input type="text" className="w-full bg-transparent border-none p-0 text-sm font-black text-primary-900 focus:ring-0" value={formData.timeline?.operation} onChange={(e) => handleTimelineChange('operation', e.target.value)} placeholder="[début] – [fin]" />
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Etape de développement du projet</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl p-5 text-sm font-bold focus:border-primary-500 outline-none h-24 shadow-inner"
                  value={formData.developmentStage}
                  onChange={(e) => handleInputChange('developmentStage', e.target.value)}
                  placeholder="[Degré d’avancement de l’évaluation du projet : identification, préfaisabilité, faisabilité et autres études éventuelles]"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Prochaine étape envisagée</label>
                <textarea 
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl p-5 text-sm font-bold focus:border-primary-500 outline-none h-24 shadow-inner"
                  value={formData.nextStep}
                  onChange={(e) => handleInputChange('nextStep', e.target.value)}
                  placeholder="[Prochaine étape de développement du projet, notamment pour se conformer au cadre des PPP et calendrier envisagé]"
                />
              </div>
            </div>

            <div className="bg-primary-900 p-12 rounded-[50px] text-white space-y-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                 <User size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-[13px] font-black uppercase tracking-[0.4em] text-accent-400 mb-6 flex items-center gap-4">
                  <span className="w-12 h-1 bg-accent-400 rounded-full"></span> CONTACT
                </h3>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-60 mb-3 italic">Contact au sein de l'autorité contractante</label>
                <textarea 
                  className="w-full bg-white/10 border border-white/20 rounded-[32px] p-8 text-lg font-medium text-white placeholder-white/20 focus:border-accent-400 outline-none h-40 transition-all leading-relaxed"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  placeholder="[Nom et coordonnées de la personne responsable du projet au sein de l’autorité contractante]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SOURCES DOCUMENTAIRES */}
        {activeTab === 5 && (
          <div className="space-y-10 animate-fade-in">
             <div className="border-l-8 border-primary-900 pl-6 mb-10">
              <h3 className="text-2xl font-black text-primary-900 uppercase tracking-tight">SOURCES DOCUMENTAIRES DISPONIBLES</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase mt-3 italic leading-relaxed">[Lister les sources documentaires disponibles : titre, auteur, année et joindre ces documents à la fiche de projet]</p>
            </div>

             <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-200 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                   <div className="space-y-2">
                     <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Titre / Auteur / Année</label>
                     <input 
                      type="text" 
                      placeholder="Ex: Étude de pré-faisabilité, UC-PPP, 2024"
                      className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary-500 outline-none shadow-sm"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="block text-[9px] font-black text-gray-400 uppercase mb-2">Catégorie du document</label>
                     <select 
                      className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary-500 outline-none appearance-none shadow-sm"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as Document['type'])}
                     >
                       <option value="Fiche_Projet">Fiche de Projet (Modèle)</option>
                       <option value="Avis_Technique">Avis Technique / Sectoriel</option>
                       <option value="Etude_PreFais">Étude de Pré-faisabilité</option>
                       <option value="Etude_Fais">Étude de Faisabilité</option>
                       <option value="DAO">Document d'Appel d'Offres</option>
                       <option value="Contrat">Contrat Signé</option>
                     </select>
                   </div>
                </div>
                <button 
                  type="button"
                  onClick={handleAddDocument}
                  className="w-full py-5 bg-primary-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-4 shadow-2xl shadow-primary-900/30"
                >
                  <Plus size={18} /> Joindre la source documentaire
                </button>
             </div>

             <div className="space-y-6">
                {formData.documents && formData.documents.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {formData.documents.map((doc) => (
                         <div key={doc.id} className="bg-white p-6 rounded-[32px] border-2 border-gray-50 flex items-center justify-between group hover:border-primary-500 transition-all shadow-xl shadow-gray-200/20">
                            <div className="flex items-center gap-5">
                               <div className="p-4 bg-primary-50 text-primary-600 rounded-2xl transition-transform group-hover:scale-110 group-hover:bg-primary-900 group-hover:text-white"><FileText size={24} /></div>
                               <div>
                                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{doc.name}</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-2">
                                     <span className="w-2 h-2 rounded-full bg-accent-500"></span> {doc.type}
                                  </p>
                               </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveDoc(doc.id)} className="p-3 text-red-200 hover:text-red-600 transition-colors bg-red-50/0 hover:bg-red-50 rounded-2xl"><Trash2 size={20} /></button>
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="p-24 text-center bg-gray-50 rounded-[50px] border-4 border-dashed border-gray-100 flex flex-col items-center">
                      <FolderOpen size={64} className="text-gray-100 mb-6" />
                      <p className="text-[12px] font-black text-gray-300 uppercase tracking-[0.4em]">Aucune source documentaire disponible</p>
                      <p className="text-[10px] text-gray-200 font-bold uppercase mt-3 italic leading-relaxed">Veuillez lister les études, plans et textes réglementaires</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-16 pt-10 border-t border-gray-100 gap-8">
          <div className="flex items-center gap-10">
             <button
                type="button"
                onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
                className={`flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-gray-900'}`}
              >
                <ChevronLeft size={20} /> Retour
              </button>
          </div>

          <div className="flex gap-6 w-full sm:w-auto">
            {activeTab < tabs.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveTab(prev => Math.min(tabs.length - 1, prev + 1))}
                className="w-full sm:w-auto px-12 py-6 bg-primary-100 text-primary-900 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary-200 transition-all flex items-center justify-center gap-4 group"
              >
                Continuer <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                type="submit"
                className="w-full sm:w-auto px-16 py-6 bg-primary-900 text-white rounded-3xl text-[12px] font-black uppercase tracking-[0.5em] hover:bg-black transition-all shadow-2xl shadow-primary-900/40 flex items-center justify-center gap-5 group active:scale-95"
              >
                <Rocket size={24} className="text-accent-400 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /> Soumettre le projet
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProjectFileForm;
