
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ApprovalCenter from './components/ApprovalCenter';
import ProfileView from './components/ProfileView';
import ProjectFileForm from './components/ProjectFileForm';
import Login from './components/Login';
import { UserRole, Project, ProjectStatus, User, UserProfile } from './types';
import { MOCK_USERS } from './constants';
import { Menu, Bell, Lock, Loader2 } from 'lucide-react';
import { projectService } from './services/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usersList] = useState<UserProfile[]>(MOCK_USERS);

  // Fetch initial des projets depuis Supabase
  const fetchProjects = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await projectService.getAllProjects();
      // Transformation des données Supabase (SnakeCase) vers notre UI (CamelCase)
      const formattedData: Project[] = data.map((p: any) => ({
        ...p,
        authority: p.contracting_authority,
        parentMinistry: p.parent_ministry,
        capex: p.capex_total,
        approvalHistory: (p.approval_logs || []).map((l: any) => ({
            date: new Date(l.created_at).toLocaleDateString('fr-FR'),
            action: l.action,
            actor: l.actor_id || 'Instance Officielle', // Dans un vrai flux, on joindrait la table users
            comment: l.comment
        }))
      }));
      setProjects(formattedData);
    } catch (error) {
      console.error("Erreur de chargement Supabase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const handleLogin = (name: string, role: UserRole) => {
    setUser({ name, role });
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedProject(null);
    setActiveView('dashboard');
    setProjects([]);
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setActiveView('project_detail');
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    setIsLoading(true);
    try {
      const latestLog = updatedProject.approvalHistory[updatedProject.approvalHistory.length - 1];
      await projectService.updateProjectStatus(updatedProject.id, updatedProject.status, latestLog);
      await fetchProjects(); // Rafraîchir les données
      setSelectedProject(updatedProject);
    } catch (error) {
      alert("Erreur lors de la mise à jour en base de données.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewProject = async (projectData: Partial<Project>) => {
    setIsLoading(true);
    try {
      const newId = `UC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const projectToCreate = {
        ...projectData,
        id: newId,
        progress: 5,
        status: ProjectStatus.SUBMITTED,
      };
      await projectService.createProject(projectToCreate);
      await fetchProjects();
      setActiveView('projects');
    } catch (error) {
      alert("Erreur lors de la création du projet sur Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  const visibleProjects = useMemo(() => {
    if (!user) return [];
    
    if ([UserRole.ADMIN, UserRole.COORDINATOR, UserRole.VALIDATOR].includes(user.role)) {
      return projects;
    }

    if (user.role === UserRole.MINISTRY) {
      return projects.filter(p => p.authority === user.name);
    }

    if ([UserRole.FINANCE, UserRole.BUDGET, UserRole.SPATIAL_PLANNING, UserRole.REGULATOR].includes(user.role)) {
      return projects.filter(p => p.status === ProjectStatus.P2_MULTILATERAL_AVIS || p.status.startsWith('P2'));
    }

    if (user.role === UserRole.ANALYST) {
      return projects.filter(p => p.status.startsWith('P3'));
    }

    return projects;
  }, [projects, user]);

  const renderContent = () => {
    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    if (isLoading && projects.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-12">
           <Loader2 size={48} className="text-primary-600 animate-spin mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Initialisation de la base de données UC-PPP...</p>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard projects={visibleProjects} userRole={user.role} userName={user.name} />;
      
      case 'projects':
        const p1 = visibleProjects.filter(p => p.status.startsWith('P1') || p.status === ProjectStatus.SUBMITTED);
        return <ProjectList projects={p1} onSelectProject={handleProjectSelect} isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR, UserRole.VALIDATOR].includes(user.role)} onAddNewProject={() => setActiveView('new_fiche')} />;
      
      case 'studies':
        const p2 = visibleProjects.filter(p => p.status.startsWith('P2'));
        return <ProjectList projects={p2} onSelectProject={handleProjectSelect} isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR].includes(user.role)} />;
      
      case 'procurement':
        const p3 = visibleProjects.filter(p => p.status.startsWith('P3'));
        return <ProjectList projects={p3} onSelectProject={handleProjectSelect} isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR].includes(user.role)} />;
      
      case 'project_detail':
        return selectedProject ? (
          <ProjectDetail 
            project={projects.find(p => p.id === selectedProject.id) || selectedProject} 
            onBack={() => setActiveView('dashboard')} 
            isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR].includes(user.role)} 
            userRole={user.role}
            onUpdateProject={handleUpdateProject}
          />
        ) : null;
      
      case 'approvals':
        return <ApprovalCenter projects={projects} currentUserRole={user.role} onSelectProject={handleProjectSelect} />;
      
      case 'new_fiche':
        return <ProjectFileForm onSave={handleSaveNewProject} onCancel={() => setActiveView('projects')} defaultAuthority={user.name} />;
      
      case 'admin':
        return <ProfileView currentUser={user} allUsers={usersList} />;
      
      default:
        return <Dashboard projects={visibleProjects} userRole={user.role} userName={user.name} />;
    }
  };

  const headerTitle = useMemo(() => {
      if (!user) return 'Authentification Requise';
      switch(activeView) {
          case 'dashboard': return 'Tableau de Bord Décisionnel';
          case 'projects': return 'Phase 1 : Identification';
          case 'studies': return 'Phase 2 : Études & Structuration';
          case 'procurement': return 'Phase 3 : Passation';
          case 'approvals': return 'Centre d\'Avis & Visas';
          case 'admin': return 'Administration Système';
          case 'project_detail': return 'Dossier de Projet';
          case 'new_fiche': return 'Nouveau Projet PPP';
          default: return 'Plateforme UC-PPP';
      }
  }, [activeView, user]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar 
        user={user} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        onLogout={handleLogout} 
        projects={visibleProjects} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b border-gray-200 z-10">
           <div className="flex items-center">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"><Menu size={24} /></button>
              <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    {!user && <Lock size={14} className="text-accent-600" />}
                    <h1 className="text-sm font-black text-primary-900 tracking-widest uppercase">
                      {headerTitle}
                    </h1>
                    {isLoading && <Loader2 size={12} className="text-primary-600 animate-spin" />}
                  </div>
                  {user && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter italic">Instance : {user.name}</span>}
              </div>
           </div>
           
           <div className="flex items-center space-x-4">
                {user && (
                    <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                )}
                <div className="w-9 h-9 rounded-xl bg-primary-900 text-white flex items-center justify-center font-black text-[11px] uppercase shadow-lg border border-white/20">
                    {user ? user.name.charAt(0) : <Lock size={14}/>}
                </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F9FBFF]">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
