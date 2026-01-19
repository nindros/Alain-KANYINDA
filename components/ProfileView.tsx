
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, UserProfile, Project } from '../types';
import { 
  User as UserIcon, Mail, Shield, Building2, Lock, Save, Search, Edit2, 
  Trash2, UserPlus, CheckCircle, XCircle, AlertCircle, X, Zap, Loader2,
  Users, Key, Plus, ChevronDown, Landmark, CheckCircle2, ShieldCheck,
  UserCheck, History, Clock, FileWarning, Inbox, ShieldAlert, Fingerprint,
  ExternalLink, UserX, ClipboardList, Activity, Ban, AlertTriangle, Eye, EyeOff, Copy,
  Settings, LogOut, PlayCircle, FileKey, RefreshCw
} from 'lucide-react';
import { authService } from '../services/supabase';

interface ProfileViewProps {
  currentUser: User;
  allUsers: UserProfile[];
  projects: Project[];
  onProfileUpdate?: () => void;
}

// Updated Test Actors with fresh emails to ensure clean creation
const TEST_ACTORS = [
    { name: 'Administrateur UC-PPP', email: 'admin-ucppp@uc-ppp.cd', role: UserRole.COORDINATOR, auth: 'UC-PPP', min: "Présidence" },
    { name: 'Expert Ministère Plan', email: 'expert-plan@plan.cd', role: UserRole.VALIDATOR, auth: 'Ministère du Plan', min: 'Ministère du Plan' },
    { name: 'Expert Finances', email: 'expert-fin@finance.cd', role: UserRole.FINANCE, auth: 'Ministère des Finances', min: 'Ministère des Finances' },
    { name: 'Expert Budget', email: 'expert-bud@budget.cd', role: UserRole.BUDGET, auth: 'Ministère du Budget', min: 'Ministère du Budget' },
    { name: 'Contrôleur DGCMP', email: 'controleur@dgcmp.cd', role: UserRole.ANALYST, auth: 'DGCMP', min: 'Direction Générale' },
    { name: 'Chef de Projet SNEL', email: 'chef-projet@snel.cd', role: UserRole.MINISTRY, auth: 'SNEL', min: "Ministère de l'Énergie" },
];

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, allUsers, projects, onProfileUpdate }) => {
  const isCoordinator = currentUser.role === UserRole.COORDINATOR || currentUser.role === UserRole.ADMIN;
  
  const [activeTab, setActiveTab] = useState<'my_profile' | 'users' | 'habilitations' | 'rejected' | 'audit' | 'danger'>('my_profile');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  
  // Modal states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Auth / Password states
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const DEFAULT_PASSWORD = 'PPP-RDC-2025';

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: UserRole.MINISTRY,
    department: '',
    parentMinistry: '',
    password: DEFAULT_PASSWORD
  });

  // Force tab if not admin
  useEffect(() => {
    if (!isCoordinator && activeTab !== 'my_profile') {
        setActiveTab('my_profile');
    }
  }, [isCoordinator, activeTab]);

  const pendingHabilitations = useMemo(() => 
    allUsers.filter(u => u.status === 'Inactive' && u.id !== 'system'), 
  [allUsers]);

  const activeUsers = useMemo(() => 
    allUsers.filter(u => u.status === 'Active' && u.id !== 'system'), 
  [allUsers]);

  const rejectedUsers = useMemo(() => 
    allUsers.filter(u => u.status === 'Rejected' && u.id !== 'system'), 
  [allUsers]);

  const getFilteredList = () => {
      switch(activeTab) {
          case 'users': return activeUsers;
          case 'habilitations': return pendingHabilitations;
          case 'rejected': return rejectedUsers;
          default: return activeUsers;
      }
  };

  const filteredUsers = getFilteredList().filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.parentMinistry?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const auditLogs = useMemo(() => {
    return projects.flatMap(p => (p.approvalHistory || []).map(log => ({
      ...log,
      projectTitle: p.title,
      projectId: p.id
    }))).sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/');
        const [dayB, monthB, yearB] = b.date.split('/');
        return new Date(`${yearB}-${monthB}-${dayB}`).getTime() - new Date(`${yearA}-${monthA}-${dayA}`).getTime();
    });
  }, [projects]);

  const filteredLogs = auditLogs.filter(log => 
     log.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      await authService.updateProfileStatus(userId, 'Active');
      setNotification({ type: 'success', text: "Habilitation validée." });
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleReject = async (userId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir bloquer cet agent ?")) return;
    setProcessingId(userId);
    try {
      await authService.rejectProfile(userId);
      setNotification({ type: 'success', text: "Accès bloqué." });
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSeeding(true);
    try {
      await authService.signUp(newUser.email, newUser.password, {
        full_name: newUser.name,
        role: newUser.role,
        authority: newUser.department,
        parent_ministry: newUser.parentMinistry
      });
      setNotification({ type: 'success', text: `Compte créé. Mot de passe: ${newUser.password}` });
      setShowAddForm(false);
      setNewUser({ name: '', email: '', role: UserRole.MINISTRY, department: '', parentMinistry: '', password: DEFAULT_PASSWORD });
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setIsSeeding(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSeeding(true);
    try {
        await authService.updateProfileDetails(editingUser.id, {
            full_name: editingUser.name,
            role: editingUser.role,
            authority: editingUser.department,
            parent_ministry: editingUser.parentMinistry
        });
        setNotification({ type: 'success', text: "Profil mis à jour." });
        setShowEditForm(false);
        setEditingUser(null);
        if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
        setNotification({ type: 'error', text: err.message });
    } finally {
        setIsSeeding(false);
        setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!window.confirm("Envoyer un email de réinitialisation à cet utilisateur ?")) return;
    try {
        await authService.resetPasswordEmail(email);
        setNotification({ type: 'success', text: "Email de réinitialisation envoyé." });
    } catch (err: any) {
        setNotification({ type: 'error', text: "Erreur envoi email: " + err.message });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        setNotification({ type: 'error', text: "Les mots de passe ne correspondent pas." });
        return;
    }
    if (newPassword.length < 6) {
        setNotification({ type: 'error', text: "Le mot de passe doit contenir au moins 6 caractères." });
        return;
    }
    
    setIsSeeding(true);
    try {
        await authService.updatePassword(newPassword);
        setNotification({ type: 'success', text: "Votre mot de passe a été modifié avec succès." });
        setNewPassword('');
        setConfirmPassword('');
    } catch (err: any) {
        setNotification({ type: 'error', text: err.message });
    } finally {
        setIsSeeding(false);
        setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleSeedWorkflowActors = async () => {
    setIsSeeding(true);
    setNotification({ type: 'success', text: "Vérification et réparation des comptes en cours..." });
    
    // 1. PHASE DE CREATION (ou Skip si existant)
    for (const actor of TEST_ACTORS) {
         if(actor.email === 'uc-ppp@uc-ppp.cd') continue;
        try {
            await authService.signUp(actor.email, DEFAULT_PASSWORD, {
                full_name: actor.name,
                role: actor.role,
                authority: actor.auth,
                parent_ministry: actor.min
            });
        } catch (e: any) {
            console.log(`Info: Compte ${actor.email} existe déjà.`);
        }
    }
    
    // 2. PHASE D'ACTIVATION FORCEE
    setTimeout(async () => {
        try {
            const profiles = await authService.getAllProfiles();
            const targetEmails = TEST_ACTORS.map(a => a.email);
            // On récupère TOUS les comptes de test, peu importe leur statut actuel
            const toActivate = profiles.filter((p: any) => targetEmails.includes(p.email));
            
            let activatedCount = 0;
            for (const p of toActivate) {
                // On force le statut à Active
                try {
                    await authService.updateProfileStatus(p.id, 'Active');
                    activatedCount++;
                } catch(err) {
                    console.error("Erreur activation individuelle", p.email, err);
                }
            }
            
            setNotification({ type: 'success', text: `${activatedCount} Comptes vérifiés et activés !` });
            setShowCredentials(true);
            if (onProfileUpdate) onProfileUpdate();

        } catch (err: any) {
             setNotification({ type: 'error', text: "Erreur activation: " + err.message });
        } finally {
             setIsSeeding(false);
        }
    }, 1500); 
  };

  const handlePurgeSystem = async () => {
      const confirmMsg = "ATTENTION : Tapez 'CONFIRMER' pour supprimer TOUS les autres utilisateurs.";
      const input = window.prompt(confirmMsg);
      if (input !== 'CONFIRMER') return;

      setIsSeeding(true);
      try {
          const { data } = await authService.getSession();
          if (data.session?.user?.id) {
              await authService.deleteAllProfilesExcept(data.session.user.id);
              setNotification({ type: 'success', text: "Système purgé." });
              if (onProfileUpdate) onProfileUpdate();
          }
      } catch (err: any) {
          setNotification({ type: 'error', text: err.message });
      } finally {
          setIsSeeding(false);
      }
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(newUser.password);
    alert("Mot de passe copié !");
  };

  return (
    <div className="p-4 lg:p-8 animate-fade-in max-w-7xl mx-auto space-y-6 text-left">
      <div className="bg-[#0a192f] rounded-[40px] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl border border-white/10 mb-6">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
           <Landmark size={280} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-left space-y-3">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-accent-500 text-primary-900 rounded-2xl shadow-xl shadow-accent-500/20"><ShieldCheck size={32} /></div>
                <div>
                   <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                     {isCoordinator ? "Espace Administration" : "Mon Espace Agent"}
                   </h1>
                   <p className="text-accent-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
                     {isCoordinator ? "Gestion des Habilitations" : "Paramètres du compte"}
                   </p>
                </div>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-2 bg-white/5 p-2 rounded-[32px] border border-white/10 backdrop-blur-xl">
             <button onClick={() => setActiveTab('my_profile')} className={`px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'my_profile' ? 'bg-primary-500 text-white shadow-xl scale-105' : 'text-white/50 hover:text-white'}`}>
              <UserIcon size={16} /> <span className="hidden sm:inline">Mon Profil</span>
            </button>
            
            {isCoordinator && (
            <>
                <button onClick={() => setActiveTab('habilitations')} className={`px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'habilitations' ? 'bg-red-600 text-white shadow-xl scale-105' : 'text-white/50 hover:text-white'}`}>
                <Inbox size={16} /> <span className="hidden sm:inline">Demandes</span> {pendingHabilitations.length > 0 && <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-[8px]">{pendingHabilitations.length}</span>}
                </button>
                <button onClick={() => setActiveTab('users')} className={`px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'users' ? 'bg-accent-500 text-primary-900 shadow-xl scale-105' : 'text-white/50 hover:text-white'}`}>
                <UserCheck size={16} /> <span className="hidden sm:inline">Registre</span>
                </button>
                <button onClick={() => setActiveTab('audit')} className={`px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'audit' ? 'bg-accent-500 text-primary-900 shadow-xl scale-105' : 'text-white/50 hover:text-white'}`}>
                <Activity size={16} /> <span className="hidden sm:inline">Audit</span>
                </button>
                <button onClick={() => setActiveTab('danger')} className={`px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'danger' ? 'bg-red-950 text-red-500 border border-red-900' : 'text-white/30 hover:text-red-400'}`}>
                <AlertTriangle size={16} /> <span className="hidden sm:inline">Danger</span>
                </button>
            </>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <div className={`p-5 rounded-3xl flex items-center gap-4 border-l-8 animate-slide-up shadow-2xl ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={24}/> : <AlertCircle size={24}/>}
          <p className="text-[11px] font-black uppercase tracking-widest">{notification.text}</p>
        </div>
      )}

      {/* --- ONGLET MON PROFIL --- */}
      {activeTab === 'my_profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                      <Settings size={18} className="text-primary-600"/> Mes Informations
                  </h3>
                  <div className="space-y-6">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Nom Complet</label>
                          <p className="text-lg font-bold text-gray-900">{currentUser.name}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Rôle Système</label>
                          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <Shield size={16} className="text-accent-500" /> {currentUser.role}
                          </p>
                      </div>
                  </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                      <Lock size={18} className="text-red-500"/> Sécurité
                  </h3>
                  <form onSubmit={handleChangeOwnPassword} className="space-y-4">
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Nouveau Mot de passe</label>
                          <input 
                              type="password" 
                              required
                              minLength={6}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-red-500 outline-none transition-all"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="Min. 6 caractères"
                          />
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Confirmer Mot de passe</label>
                          <input 
                              type="password" 
                              required
                              minLength={6}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-red-500 outline-none transition-all"
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              placeholder="Répétez le mot de passe"
                          />
                      </div>
                      <button 
                          type="submit" 
                          disabled={isSeeding}
                          className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                          {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Mettre à jour le mot de passe
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* --- ONGLET DANGER (ADMIN) --- */}
      {activeTab === 'danger' && isCoordinator && (
          <div className="bg-red-50 border border-red-100 rounded-[40px] p-12 text-center animate-fade-in">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                  <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-red-900 uppercase tracking-tight mb-2">Réinitialisation de la Base Utilisateurs</h2>
              <p className="text-gray-600 max-w-lg mx-auto mb-8 font-medium">
                  Cette action va supprimer <strong className="text-red-700">tous les profils utilisateurs</strong> enregistrés dans l'application, 
                  à l'exception de votre compte Administrateur actuel.
              </p>
              <button 
                onClick={handlePurgeSystem}
                disabled={isSeeding}
                className="px-10 py-5 bg-red-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.3em] hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 mx-auto"
              >
                 {isSeeding ? <Loader2 className="animate-spin" /> : <ShieldAlert size={20} />} Supprimer tous les autres comptes
              </button>
          </div>
      )}

      {/* --- AUTRES ONGLETS ADMIN --- */}
      {isCoordinator && activeTab !== 'my_profile' && activeTab !== 'danger' && (
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/50">
           <div className="relative w-full md:w-1/2">
              <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder={activeTab === 'audit' ? "Rechercher dans les logs..." : "Rechercher un dossier..."} 
                className="w-full pl-16 pr-6 py-4 bg-white border-2 border-gray-100 rounded-3xl text-[11px] font-bold focus:border-primary-500 outline-none shadow-sm transition-all" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
           </div>
           {activeTab === 'users' && (
              <div className="flex gap-2">
                 <button 
                    onClick={() => setShowCredentials(true)}
                    className="px-6 py-4 bg-white text-gray-600 border border-gray-200 rounded-[24px] font-black text-[11px] uppercase tracking-[0.1em] flex items-center gap-2 hover:bg-gray-50 transition-all"
                 >
                    <FileKey size={18} /> Voir Identifiants Test
                 </button>
                 <button 
                    onClick={handleSeedWorkflowActors}
                    disabled={isSeeding}
                    className="px-6 py-4 bg-purple-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.1em] flex items-center gap-2 hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/20 disabled:opacity-50"
                 >
                    {isSeeding ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />} Réparer / Générer Acteurs
                 </button>
                 <button onClick={() => setShowAddForm(true)} className="px-6 py-4 bg-primary-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.1em] flex items-center gap-2 hover:bg-black transition-all shadow-2xl shadow-primary-900/20">
                    <UserPlus size={18} /> Nouveau
                 </button>
              </div>
           )}
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'audit' ? (
             <table className="min-w-full divide-y divide-gray-100 text-left">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Date / Heure</th>
                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Acteur</th>
                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Projet Concerné</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-primary-50/30 transition-all">
                            <td className="px-8 py-4 text-xs font-bold text-gray-500">{log.date}</td>
                            <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-black text-primary-900">{log.actor.charAt(0)}</div>
                                    <span className="text-[10px] font-black text-primary-900 uppercase">{log.actor}</span>
                                </div>
                            </td>
                            <td className="px-8 py-4">
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${
                                    log.action === 'FAVORABLE' ? 'bg-emerald-100 text-emerald-800' :
                                    log.action === 'REJET' ? 'bg-red-100 text-red-800' :
                                    log.action === 'RESERVE' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {log.action}
                                </span>
                                <p className="text-[9px] text-gray-400 mt-1 italic">"{log.comment}"</p>
                            </td>
                            <td className="px-8 py-4 text-[10px] font-bold text-gray-700">{log.projectTitle}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={4} className="py-24 text-center text-gray-400 font-black uppercase text-xs">Aucune activité enregistrée</td></tr>
                    )}
                </tbody>
             </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-left">
                <thead className="bg-primary-900/[0.02]">
                <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-primary-900/40 uppercase tracking-widest">Agent Demandeur</th>
                    <th className="px-10 py-6 text-[10px] font-black text-primary-900/40 uppercase tracking-widest">Structure / Tutelle</th>
                    <th className="px-10 py-6 text-[10px] font-black text-primary-900/40 uppercase tracking-widest">Statut</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black text-primary-900/40 uppercase tracking-widest">Action d'Instruction</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-primary-50/30 transition-all group">
                    <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg border-2 border-white ${
                            u.status === 'Inactive' ? 'bg-red-500 text-white animate-pulse-soft' : 
                            u.status === 'Rejected' ? 'bg-gray-200 text-gray-500' : 'bg-primary-900 text-white'
                        }`}>
                            {u.name.charAt(0)}
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-black text-primary-900 uppercase tracking-tight mb-1">{u.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                            <Mail size={10} /> {u.email}
                            </div>
                        </div>
                        </div>
                    </td>
                    <td className="px-10 py-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[11px] font-black text-gray-700 uppercase">
                            <Building2 size={12} className="text-primary-300" /> {u.department || 'Non Spécifié'}
                            </div>
                            <div className="text-[9px] font-bold text-accent-600 uppercase tracking-widest">
                            Tutelle : {u.parentMinistry || 'Inconnue'}
                            </div>
                            <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2 mt-1">
                            <Shield size={10} className="text-blue-300" /> {u.role}
                            </span>
                        </div>
                    </td>
                    <td className="px-10 py-8">
                        <div className="flex flex-col gap-1.5">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded inline-block w-fit ${
                                u.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                                u.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {u.status === 'Active' ? 'Habilité' : u.status === 'Rejected' ? 'Rejeté' : 'En Attente'}
                            </span>
                        </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                        {activeTab === 'habilitations' ? (
                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={() => handleApprove(u.id)}
                                disabled={!!processingId}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-xl shadow-emerald-600/20 disabled:opacity-50"
                            >
                                {processingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={16} />} Valider l'accès
                            </button>
                            <button 
                                onClick={() => handleReject(u.id)}
                                disabled={!!processingId}
                                className="px-5 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 flex items-center gap-2"
                            >
                                {processingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />} Rejeter
                            </button>
                        </div>
                        ) : activeTab === 'rejected' ? (
                            <button 
                                onClick={() => handleApprove(u.id)}
                                disabled={!!processingId}
                                className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-gray-200"
                            >
                                Rétablir l'accès
                            </button>
                        ) : (
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => { setEditingUser(u); setShowEditForm(true); }} 
                                className="p-3 text-blue-500 hover:text-white hover:bg-blue-600 rounded-2xl transition-all shadow-sm bg-white border border-gray-100" 
                                title="Modifier"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => handleResetPassword(u.email)} 
                                className="p-3 text-amber-500 hover:text-white hover:bg-amber-600 rounded-2xl transition-all shadow-sm bg-white border border-gray-100" 
                                title="Réinitialiser Mot de passe (Email)"
                            >
                                <Key size={16} />
                            </button>
                            <button 
                                onClick={() => handleReject(u.id)} 
                                className="p-3 text-gray-400 hover:text-white hover:bg-red-600 rounded-2xl transition-all shadow-sm bg-white border border-gray-100" 
                                title="Révoquer l'accès"
                            >
                                <Ban size={16} />
                            </button>
                        </div>
                        )}
                    </td>
                    </tr>
                )) : (
                    <tr>
                    <td colSpan={4} className="py-48 text-center">
                        <div className="opacity-10 flex flex-col items-center">
                            <Inbox size={120} className="text-primary-900 mb-8" />
                            <p className="text-[16px] font-black uppercase tracking-[0.6em] text-primary-900">
                                {activeTab === 'habilitations' ? 'Aucune demande en attente' : 'Aucun dossier trouvé'}
                            </p>
                        </div>
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
          )}
        </div>
      </div>
      )}

      {/* --- MODAL CREDENTIALS --- */}
      {showCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0a192f]/90 backdrop-blur-md animate-fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[60px] shadow-2xl overflow-hidden border border-white/20">
              <div className="bg-primary-900 p-12 text-white flex justify-between items-center text-left">
                 <div className="flex items-center gap-8">
                    <div className="p-4 bg-white text-primary-900 rounded-[28px] shadow-2xl"><Key size={40} /></div>
                    <div className="text-left">
                      <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">Comptes de Test</h3>
                      <p className="text-[10px] font-black text-primary-300 uppercase tracking-[0.3em]">Liste des acteurs du circuit PPP</p>
                    </div>
                 </div>
                 <button onClick={() => setShowCredentials(false)} className="p-4 hover:bg-white/10 rounded-full transition-colors border border-white/10"><X size={32}/></button>
              </div>
              <div className="p-12 bg-gray-50 max-h-[60vh] overflow-y-auto">
                 <div className="mb-6 p-4 bg-blue-100 text-blue-800 rounded-2xl border border-blue-200 flex items-center gap-4">
                    <Lock size={20} />
                    <p className="text-xs font-bold">Mot de passe pour tous les comptes : <strong className="font-black text-lg ml-2">PPP-RDC-2025</strong></p>
                 </div>
                 <div className="space-y-3">
                    {TEST_ACTORS.map((actor, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{actor.auth} ({actor.role})</p>
                                <p className="text-sm font-bold text-gray-800">{actor.email}</p>
                            </div>
                            <button onClick={() => {navigator.clipboard.writeText(actor.email); alert("Email copié !")}} className="p-2 text-gray-400 hover:text-primary-600">
                                <Copy size={16} />
                            </button>
                        </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL CREATION --- */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0a192f]/90 backdrop-blur-md animate-fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[60px] shadow-2xl overflow-hidden border border-white/20">
              <div className="bg-primary-900 p-12 text-white flex justify-between items-center text-left">
                 <div className="flex items-center gap-8">
                    <div className="p-4 bg-accent-500 text-primary-900 rounded-[28px] shadow-2xl shadow-accent-500/20"><UserPlus size={40} /></div>
                    <div className="text-left">
                      <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">Habilitation Manuelle</h3>
                      <p className="text-[10px] font-black text-primary-300 uppercase tracking-[0.3em]">Enregistrement direct d'un expert sectoriel</p>
                    </div>
                 </div>
                 <button onClick={() => setShowAddForm(false)} className="p-4 hover:bg-white/10 rounded-full transition-colors border border-white/10"><X size={32}/></button>
              </div>
              <form onSubmit={handleCreateUser} className="p-14 space-y-8 text-left max-h-[70vh] overflow-y-auto no-scrollbar">
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                          <Lock size={18} className="text-blue-600" />
                          <div>
                              <p className="text-[9px] font-black text-blue-900 uppercase">Mot de passe par défaut</p>
                              <p className="text-xs font-bold text-blue-700">{newUser.password}</p>
                          </div>
                      </div>
                      <button type="button" onClick={copyPasswordToClipboard} className="p-2 bg-white text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-all border border-blue-100">
                          <Copy size={16} />
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Identité de l'Agent</label>
                        <div className="relative">
                          <UserIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-900/20" />
                          <input type="text" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-[24px] pl-16 pr-6 py-4 text-sm font-bold focus:border-primary-500 outline-none transition-all shadow-inner" placeholder="Nom et Prénom" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Email Officiel (.cd)</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-900/20" />
                          <input type="email" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-[24px] pl-16 pr-6 py-4 text-sm font-bold focus:border-primary-500 outline-none transition-all shadow-inner" placeholder="agent@ministere.cd" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Institution / AC</label>
                        <div className="relative">
                          <Building2 size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-900/20" />
                          <input type="text" className="w-full bg-gray-50 border-2 border-gray-100 rounded-[24px] pl-16 pr-6 py-4 text-sm font-bold focus:border-primary-500 outline-none transition-all shadow-inner" placeholder="Ex: ANSER, SNEL, REGIDESO" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Rôle Institutionnel</label>
                        <div className="relative">
                          <Shield size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-900/20" />
                          <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-[24px] pl-16 pr-10 py-4 text-[11px] font-black uppercase outline-none appearance-none shadow-inner cursor-pointer" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                              {Object.values(UserRole).filter(r => r !== UserRole.PUBLIC).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Définir ou Modifier le mot de passe</label>
                        <div className="relative">
                          <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-900/20" />
                          <input 
                            type={showPassword ? "text" : "password"} 
                            required 
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-[24px] pl-16 pr-16 py-4 text-sm font-bold focus:border-primary-500 outline-none transition-all shadow-inner" 
                            placeholder="Mot de passe secret" 
                            value={newUser.password} 
                            onChange={e => setNewUser({...newUser, password: e.target.value})} 
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4 shadow-sm">
                      <AlertTriangle size={20} className="text-amber-600 mt-1 flex-shrink-0" />
                      <p className="text-[9px] font-bold text-amber-800 leading-relaxed uppercase">
                          Important : Vous créez un compte avec accès direct. Le mot de passe devra être communiqué à l'agent de manière sécurisée. L'agent est encouragé à le changer dès sa première connexion dans son profil.
                      </p>
                  </div>

                  <button type="submit" disabled={isSeeding} className="w-full py-6 bg-primary-900 text-white rounded-[32px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-primary-900/30 hover:bg-black transition-all flex items-center justify-center gap-5 group">
                    {isSeeding ? <Loader2 className="animate-spin" /> : <><Fingerprint size={24} className="text-accent-400 group-hover:scale-110 transition-transform" /> Signer l'Habilitation d'Agent</>}
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* --- MODAL EDIT --- */}
      {showEditForm && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0a192f]/90 backdrop-blur-md animate-fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[60px] shadow-2xl overflow-hidden border border-white/20">
              <div className="bg-blue-600 p-12 text-white flex justify-between items-center text-left">
                 <div className="flex items-center gap-8">
                    <div className="p-4 bg-white text-blue-600 rounded-[28px] shadow-2xl"><Edit2 size={40} /></div>
                    <div className="text-left">
                      <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">Modification Profil</h3>
                      <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em]">Mise à jour des informations administratives</p>
                    </div>
                 </div>
                 <button onClick={() => { setShowEditForm(false); setEditingUser(null); }} className="p-4 hover:bg-white/10 rounded-full transition-colors border border-white/10"><X size={32}/></button>
              </div>
              <form onSubmit={handleUpdateUser} className="p-14 space-y-8 text-left">
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Email (Lecture Seule)</label>
                      <input type="text" disabled className="w-full bg-gray-100 border-2 border-gray-100 rounded-[24px] px-6 py-4 text-sm font-bold text-gray-500 cursor-not-allowed" value={editingUser.email} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Identité de l'Agent</label>
                        <input type="text" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-[24px] px-6 py-4 text-sm font-bold focus:border-blue-500 outline-none" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Institution / AC</label>
                        <input type="text" className="w-full bg-gray-50 border-2 border-gray-100 rounded-[24px] px-6 py-4 text-sm font-bold focus:border-blue-500 outline-none" value={editingUser.department || ''} onChange={e => setEditingUser({...editingUser, department: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Rôle</label>
                         <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-[24px] px-6 py-4 text-[11px] font-black uppercase outline-none appearance-none cursor-pointer" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                              {Object.values(UserRole).filter(r => r !== UserRole.PUBLIC).map(r => <option key={r} value={r}>{r}</option>)}
                         </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Ministère de Tutelle</label>
                        <input type="text" className="w-full bg-gray-50 border-2 border-gray-100 rounded-[24px] px-6 py-4 text-sm font-bold focus:border-blue-500 outline-none" value={editingUser.parentMinistry || ''} onChange={e => setEditingUser({...editingUser, parentMinistry: e.target.value})} />
                    </div>
                  </div>

                  <button type="submit" disabled={isSeeding} className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-5">
                    {isSeeding ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Enregistrer les modifications</>}
                  </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
