
import React from 'react';
import { 
  LayoutDashboard, X, Target, Microscope, ShieldCheck, 
  Gavel, Users, LogOut, Search, Settings, ChevronRight, Database,
  Lock, ShieldAlert
} from 'lucide-react';
import { UserRole, User, Project, ProjectStatus, UserProfile } from '../types';

interface SidebarProps {
  user: User | null;
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onLogout: () => void;
  projects?: Project[];
  profiles?: UserProfile[];
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, setActiveView, isOpen, toggleSidebar, onLogout, projects = [], profiles = [] }) => {
  const getCounts = () => ({
    p1: projects.filter(p => p.status.startsWith('P1') || p.status === ProjectStatus.SUBMITTED).length,
    p2: projects.filter(p => p.status.startsWith('P2')).length,
    p3: projects.filter(p => p.status.startsWith('P3')).length,
    // Fix: Using valid enum properties P1_SECTORIAL_VALIDATION and P2_UC_AVIS_CONFORME
    approvals: projects.filter(p => [ProjectStatus.SUBMITTED, ProjectStatus.P1_SECTORIAL_VALIDATION, ProjectStatus.P2_UC_AVIS_CONFORME, ProjectStatus.P3_VISA_UC_FINAL].includes(p.status)).length,
    pendingHabilitations: profiles.filter(p => p.status === 'Inactive').length
  });

  const counts = getCounts();
  const currentUserRole = user?.role || UserRole.PUBLIC;

  const sections: {
    title: string;
    color?: string;
    items: {
      id: string;
      label: string;
      icon: any;
      roles: UserRole[];
      badge?: number;
      badgeColor?: string;
    }[];
  }[] = [
    { title: "PILOTAGE", items: [
      { id: 'dashboard', label: 'Portefeuille National', icon: LayoutDashboard, roles: Object.values(UserRole).filter(r => r !== UserRole.PUBLIC) },
      { id: 'approvals', label: 'Visas Techniques', icon: ShieldCheck, roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ANALYST, UserRole.VALIDATOR, UserRole.FINANCE, UserRole.BUDGET], badge: counts.approvals },
    ]},
    { title: "CYCLES DE VIE", color: "text-blue-400", items: [
      { id: 'projects', label: 'Phase 1: Identification', icon: Search, roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MINISTRY, UserRole.VALIDATOR], badge: counts.p1 },
      { id: 'studies', label: 'Phase 2: Structuration', icon: Microscope, roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MINISTRY, UserRole.FINANCE, UserRole.BUDGET], badge: counts.p2 },
      { id: 'procurement', label: 'Phase 3: Passation', icon: Gavel, roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MINISTRY, UserRole.ANALYST], badge: counts.p3 },
    ]},
    { title: "ADMINISTRATION UC-PPP", items: [
      { 
        id: 'admin', 
        label: 'Administration (Accès)', // Renommé pour clarté
        icon: Lock, 
        roles: [UserRole.ADMIN, UserRole.COORDINATOR], 
        badge: counts.pendingHabilitations,
        badgeColor: 'bg-red-600 animate-pulse ring-4 ring-red-600/20' 
      },
      { id: 'documents', label: 'Banque Documentaire', icon: Database, roles: Object.values(UserRole).filter(r => r !== UserRole.PUBLIC) },
    ]}
  ];

  return (
    <>
      <div className={`fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={toggleSidebar} />
      <div className={`fixed top-0 left-0 z-30 h-full w-72 bg-[#0a192f] text-white transform transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col border-r border-white/5`}>
        <div className="flex items-center justify-between h-20 px-6 bg-[#061021] border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center text-primary-900 font-black text-sm">UC</div>
            <div className="text-left">
              <span className="text-[10px] font-black tracking-tighter block leading-none">UC-PPP RDC</span>
              <span className="text-[7px] font-bold text-accent-400 uppercase tracking-widest mt-1 block">Plateforme Officielle</span>
            </div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-white/50"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-hide">
          {sections.map((section, sIdx) => {
            const visibleItems = section.items.filter(item => item.roles.includes(currentUserRole));
            if (visibleItems.length === 0) return null;
            return (
              <div key={sIdx} className="space-y-2">
                <p className={`px-4 text-[7px] font-black uppercase tracking-[0.3em] ${section.color || 'text-white/30'}`}>{section.title}</p>
                <nav className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <button key={item.id} onClick={() => { setActiveView(item.id); if (window.innerWidth < 1024) toggleSidebar(); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${activeView === item.id ? 'bg-primary-600 text-white shadow-lg border border-white/10' : 'text-primary-200 hover:bg-white/5'}`}
                    >
                      <div className="flex items-center">
                        <item.icon size={14} className={`mr-3 ${activeView === item.id ? 'text-accent-400' : 'text-primary-500'}`} />
                        <span className="font-bold text-[9px] uppercase tracking-tight">{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded text-white ${item.badgeColor || 'bg-accent-500 text-primary-900'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-[#061021]/60 border-t border-white/5">
          <div className="flex items-center space-x-3 mb-4 p-2.5 bg-white/5 rounded-xl border border-white/5 text-left">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-[10px]">{user?.name.charAt(0)}</div>
            <div className="overflow-hidden">
              <p className="text-[9px] font-black text-white truncate uppercase">{user?.name}</p>
              <p className="text-[7px] text-accent-400 truncate uppercase mt-0.5">{user?.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center px-3 py-2.5 bg-red-900/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-[8px] font-black transition-all border border-red-900/5 uppercase tracking-widest">
            <LogOut size={12} className="mr-2" /> Déconnexion
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
