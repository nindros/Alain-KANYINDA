
import React from 'react';
import { 
  LayoutDashboard, X, FilePlus, Target, Microscope, ShieldCheck, 
  Gavel, FileText, Users, LogOut, Landmark, Briefcase, Zap, Search, Layers, Settings,
  Globe, Lock
} from 'lucide-react';
import { UserRole, User, Project, ProjectStatus } from '../types';

interface SidebarProps {
  user: User | null;
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onLogout: () => void;
  projects?: Project[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: number;
}

interface MenuSection {
  title: string;
  color?: string;
  items: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, setActiveView, isOpen, toggleSidebar, onLogout, projects = [] }) => {
  
  const getCounts = () => {
    return {
      p1: projects.filter(p => p.status.startsWith('P1')).length,
      p2: projects.filter(p => p.status.startsWith('P2')).length,
      p3: projects.filter(p => p.status.startsWith('P3')).length,
      approvals: projects.filter(p => [ProjectStatus.SUBMITTED, ProjectStatus.P1_UC_CONFORMITY, ProjectStatus.P2_MULTILATERAL_AVIS].includes(p.status)).length
    };
  };

  const counts = getCounts();

  const sections: MenuSection[] = [
    {
      title: "Pilotage & Décision",
      items: [
        { id: 'dashboard', label: 'Espace Décisionnel', icon: LayoutDashboard, roles: Object.values(UserRole).filter(r => r !== UserRole.PUBLIC) },
        { id: 'approvals', label: 'Centre d\'Avis & Visas', icon: ShieldCheck, roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ANALYST, UserRole.VALIDATOR, UserRole.FINANCE, UserRole.BUDGET, UserRole.REGULATOR, UserRole.SPATIAL_PLANNING], badge: counts.approvals },
      ]
    },
    {
      title: "Cycle de Vie (UC-PPP)",
      color: "text-blue-400",
      items: [
        { id: 'projects', label: 'Phase 1 - Identification', icon: Search, roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MINISTRY, UserRole.VALIDATOR], badge: counts.p1 },
        { id: 'studies', label: 'Phase 2 - Étude', icon: Microscope, roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MINISTRY, UserRole.FINANCE, UserRole.BUDGET, UserRole.REGULATOR, UserRole.SPATIAL_PLANNING], badge: counts.p2 },
        { id: 'procurement', label: 'Phase 3 - Passation', icon: Gavel, roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MINISTRY, UserRole.ANALYST], badge: counts.p3 },
      ]
    },
    {
      title: "Administration",
      items: [
        { id: 'admin', label: 'Utilisateurs & Accès', icon: Users, roles: [UserRole.ADMIN, UserRole.COORDINATOR] },
        { id: 'documents', label: 'Base Documentaire', icon: FileText, roles: Object.values(UserRole).filter(r => r !== UserRole.PUBLIC) },
      ]
    }
  ];

  const currentUserRole = user?.role || UserRole.PUBLIC;

  return (
    <>
      <div className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={toggleSidebar} />

      <div className={`fixed top-0 left-0 z-30 h-full w-64 bg-primary-900 text-white transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-2xl border-r border-white/5`}>
        <div className="flex items-center justify-between h-20 px-6 bg-primary-950 flex-shrink-0 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center text-primary-900 font-black shadow-lg transform -rotate-3">UC</div>
            <div>
              <span className="text-sm font-black tracking-tighter block leading-none">UC-PPP RDC</span>
              <span className="text-[8px] font-bold text-primary-400 uppercase tracking-widest mt-1 block">Digital Platform</span>
            </div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-white opacity-50 hover:opacity-100"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {!user && (
            <div className="px-4 py-4 bg-white/5 rounded-2xl border border-white/10 mb-4">
              <p className="text-[9px] font-black uppercase text-accent-400 mb-1 tracking-widest">Accès Restreint</p>
              <p className="text-[10px] text-primary-200 font-medium leading-tight">Veuillez vous authentifier pour accéder aux fiches projets.</p>
            </div>
          )}

          {sections.map((section, sIdx) => {
            const visibleItems = user ? section.items.filter(item => item.roles.includes(currentUserRole)) : section.items;
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className={`space-y-2 ${!user ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <p className={`px-4 text-[9px] font-black uppercase tracking-[0.2em] mb-4 opacity-40 ${section.color || 'text-white'}`}>
                  {section.title}
                </p>
                <nav className="space-y-1">
                  {visibleItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (!user) return;
                        setActiveView(item.id);
                        if (window.innerWidth < 1024) toggleSidebar();
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group relative ${
                        activeView === item.id && user
                          ? 'bg-white/10 text-white shadow-xl shadow-black/20' 
                          : 'text-primary-200 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon size={18} className={`mr-3 transition-colors ${activeView === item.id && user ? 'text-accent-400' : 'text-primary-500 group-hover:text-white'}`} />
                        <span className="font-bold text-xs tracking-tight">{item.label}</span>
                      </div>
                      
                      {item.badge && item.badge > 0 && user && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-accent-500 text-primary-900">
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

        <div className="p-4 bg-primary-950/50 border-t border-white/5">
          <div className="flex items-center space-x-3 mb-4 p-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black shadow-inner border border-white/10 uppercase">
               {user ? user.name.charAt(0) : <Lock size={16}/>}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-[11px] font-black text-white truncate uppercase tracking-tighter">{user ? user.name : 'Veuillez vous connecter'}</p>
              <p className="text-[8px] text-primary-400 truncate uppercase font-bold tracking-widest">{user ? user.role : 'Portail Sécurisé'}</p>
            </div>
          </div>
          {user && (
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-[10px] font-black transition-all border border-red-900/20 uppercase tracking-widest"
            >
              <LogOut size={14} className="mr-2" /> Déconnexion
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
