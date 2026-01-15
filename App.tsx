
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ApprovalCenter from './components/ApprovalCenter';
import ProfileView from './components/ProfileView';
import ProjectFileForm from './components/ProjectFileForm';
import PublicPortal from './components/PublicPortal';
import Login from './components/Login';
import { UserRole, Project, ProjectStatus, User, UserProfile } from './types';
import { MOCK_PROJECTS, MOCK_USERS } from './constants';
import { Menu, Bell, Lock, Loader2 } from 'lucide-react';
import { projectService, authService, supabase } from './services/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialisation de la session
  useEffect(() => {
    const initApp = async () => {
      try {
        const session = await authService.getSession();
        if (session?.user) {
          setUser({
            name: session.user.user_metadata.full_name || session.user.email || 'Utilisateur',
            role: (session.user.user_metadata.role as UserRole) || UserRole.COORDINATOR
          });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata.full_name || session.user.email || 'Utilisateur',
          role: (session.user.user_metadata.role as UserRole) || UserRole.COORDINATOR
        });
      } else {
        // Ne pas déconnecter si c'est un profil de démo local (sans session Supabase)
        if (user && !user.name.includes('@')) return; 
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      const projData = await projectService.getAllProjects();
      
      if (projData && projData.length > 0) {
        const formattedProjects: Project[] = projData.map((p: any) => ({
          ...p,
          id: p.id,
          title: p.title,
          description: p.description,
          sector: p.sector,
          location: p.location,
          status: p.status as ProjectStatus,
          authority: p.contracting_authority,
          parentMinistry: p.parent_ministry,
          capex: p.capex_total || 0,
          progress: p.progress || 0,
          documents: p.documents || [],
          startDate: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          approvalHistory: (p.approval_logs || []).map((l: any) => ({
              date: new Date(l.created_at).toLocaleDateString('fr-FR'),
              action: l.action,
              actor: l.actor_id || 'Instance Officielle',
              comment: l.comment
          }))
        }));
        setProjects(formattedProjects);
      } else {
        // Fallback sur les mocks si la DB est vide
        setProjects(MOCK_PROJECTS);
      }

      if (user?.role === UserRole.ADMIN || user?.role === UserRole.COORDINATOR) {
        try {
          const profData = await authService.getAllProfiles();
          if (profData && profData.length > 0) {
            setProfiles(profData.map((p: any) => ({
              id: p.id,
              name: p.full_name,
              email: p.email,
              role: p.role as UserRole,
              department: p.authority || 'UC-PPP',
              status: 'Active',
              lastLogin: p.last_login ? new Date(p.last_login).toLocaleDateString() : 'Jamais'
            })));
          } else {
            setProfiles(MOCK_USERS);
          }
        } catch (e) {
          setProfiles(MOCK_USERS);
        }
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
      setProjects(MOCK_PROJECTS); // Sécurité: afficher au moins les mocks
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleLogin = (name: string, role: UserRole) => {
    setUser({ name, role });
    setActiveView(role === UserRole.PUBLIC ? 'public_portal' : 'dashboard');
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setSelectedProject(null);
    setActiveView('dashboard');
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setActiveView('project_detail');
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      const latestLog = updatedProject.approvalHistory[updatedProject.approvalHistory.length - 1];
      await projectService.updateProjectStatus(updatedProject.id, updatedProject.status, latestLog);
      await fetchData();
      setSelectedProject(updatedProject);
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      // Mise à jour locale pour la démo si Supabase échoue
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
    }
  };

  const handleSaveNewProject = async (projectData: Partial<Project>) => {
    try {
      const newId = `UC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      await projectService.createProject({ ...projectData, id: newId });
      await fetchData();
      setActiveView('projects');
    } catch (error) {
      console.error("Erreur création:", error);
      setActiveView('projects');
    }
  };

  const visibleProjects = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.PUBLIC) return projects.filter(p => [ProjectStatus.P3_PUBLICATION, ProjectStatus.ACTIVE].includes(p.status));
    if ([UserRole.ADMIN, UserRole.COORDINATOR, UserRole.VALIDATOR].includes(user.role)) return projects;
    if (user.role === UserRole.MINISTRY) return projects.filter(p => p.authority === user.name || p.parentMinistry === user.name);
    return projects;
  }, [projects, user]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a192f] text-white">
        <Loader2 size={48} className="animate-spin text-accent-400 mb-6" />
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">UC-PPP Cloud RDC</p>
          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Initialisation des protocoles de sécurité...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === UserRole.PUBLIC || activeView === 'public_portal') {
    return <PublicPortal projects={projects} onBackToLogin={() => setUser(null)} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard projects={visibleProjects} userRole={user.role} userName={user.name} />;
      case 'projects': return <ProjectList projects={visibleProjects.filter(p => p.status.startsWith('P1') || p.status === ProjectStatus.SUBMITTED)} onSelectProject={handleProjectSelect} isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MINISTRY].includes(user.role)} onAddNewProject={() => setActiveView('new_fiche')} />;
      case 'studies': return <ProjectList projects={visibleProjects.filter(p => p.status.startsWith('P2'))} onSelectProject={handleProjectSelect} isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR].includes(user.role)} />;
      case 'procurement': return <ProjectList projects={visibleProjects.filter(p => p.status.startsWith('P3'))} onSelectProject={handleProjectSelect} isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ANALYST].includes(user.role)} />;
      case 'project_detail': return selectedProject ? <ProjectDetail project={projects.find(p => p.id === selectedProject.id) || selectedProject} onBack={() => setActiveView('dashboard')} isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR].includes(user.role)} userRole={user.role} onUpdateProject={handleUpdateProject} /> : null;
      case 'approvals': return <ApprovalCenter projects={projects} currentUserRole={user.role} onSelectProject={handleProjectSelect} />;
      case 'new_fiche': return <ProjectFileForm onSave={handleSaveNewProject} onCancel={() => setActiveView('projects')} defaultAuthority={user.name} />;
      case 'admin': return <ProfileView currentUser={user} allUsers={profiles} />;
      default: return <Dashboard projects={visibleProjects} userRole={user.role} userName={user.name} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} projects={visibleProjects} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72 transition-all duration-300">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10">
           <div className="flex items-center">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-500 mr-4 p-2 hover:bg-gray-100 rounded-xl transition-colors"><Menu size={24} /></button>
              <h1 className="text-[10px] font-black text-primary-900 tracking-[0.3em] uppercase">{activeView.replace('_', ' ')}</h1>
           </div>
           <div className="flex items-center space-x-6">
                <div className="hidden md:flex flex-col text-right">
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{user.name}</span>
                    <span className="text-[8px] font-bold text-accent-600 uppercase tracking-widest">{user.role}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-900 text-white flex items-center justify-center font-black text-xs shadow-lg border border-white/10">{user.name.charAt(0)}</div>
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
