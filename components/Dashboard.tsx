
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Project, ProjectStatus, ProjectSector, UserRole } from '../types';
import { Target, Microscope, Gavel, ShieldCheck, AlertCircle, Users } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  userRole?: UserRole;
  userName?: string;
  pendingValidations?: number;
  onGoToAdmin?: () => void;
}

const COLORS = ['#1e3a8a', '#3b82f6', '#facc15', '#eab308', '#2563eb'];

const Dashboard: React.FC<DashboardProps> = ({ projects, userRole, userName, pendingValidations = 0, onGoToAdmin }) => {
  const stats = {
    p1: projects.filter(p => p.status.startsWith('P1') || p.status === ProjectStatus.SUBMITTED).length,
    p2: projects.filter(p => p.status.startsWith('P2')).length,
    p3: projects.filter(p => p.status.startsWith('P3')).length,
  };

  const totalCapex = projects.reduce((acc, p) => acc + (p.capex || 0), 0) / 1000000;
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.COORDINATOR;

  return (
    <div className="p-4 space-y-4 animate-fade-in max-w-7xl mx-auto">
      {/* ALERTE ADMIN */}
      {isAdmin && pendingValidations > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse-soft">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20">
                    <Users size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-red-800 uppercase tracking-tight">Nouvelles demandes d'accès</h3>
                    <p className="text-[10px] font-bold text-red-600">{pendingValidations} agent(s) en attente de validation par l'UC-PPP.</p>
                </div>
             </div>
             {onGoToAdmin && (
                <button 
                    onClick={onGoToAdmin}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg"
                >
                    Gérer les accès
                </button>
             )}
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-left">
          <h2 className="text-xl font-black text-primary-900 tracking-tighter uppercase">{userRole === UserRole.MINISTRY ? `Espace AC : ${userName}` : "Tableau de Bord UC-PPP"}</h2>
          <p className="text-gray-400 font-bold text-[8px] uppercase tracking-widest mt-1">Pilotage du Portefeuille National</p>
        </div>
        <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div>
              <span className="text-[8px] font-black text-gray-400 uppercase block tracking-widest">Valeur Portefeuille</span>
              <span className="text-xl font-black text-primary-900">{totalCapex.toLocaleString()} M <small className="text-[10px]">USD</small></span>
           </div>
           <div className="h-8 w-px bg-gray-100"></div>
           <div>
              <span className="text-[8px] font-black text-gray-400 uppercase block tracking-widest">Projets</span>
              <span className="text-xl font-black text-primary-900">{projects.length}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PhaseCard phase="01" title="Identification" count={stats.p1} icon={Target} border="border-blue-500" textColor="text-blue-600" />
        <PhaseCard phase="02" title="Structuration" count={stats.p2} icon={Microscope} border="border-amber-500" textColor="text-amber-600" />
        <PhaseCard phase="03" title="Passation" count={stats.p3} icon={Gavel} bg="bg-primary-900" border="border-accent-500" isDark />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
           <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <ShieldCheck size={14} className="text-primary-600" /> Flux d'Approbation
           </h3>
           <div className="space-y-2">
              {/* Fix: Using valid enum properties P1_SECTORIAL_VALIDATION and P2_UC_AVIS_CONFORME */}
              <AvisItem label="En attente Avis UC-PPP (P1)" total={projects.filter(p => p.status === ProjectStatus.P1_SECTORIAL_VALIDATION).length} color="bg-blue-600" />
              <AvisItem label="Instruction Organes (P2)" total={projects.filter(p => p.status === ProjectStatus.P2_UC_AVIS_CONFORME).length} color="bg-amber-500" />
              <AvisItem label="Signature / Approbation (P3)" total={projects.filter(p => p.status === ProjectStatus.P3_APPROBATION).length} color="bg-primary-900" />
           </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 self-start">Secteurs Porteurs</h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.values(ProjectSector).map(s => ({ name: s, value: projects.filter(p => p.sector === s).length })).filter(d => d.value > 0)}
                    innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value"
                  >
                    {COLORS.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '8px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-2">
                {Object.values(ProjectSector).map((s, idx) => {
                    const count = projects.filter(p => p.sector === s).length;
                    if (count === 0) return null;
                    return (
                        <div key={s} className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <span className="text-[8px] font-black text-gray-500 uppercase truncate max-w-[60px]">{s} ({count})</span>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

const PhaseCard = ({ phase, title, count, icon: Icon, bg, border, isDark }: any) => (
  <div className={`p-4 rounded-3xl border-b-4 shadow-sm group ${isDark ? bg : 'bg-white'} ${border}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-xl ${isDark ? 'bg-white/10 text-accent-400' : 'bg-gray-50 text-primary-600'}`}>
        <Icon size={18} />
      </div>
      <span className={`text-2xl font-black ${isDark ? 'text-white/10' : 'text-gray-100'}`}>{phase}</span>
    </div>
    <p className={`text-sm font-black mb-4 tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
    <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
      <span className={`text-[8px] font-black uppercase ${isDark ? 'text-primary-200' : 'text-gray-500'}`}>Dossiers</span>
      <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-primary-900'}`}>{count}</span>
    </div>
  </div>
);

const AvisItem = ({ label, total, color }: any) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
    <span className="text-[8px] font-black text-gray-700 uppercase tracking-tighter">{label}</span>
    <div className="flex items-center gap-3">
       <div className="h-1 w-16 rounded-full bg-gray-200 overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${Math.min(100, (total/10)*100)}%` }}></div>
       </div>
       <span className="text-xs font-black text-gray-900">{total}</span>
    </div>
  </div>
);

export default Dashboard;
