
import React, { useState } from 'react';
import { User, UserRole, UserProfile } from '../types';
import { User as UserIcon, Mail, Shield, Building2, Lock, Save, Search, Edit2, Trash2, UserPlus, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  allUsers: UserProfile[];
  onAddUser?: (user: UserProfile) => void;
  onEditUser?: (user: UserProfile) => void;
  onDeleteUser?: (userId: string) => void;
  initialTab?: 'my-profile' | 'user-management';
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, allUsers, onAddUser, onEditUser, onDeleteUser, initialTab = 'my-profile' }) => {
  const [activeTab, setActiveTab] = useState<'my-profile' | 'user-management'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Create User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState<{name: string, email: string, role: UserRole, department: string}>({
      name: '',
      email: '',
      role: UserRole.ANALYST,
      department: ''
  });

  // Edit User State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const canManageUsers = [UserRole.ADMIN, UserRole.COORDINATOR].includes(currentUser.role);

  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    if (!newPassword || !confirmPassword) {
        setNotification({ type: 'error', text: 'Veuillez remplir tous les champs.' });
        return;
    }
    if (newPassword !== confirmPassword) {
        setNotification({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
        return;
    }
    setNotification({ type: 'success', text: 'Votre mot de passe a été mis à jour avec succès.' });
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (onAddUser && newUser.name && newUser.email) {
          const userToAdd: UserProfile = {
              id: `u${Date.now()}`,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              department: newUser.department || 'Général',
              status: 'Active',
              lastLogin: 'Jamais'
          };
          onAddUser(userToAdd);
          setShowAddModal(false);
          setNewUser({ name: '', email: '', role: UserRole.ANALYST, department: '' });
          setNotification({ type: 'success', text: `Utilisateur ${newUser.name} créé avec succès.` });
          setTimeout(() => setNotification(null), 4000);
      }
  };

  return (
    <div className="p-6 animate-fade-in max-w-7xl mx-auto relative">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-black text-primary-900 tracking-tight uppercase">Administration UC-PPP</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Gestion des accès et sécurité du système</p>
        </div>
        {canManageUsers && (
             <div className="bg-gray-100 p-1 rounded-xl flex border border-gray-200 shadow-sm">
                <button 
                    onClick={() => setActiveTab('my-profile')}
                    className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        activeTab === 'my-profile' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    Mon Compte
                </button>
                <button 
                    onClick={() => setActiveTab('user-management')}
                    className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        activeTab === 'user-management' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    Utilisateurs
                </button>
             </div>
        )}
      </div>

      {activeTab === 'my-profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[24px] mx-auto flex items-center justify-center text-3xl font-black text-white mb-6 shadow-xl border-4 border-white">
                        {currentUser.name.charAt(0)}
                    </div>
                    <h3 className="text-xl font-black text-primary-900 uppercase tracking-tighter">{currentUser.name}</h3>
                    <span className="inline-block mt-3 px-4 py-1.5 bg-primary-900 text-accent-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {currentUser.role}
                    </span>
                    <div className="mt-8 text-left space-y-3">
                        <InfoItem icon={Mail} label="Email" value="utilisateur@ucppp.cd" />
                        <InfoItem icon={Building2} label="Entité" value="Direction Générale" />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10">
                    <h3 className="text-sm font-black text-primary-900 uppercase tracking-widest mb-8 flex items-center">
                        <Lock size={18} className="mr-3 text-accent-500" /> Sécurité du compte
                    </h3>
                    <form className="space-y-6" onSubmit={handleUpdatePassword}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nouveau mot de passe</label>
                                <input type="password" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold focus:border-primary-500 outline-none" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Confirmation</label>
                                <input type="password" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold focus:border-primary-500 outline-none" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            </div>
                        </div>
                        <div className="pt-6 flex justify-end">
                            <button type="submit" className="px-8 py-3 bg-primary-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-primary-900/20">
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
      )}

      {activeTab === 'user-management' && canManageUsers && (
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                 <div className="relative w-full sm:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Rechercher un membre..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-primary-500/10 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                 </div>
                 <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-primary-700 text-white rounded-2xl hover:bg-primary-900 transition-all shadow-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                     <UserPlus size={16} /> Ajouter un accès
                 </button>
             </div>

             <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-100">
                     <thead className="bg-gray-50/30">
                         <tr>
                             <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilisateur</th>
                             <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle Institutionnel</th>
                             <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Entité</th>
                             <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-50">
                         {filteredUsers.map((u) => (
                             <tr key={u.id} className="hover:bg-primary-50/30 transition-colors">
                                 <td className="px-8 py-5">
                                     <div className="flex items-center">
                                         <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-black text-xs">{u.name.charAt(0)}</div>
                                         <div className="ml-4">
                                             <div className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{u.name}</div>
                                             <div className="text-[10px] text-gray-400 font-bold">{u.email}</div>
                                         </div>
                                     </div>
                                 </td>
                                 <td className="px-8 py-5">
                                     <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase rounded-lg border border-blue-100">{u.role}</span>
                                 </td>
                                 <td className="px-8 py-5 text-xs font-bold text-gray-600">{u.department || '-'}</td>
                                 <td className="px-8 py-5 text-right">
                                     <div className="flex justify-end gap-2">
                                         <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors"><Edit2 size={16} /></button>
                                         <button className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                                     </div>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          </div>
      )}

      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-2 bg-accent-500"></div>
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-black text-primary-900 uppercase tracking-tight">Nouvel Accès Institutionnel</h3>
                      <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleCreateUser} className="space-y-5">
                      <Input label="Nom Complet" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} placeholder="ex: Mme. Kapinga" />
                      <Input label="Email Professionnel" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} placeholder="ex: kapinga@ucppp.cd" />
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rôle</label>
                          <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold focus:border-primary-500 outline-none" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}>
                              {Object.values(UserRole).filter(r => r !== UserRole.PUBLIC).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                      </div>
                      <div className="pt-6 flex gap-4">
                          <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors">Annuler</button>
                          <button type="submit" className="flex-1 px-6 py-4 bg-primary-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-xl shadow-primary-900/20">Créer l'accès</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary-200 transition-colors">
    <Icon size={18} className="text-gray-400 mr-4 group-hover:text-primary-500 transition-colors" />
    <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-xs font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</label>
    <input {...props} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold focus:border-primary-500 outline-none transition-all" />
  </div>
);

export default ProfileView;
