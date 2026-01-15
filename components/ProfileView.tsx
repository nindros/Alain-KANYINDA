
import React, { useState } from 'react';
import { User, UserRole, UserProfile } from '../types';
import { 
  User as UserIcon, Mail, Shield, Building2, Lock, Save, Search, Edit2, 
  Trash2, UserPlus, CheckCircle, XCircle, AlertCircle, X, Zap, Loader2,
  Users, Key, Plus, ChevronDown
} from 'lucide-react';
import { authService } from '../services/supabase';

interface ProfileViewProps {
  currentUser: User;
  allUsers: UserProfile[];
  onAddUser?: (user: UserProfile) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, allUsers }) => {
  const [activeTab, setActiveTab] = useState<'my-profile' | 'user-management'>('user-management');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Formulaire pour nouvel utilisateur
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: UserRole.MINISTRY,
    department: '',
    password: 'PPP-RDC-2025'
  });

  const canManageUsers = [UserRole.ADMIN, UserRole.COORDINATOR].includes(currentUser.role);

  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.name) return;
    
    setIsSeeding(true);
    try {
      await authService.signUp(newUser.email, newUser.password, {
        full_name: newUser.name,
        role: newUser.role,
        authority: newUser.department
      });
      
      setNotification({ type: 'success', text: `Compte créé pour ${newUser.name}. Mot de passe par défaut : ${newUser.password}` });
      setShowAddForm(false);
      setNewUser({ name: '', email: '', role: UserRole.MINISTRY, department: '', password: 'PPP-RDC-2025' });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || "Erreur lors de la création du compte." });
    } finally {
      setIsSeeding(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleBulkCreateUsers = async () => {
    if (!window.confirm("Action Administrative : Créer les comptes experts pour DGCMP, Plan, Finances et Budget ?\n\nMot de passe standard : PPP-2025-RDC")) return;
    
    setIsSeeding(true);
    setNotification(null);
    let successCount = 0;

    // Définition des rôles institutionnels prioritaires
    const institutionalAccounts = [
      { role: UserRole.COORDINATOR, email: 'expert.coordonnateur.uc.ppp@ppp.gouv.cd', name: 'Coordination UC-PPP' },
      { role: UserRole.VALIDATOR, email: 'expert.ministere.du.plan@ppp.gouv.cd', name: 'Ministère du Plan' },
      { role: UserRole.FINANCE, email: 'expert.ministere.des.finances@ppp.gouv.cd', name: 'Ministère des Finances' },
      { role: UserRole.BUDGET, email: 'expert.ministere.du.budget@ppp.gouv.cd', name: 'Ministère du Budget' },
      { role: UserRole.ANALYST, email: 'expert.dgcmp@ppp.gouv.cd', name: 'Direction Générale (DGCMP)' },
      { role: UserRole.MINISTRY, email: 'expert.ministere.sectoriel.ac@ppp.gouv.cd', name: 'Ministère Sectoriel / AC' }
    ];
    
    for (const acc of institutionalAccounts) {
      try {
        await authService.signUp(acc.email, "PPP-2025-RDC", {
          full_name: acc.name,
          role: acc.role,
          authority: acc.role === UserRole.COORDINATOR ? "Direction Générale UC-PPP" : "Organe Institutionnel"
        });
        successCount++;
      } catch (e: any) {
        console.error(`Erreur création ${acc.role}:`, e.message);
      }
    }

    setIsSeeding(false);
    setNotification({ 
      type: 'success', 
      text: `${successCount} comptes institutionnels générés ou mis à jour avec succès.` 
    });
    setTimeout(() => setNotification(null), 8000);
  };

  return (
    <div className="p-6 animate-fade-in max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-black text-primary-900 tracking-tight uppercase">Habilitations & Acteurs</h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Référentiel des accès de l'administration PPP</p>
        </div>
        
        {canManageUsers && (
          <div className="flex gap-4">
            <button 
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-accent-500 text-primary-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-accent-600 transition-all shadow-lg"
            >
                <UserPlus size={16} /> Créer un Agent
            </button>
            <button 
              onClick={handleBulkCreateUsers}
              disabled={isSeeding}
              className="px-6 py-3 bg-primary-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-lg disabled:opacity-50"
            >
              {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} className="text-accent-400" />}
              Auto-Génération Experts
            </button>
            <div className="bg-gray-100 p-1 rounded-xl flex border border-gray-200">
                <button 
                    onClick={() => setActiveTab('user-management')}
                    className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        activeTab === 'user-management' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-400'
                    }`}
                >
                    Liste des Agents
                </button>
                <button 
                    onClick={() => setActiveTab('my-profile')}
                    className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        activeTab === 'my-profile' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-400'
                    }`}
                >
                    Mon Compte
                </button>
             </div>
          </div>
        )}
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-4 border-l-4 animate-slide-up ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
          <p className="text-[10px] font-black uppercase tracking-widest">{notification.text}</p>
        </div>
      )}

      {/* Modal Création Utilisateur */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-900/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-white/10">
              <div className="bg-primary-900 p-8 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <UserPlus className="text-accent-400" size={24} />
                    <h3 className="text-xl font-black uppercase tracking-tight">Nouvelle Habilitation Agent</h3>
                 </div>
                 <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <form onSubmit={handleCreateUser} className="p-10 space-y-6 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom Complet</label>
                        <input 
                            type="text" required
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold focus:border-primary-500 outline-none"
                            placeholder="Ex: Jean Mukendi"
                            value={newUser.name}
                            onChange={e => setNewUser({...newUser, name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Pro</label>
                        <input 
                            type="email" required
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold focus:border-primary-500 outline-none"
                            placeholder="nom@domaine.cd"
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fonction / Rôle</label>
                        <div className="relative">
                            <select 
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-[10px] font-black uppercase appearance-none outline-none focus:border-primary-500"
                                value={newUser.role}
                                onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                            >
                                {Object.values(UserRole).filter(r => r !== UserRole.PUBLIC).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Département / AC</label>
                        <input 
                            type="text"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold focus:border-primary-500 outline-none"
                            placeholder="Ex: Direction des Infrastructures"
                            value={newUser.department}
                            onChange={e => setNewUser({...newUser, department: e.target.value})}
                        />
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                     <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                        <Shield size={12}/> Mot de passe provisoire : {newUser.password}
                     </p>
                  </div>

                  <button 
                    type="submit" disabled={isSeeding}
                    className="w-full py-5 bg-primary-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4"
                  >
                    {isSeeding ? <Loader2 className="animate-spin" /> : <><Plus size={18}/> Enregistrer le profil agent</>}
                  </button>
              </form>
           </div>
        </div>
      )}

      {activeTab === 'user-management' && (
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                 <div className="relative w-full sm:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Filtrer par nom, email ou rôle..." 
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-bold focus:ring-4 focus:ring-primary-500/10 outline-none" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                 </div>
                 <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                   {allUsers.length} comptes actifs
                 </div>
             </div>

             <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-100 text-left">
                     <thead className="bg-gray-50/30">
                         <tr>
                             <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent / Email</th>
                             <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fonction Institutionnelle</th>
                             <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Autorité / AC</th>
                             <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-50">
                         {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                             <tr key={u.id} className={`hover:bg-primary-50/30 transition-colors ${u.name === currentUser.name ? 'bg-primary-50/50' : ''}`}>
                                 <td className="px-8 py-5">
                                     <div className="flex items-center">
                                         <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-black text-xs uppercase shadow-sm ${u.name === currentUser.name ? 'bg-accent-500 text-primary-900' : 'bg-primary-900 text-white'}`}>
                                           {u.name.charAt(0)}
                                         </div>
                                         <div className="ml-4">
                                             <div className="text-xs font-black text-gray-900 uppercase tracking-tight">
                                                {u.name} {u.name === currentUser.name && <span className="ml-2 text-[8px] bg-primary-900 text-white px-1.5 py-0.5 rounded tracking-widest">MOI</span>}
                                             </div>
                                             <div className="text-[9px] text-gray-400 font-bold tracking-tighter uppercase">{u.email}</div>
                                         </div>
                                     </div>
                                 </td>
                                 <td className="px-8 py-5">
                                     <span className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg border ${
                                       u.role === UserRole.ADMIN ? 'bg-primary-900 text-white border-primary-900' : 'bg-blue-50 text-blue-700 border-blue-100'
                                     }`}>
                                       {u.role}
                                     </span>
                                 </td>
                                 <td className="px-8 py-5 text-[10px] font-bold text-gray-600 uppercase">
                                   {u.department || 'Administration Centrale'}
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    <button className="p-2 text-gray-300 hover:text-primary-600 transition-colors">
                                      <Edit2 size={14} />
                                    </button>
                                 </td>
                             </tr>
                         )) : (
                           <tr>
                             <td colSpan={4} className="p-20 text-center">
                               <Users size={48} className="mx-auto text-gray-100 mb-4" />
                               <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Aucun agent correspondant</p>
                             </td>
                           </tr>
                         )}
                     </tbody>
                 </table>
             </div>
          </div>
      )}

      {activeTab === 'my-profile' && (
        <div className="bg-white rounded-[40px] p-12 border border-gray-100 text-center max-w-lg mx-auto shadow-sm animate-slide-up">
           <div className="w-24 h-24 bg-primary-900 rounded-[30px] mx-auto flex items-center justify-center text-3xl font-black text-white mb-6 border-8 border-primary-50">
             {currentUser.name.charAt(0)}
           </div>
           <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{currentUser.name}</h3>
           <p className="text-[10px] font-black text-accent-600 uppercase tracking-[0.3em] mb-8">{currentUser.role}</p>
           
           <div className="space-y-4 pt-8 border-t border-gray-100 text-left">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-[9px] font-black text-gray-400 uppercase">Statut Session</span>
                <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Administrateur Actif
                </span>
              </div>
              <div className="flex justify-between items-center p-3">
                <span className="text-[9px] font-black text-gray-400 uppercase">Habilitations</span>
                <span className="text-[10px] font-bold text-primary-900 uppercase">Contrôle Total du Système</span>
              </div>
           </div>
           
           <button className="mt-10 w-full py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-100 transition-all">
             <Key size={16} /> Changer le mot de passe
           </button>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
