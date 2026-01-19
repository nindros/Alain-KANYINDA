
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ApprovalCenter from './components/ApprovalCenter';
import ProfileView from './components/ProfileView';
import ProjectFileForm from './components/ProjectFileForm';
import PublicPortal from './components/PublicPortal';
import DocumentsView from './components/DocumentsView';
import Login from './components/Login';
import { UserRole, Project, ProjectStatus, User, UserProfile } from './types';
import { Menu, Bell, Lock, Loader2, Clock, Ban, RefreshCw } from 'lucide-react';
import { projectService, authService, supabase, SYSTEM_ADMINS } from './services/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  // Nouvel état pour gérer le statut du compte sans déconnecter
  const [accountStatus, setAccountStatus] = useState<'Active' | 'Inactive' | 'Rejected' | 'Loading'>('Loading');
  
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      setTimeout(() => setIsLoading(false), 1000);
    };
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const email = (session.user.email || '').toLowerCase();
          const isSystemAdmin = SYSTEM_ADMINS.includes(email);

          let profile = null;
          try {
             // On utilise peutSingle pour ne pas throw d'erreur si profile manquant
             const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
            
            profile = data;
          } catch (e) {
             console.warn("Erreur lecture profil", e);
          }

          // Si pas de profil mais admin systeme, on force la synchro
          if (!profile && isSystemAdmin) {
              try {
                  await authService.syncProfile(session.user, 'Active');
                  const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
                  profile = data;
              } catch (e) { console.error("Echec auto-réparation profil admin", e); }
          } else if (!profile) {
              // Si profil manquant pour user normal, on tente de le créer (Status Inactive par défaut)
              try {
                  await authService.syncProfile(session.user, 'Inactive');
                  const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
                  profile = data;
              } catch (e) { console.error("Echec sync user", e); }
          }

          const meta = session.user.user_metadata || {};
          // Détermination du rôle avec fallback
          const role = isSystemAdmin 
            ? (email.includes('uc-ppp.cd') ? UserRole.COORDINATOR : UserRole.ADMIN) 
            : ((profile?.role as UserRole) || meta.role || UserRole.MINISTRY);

          setUser({
            name: profile?.full_name || meta.full_name || session.user.email || 'Agent PPP',
            role: role
          });

          // Gestion fine du statut
          if (isSystemAdmin) {
            setAccountStatus('Active');
          } else {
            setAccountStatus((profile?.status as any) || 'Inactive');
          }

          // Chargement des données seulement si Actif
          if (isSystemAdmin || profile?.status === 'Active') {
            fetchData();
          }

        } catch (e) {
          console.error("Erreur auth check global", e);
          setUser(null);
        }
      } else {
        setUser(null);
        setAccountStatus('Loading');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    try {
      const projData = await projectService.getAllProjects();
      
      const mappedProjects = (projData || []).map((p: any) => {
          const logs = p.approval_logs 
            ? p.approval_logs.map((l: any) => ({
                date: l.created_at ? new Date(l.created_at).toLocaleDateString('fr-FR') : 'Date Inconnue',
                action: l.action,
                actor: l.actor_id || 'Instance Officielle',
                comment: l.comment
              }))
            : (p.approvalHistory || []);

          return {
            ...p,
            id: p.id,
            title: p.title,
            description: p.description,
            sector: p.sector,
            location: p.location,
            status: p.status as ProjectStatus,
            authority: p.contracting_authority || p.authority,
            parentMinistry: p.parent_ministry || p.parentMinistry,
            capex: p.capex_total || p.capex || 0,
            progress: p.progress || 0,
            documents: p.documents || [],
            startDate: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : (p.startDate || new Date().toISOString().split('T')[0]),
            approvalHistory: logs
          };
      });
      
      setProjects(mappedProjects);

      const { data: { session } } = await supabase.auth.getSession();
      const email = (session?.user?.email || '').toLowerCase();
      const isSysAdmin = SYSTEM_ADMINS.includes(email);
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session?.user?.id).maybeSingle();
      const currentRole = isSysAdmin ? UserRole.ADMIN : (profile?.role || session?.user?.user_metadata?.role as UserRole);
      
      if (currentRole === UserRole.ADMIN || currentRole === UserRole.COORDINATOR) {
        const profData = await authService.getAllProfiles();
        
        const mappedProfiles = (profData || []).map((p: any) => ({
            id: p.id,
            name: p.full_name || p.name,
            email: p.email,
            role: p.role as UserRole,
            department: p.authority || p.department || 'UC-PPP',
            parentMinistry: p.parent_ministry || p.parentMinistry,
            status: p.status as 'Active' | 'Inactive',
            lastLogin: p.last_login || p.lastLogin ? new Date(p.last_login || p.lastLogin).toLocaleDateString() : 'Jamais'
        }));
        
        setProfiles(mappedProfiles);
      }
    } catch (error) {
      console.error("Fetch data error", error);
      setProjects([]);
    }
  };

  // Nouvelle fonction pour vérifier le statut sans déconnecter
  const handleRefreshStatus = async () => {
    setIsCheckingStatus(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('status, role')
                .eq('id', session.user.id)
                .maybeSingle();

            if (profile) {
                if (profile.status === 'Active') {
                    setAccountStatus('Active');
                    if (profile.role) {
                        setUser(prev => prev ? ({...prev, role: profile.role as UserRole}) : null);
                    }
                    await fetchData();
                } else if (profile.status === 'Rejected') {
                    setAccountStatus('Rejected');
                } else {
                    alert("Votre dossier est toujours en attente de validation par l'Administrateur.");
                }
            }
        }
    } catch (error) {
        console.error("Erreur vérification statut", error);
    } finally {
        setIsCheckingStatus(false);
    }
  };

  const handleLogin = (name: string, role: UserRole) => {
    if (role === UserRole.PUBLIC) {
      setUser({ name, role });
      setAccountStatus('Active');
      setActiveView('public_portal');
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setAccountStatus('Loading');
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
      console.error("Update error", error);
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
    }
  };

  const handleSaveProjectTechnicalData = async (projectData: Partial<Project>) => {
    try {
      let savedProject: any;
      if (editMode && selectedProject) {
        savedProject = await projectService.updateProjectTechnicalData(selectedProject.id, projectData);
      } else {
        savedProject = await projectService.createProject(projectData);
      }
      
      setEditMode(false);
      
      // On recharge les données puis on sélectionne immédiatement le projet pour l'afficher
      await fetchData();
      
      // Reconstruction de l'objet projet complet pour l'affichage immédiat
      if (savedProject) {
          // On s'assure que les champs sont bien mappés pour l'affichage
          const displayProject: Project = {
              ...savedProject,
              authority: savedProject.contracting_authority || savedProject.authority,
              parentMinistry: savedProject.parent_ministry || savedProject.parentMinistry,
              capex: savedProject.capex_total || savedProject.capex,
              startDate: savedProject.created_at || new Date().toISOString(),
              approvalHistory: [] // Nouveau projet n'a pas d'historique
          };
          setSelectedProject(displayProject);
          setActiveView('project_detail');
      } else {
          setActiveView('projects');
      }

    } catch (error) {
      console.error("Save error", error);
      setEditMode(false);
      setActiveView('projects');
    }
  };

  const handleEditTrigger = (project: Project) => {
    setSelectedProject(project);
    setEditMode(true);
    setActiveView('new_fiche');
  };

  const visibleProjects = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.ADMIN || user.role === UserRole.COORDINATOR) {
        return projects;
    }
    if (user.role === UserRole.PUBLIC) {
        return projects.filter(p => [ProjectStatus.P3_PUBLICATION, ProjectStatus.ACTIVE].includes(p.status));
    }
    if ([UserRole.VALIDATOR, UserRole.FINANCE, UserRole.BUDGET, UserRole.ANALYST].includes(user.role)) {
        return projects;
    }
    if (user.role === UserRole.MINISTRY) {
        return projects.filter(p => p.authority === user.name || p.parentMinistry === user.name || p.authority === 'UC-PPP');
    }
    return projects;
  }, [projects, user]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a192f] text-white">
        <Loader2 size={48} className="animate-spin text-accent-400 mb-6" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Initialisation sécurisée...</p>
      </div>
    );
  }

  // --- ECRAN DE BLOCAGE "EN ATTENTE" ---
  if (user && accountStatus === 'Inactive') {
     return (
        <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-[#0a192f] text-left">
            <div className="w-full max-w-2xl bg-white rounded-[60px] shadow-2xl p-16 text-center space-y-10 border border-white/20 animate-fade-in">
               <div className="flex justify-center">
                  <div className="relative">
                     <div className="absolute inset-0 bg-accent-400 rounded-full animate-ping opacity-20"></div>
                     <div className="relative p-8 bg-primary-900 text-accent-400 rounded-full shadow-2xl">
                        <Clock size={64} />
                     </div>
                  </div>
               </div>
               <div className="space-y-4">
                  <h2 className="text-3xl font-black text-primary-900 uppercase tracking-tighter">Dossier en Instruction</h2>
                  <p className="text-[10px] font-black text-accent-600 uppercase tracking-[0.4em]">Habilitation en attente de validation</p>
               </div>
               <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 text-left">
                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase">
                    Bienvenue <span className="text-primary-900 font-black">{user.name}</span>,<br/><br/>
                    Votre compte a été créé avec succès. Votre habilitation pour le rôle de <span className="text-primary-900 font-black">{user.role}</span> est actuellement soumise à la validation de l'Administrateur UC-PPP.<br/><br/>
                    <span className="text-accent-700 italic">Veuillez patienter ou contacter le secrétariat pour accélérer la procédure.</span>
                  </p>
               </div>
               <div className="flex flex-col md:flex-row gap-4 justify-center">
                   <button 
                    onClick={handleRefreshStatus} 
                    disabled={isCheckingStatus}
                    className="px-10 py-5 bg-primary-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-900/20"
                   >
                      {isCheckingStatus ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16} />} Vérifier mon activation
                   </button>
                   <button onClick={handleLogout} className="px-10 py-5 bg-gray-100 text-gray-500 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-gray-200 transition-all">
                      Se déconnecter
                   </button>
               </div>
            </div>
        </div>
     );
  }

  // --- ECRAN DE BLOCAGE "REJETÉ" ---
  if (user && accountStatus === 'Rejected') {
      return (
        <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-[#0a192f] text-left">
            <div className="w-full max-w-2xl bg-white rounded-[60px] shadow-2xl p-16 text-center space-y-10 border border-white/20 animate-fade-in">
               <div className="flex justify-center">
                  <div className="relative p-8 bg-red-600 text-white rounded-full shadow-2xl">
                    <Ban size={64} />
                  </div>
               </div>
               <div className="space-y-4">
                  <h2 className="text-3xl font-black text-red-900 uppercase tracking-tighter">Accès Révoqué</h2>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Habilitation refusée ou suspendue</p>
               </div>
               <div className="bg-red-50 p-8 rounded-[32px] border border-red-100 text-left">
                  <p className="text-[11px] font-bold text-red-800 leading-relaxed uppercase">
                    L'accès à la plateforme pour le compte <span className="font-black">{user.name}</span> a été désactivé par l'administrateur.<br/><br/>
                    Pour toute réclamation, veuillez adresser un courrier officiel à la Coordination de l'UC-PPP.
                  </p>
               </div>
               <button onClick={handleLogout} className="px-10 py-5 bg-red-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all">
                  Retour à l'accueil
               </button>
            </div>
        </div>
      );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard projects={visibleProjects} userRole={user.role} userName={user.name} pendingValidations={profiles.filter(p => p.status === 'Inactive').length} onGoToAdmin={() => setActiveView('admin')} />;
      case 'projects': return <ProjectList projects={visibleProjects.filter(p => p.status.startsWith('P1') || p.status === ProjectStatus.SUBMITTED)} onSelectProject={handleProjectSelect} isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MINISTRY].includes(user.role)} onAddNewProject={() => { setEditMode(false); setActiveView('new_fiche'); }} />;
      case 'studies': return <ProjectList projects={visibleProjects.filter(p => p.status.startsWith('P2'))} onSelectProject={handleProjectSelect} isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR].includes(user.role)} />;
      case 'procurement': return <ProjectList projects={visibleProjects.filter(p => p.status.startsWith('P3'))} onSelectProject={handleProjectSelect} isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ANALYST].includes(user.role)} />;
      case 'project_detail': return selectedProject ? <ProjectDetail project={projects.find(p => p.id === selectedProject.id) || selectedProject} onBack={() => setActiveView('dashboard')} isAdmin={[UserRole.ADMIN, UserRole.COORDINATOR].includes(user.role)} userRole={user.role} userName={user.name} onUpdateProject={handleUpdateProject} onEditProject={handleEditTrigger} /> : null;
      case 'approvals': return <ApprovalCenter projects={projects} currentUserRole={user.role} currentUserName={user.name} onSelectProject={handleProjectSelect} />;
      case 'new_fiche': return <ProjectFileForm onSave={handleSaveProjectTechnicalData} onCancel={() => { setEditMode(false); setActiveView(selectedProject ? 'project_detail' : 'projects'); }} defaultAuthority={user.name} initialData={editMode && selectedProject ? selectedProject : undefined} />;
      case 'admin': return <ProfileView currentUser={user} allUsers={profiles} projects={projects} onProfileUpdate={fetchData} />;
      case 'documents': return <DocumentsView projects={projects} />;
      case 'public_portal': return <PublicPortal projects={projects} onBackToLogin={handleLogout} />;
      default: return <Dashboard projects={visibleProjects} userRole={user.role} userName={user.name} pendingValidations={0} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {activeView !== 'public_portal' && (
        <Sidebar user={user} activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} projects={visibleProjects} profiles={profiles} />
      )}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${activeView !== 'public_portal' ? 'lg:ml-72' : ''}`}>
        {activeView !== 'public_portal' && (
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
        )}
        <main className="flex-1 overflow-y-auto bg-[#F9FBFF]">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
