
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Project, ProjectStatus, ProjectSector, UserRole } from '../types';
import { Target, Microscope, Gavel, ShieldCheck, FileText, Landmark } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  userRole?: UserRole;
  userName?: string;
}

const COLORS = ['#1e3a8a', '#3b82f6', '#facc15', '#eab308', '#2563eb'];

const Dashboard: React.FC<DashboardProps> = ({ projects, userRole, userName }) => {
  const stats = {
    p1: projects.filter(p => p.status.startsWith('P1') || p.status === ProjectStatus.SUBMITTED).length,
    p2: projects.filter(p => p.status.startsWith('P2')).length,
    p3: projects.filter(p => p.status.startsWith('P3')).length,
    active: projects.filter(p => p.status === ProjectStatus.ACTIVE).length
  };

  const totalCapex = projects.reduce((acc, p) => acc + (p.capex || 0), 0) / 1000000;

  return (
    <div className="p-6 space-y-8 animate-fade-in max-w-7xl mx-auto text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-primary-900 tracking-tighter uppercase leading-none">
            {userRole === UserRole.MINISTRY ? `Espace AC : ${userName}` : "Espace Décisionnel UC-PPP"}
          </h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2 italic">
            {userRole === UserRole.MINISTRY 
              ? "Suivi exclusif de votre portefeuille de projets" 
              : "Plateforme Numérique de Pilotage du Portefeuille National"}
          </p>
        </div>
        <div className="bg-white px-8 py-4 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-6">
           <div>
              <span className="text-[9px] font-black text-gray-400 uppercase block tracking-widest">Valeur visible</span>
              <span className="text-2xl font-black text-primary-900">{totalCapex.toLocaleString()} M <small className="text-xs">USD</small></span>
           </div>
           <div className="h-10 w-px bg-gray-100"></div>
           <div>
              <span className="text-[9px] font-black text-gray-400 uppercase block tracking-widest">Projets</span>
              <span className="text-2xl font-black text-primary-900">{projects.length}</span>
           </div>
        </div>
      </div>

      {/* Les 3 Phases - Big Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PhaseCard 
          phase="01" 
          title="Identification" 
          label="Phase 1" 
          count={stats.p1} 
          icon={Target} 
          color="blue" 
          bg="bg-blue-50" 
          border="border-blue-500" 
          textColor="text-blue-600" 
        />
        <PhaseCard 
          phase="02" 
          title="Étude & Structuration" 
          label="Phase 2" 
          count={stats.p2} 
          icon={Microscope} 
          color="amber" 
          bg="bg-amber-50" 
          border="border-amber-500" 
          textColor="text-amber-600" 
        />
        <PhaseCard 
          phase="03" 
          title="Passation des Contrats" 
          label="Phase 3" 
          count={stats.p3} 
          icon={Gavel} 
          color="primary" 
          bg="bg-primary-900" 
          border="border-accent-500" 
          textColor="text-white" 
          isDark 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-3">
             <ShieldCheck size={16} className="text-primary-600" /> Flux d'Approbation Actuels
           </h3>
           <div className="space-y-4">
              <AvisItem label="En attente Avis UC-PPP (P1)" total={projects.filter(p => p.status === ProjectStatus.P1_UC_CONFORMITY).length} color="bg-blue-600" max={10} />
              <AvisItem label="Instruction Multilatérale (P2)" total={projects.filter(p => p.status === ProjectStatus.P2_MULTILATERAL_AVIS).length} color="bg-amber-500" max={10} />
              <AvisItem label="Validation finale / Signature (P3)" total={projects.filter(p => p.status === ProjectStatus.P3_APPROBATION).length} color="bg-primary-900" max={10} />
           </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 self-start">Répartition par Secteur</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.values(ProjectSector).map(s => ({ name: s, value: projects.filter(p => p.sector === s).length })).filter(d => d.value > 0)}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {COLORS.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
                {Object.values(ProjectSector).map((s, idx) => {
                    const count = projects.filter(p => p.sector === s).length;
                    if (count === 0) return null;
                    return (
                        <div key={s} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">{s} ({count})</span>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

const PhaseCard = ({ phase, title, label, count, icon: Icon, bg, border, textColor, isDark }: any) => (
  <div className={`p-8 rounded-[40px] border-b-8 shadow-sm transition-all hover:shadow-2xl group ${isDark ? bg : 'bg-white'} ${border}`}>
    <div className="flex justify-between items-start mb-8">
      <div className={`p-4 rounded-[20px] transition-transform group-hover:scale-110 ${isDark ? 'bg-white/10 text-accent-400' : 'bg-gray-50 text-primary-600'}`}>
        <Icon size={24} />
      </div>
      <span className={`text-4xl font-black ${isDark ? 'text-white/5' : 'text-gray-50'}`}>{phase}</span>
    </div>
    <h3 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-primary-300' : 'text-gray-400'}`}>{label}</h3>
    <p className={`text-xl font-black mb-6 tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
    <div className={`flex items-center justify-between p-5 rounded-[24px] ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
      <span className={`text-[10px] font-black uppercase tracking-tighter ${isDark ? 'text-primary-200' : 'text-gray-500'}`}>Dossiers actifs</span>
      <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-primary-900'}`}>{count}</span>
    </div>
  </div>
);

const AvisItem = ({ label, total, color, max }: { label: string, total: number, color: string, max: number }) => (
  <div className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[24px] border border-gray-100 hover:bg-white transition-all group">
    <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">{label}</span>
    <div className="flex items-center gap-4">
       <div className="h-1.5 w-24 rounded-full bg-gray-200 overflow-hidden">
          <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${Math.min(100, (total/max)*100)}%` }}></div>
       </div>
       <span className="text-sm font-black text-gray-900 group-hover:scale-125 transition-transform">{total}</span>
    </div>
  </div>
);

export default Dashboard;
