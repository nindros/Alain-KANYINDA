
import React, { useState } from 'react';
import { UserRole } from '../types';
import { 
  User, Lock, ArrowRight, Building2, ShieldCheck, 
  AlertCircle, Landmark, Mail, PieChart,
  Eye, EyeOff, Loader2, ChevronDown, Map, FileCheck, Zap, Settings, Check
} from 'lucide-react';
import { CONTRACTING_AUTHORITIES } from '../constants';

interface LoginProps {
  onLogin: (name: string, role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.COORDINATOR);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState(CONTRACTING_AUTHORITIES[0].name);

  const roleOptions = [
    { 
      role: UserRole.COORDINATOR, 
      label: 'UC-PPP', 
      fullLabel: 'Unité de Conseil (UC-PPP)', 
      icon: ShieldCheck, 
      gradient: 'from-blue-600 to-indigo-800', 
      shadow: 'shadow-blue-500/20' 
    },
    { 
      role: UserRole.VALIDATOR, 
      label: 'Ministère du Plan', 
      fullLabel: 'Ministère du Plan', 
      icon: FileCheck, 
      gradient: 'from-orange-500 to-red-700', 
      shadow: 'shadow-orange-500/20' 
    },
    { 
      role: UserRole.FINANCE, 
      label: 'Ministère des Finances', 
      fullLabel: 'Ministère des Finances', 
      icon: Landmark, 
      gradient: 'from-emerald-500 to-teal-800', 
      shadow: 'shadow-emerald-500/20' 
    },
    { 
      role: UserRole.BUDGET, 
      label: 'Ministère du Budget', 
      fullLabel: 'Ministère du Budget', 
      icon: PieChart, 
      gradient: 'from-indigo-500 to-purple-800', 
      shadow: 'shadow-indigo-500/20' 
    },
    { 
      role: UserRole.SPATIAL_PLANNING, 
      label: 'Aménagement du Territoire', 
      fullLabel: 'Aménagement du Territoire', 
      icon: Map, 
      gradient: 'from-cyan-500 to-blue-700', 
      shadow: 'shadow-cyan-500/20' 
    },
    { 
      role: UserRole.REGULATOR, 
      label: 'Régulateur Sectoriel', 
      fullLabel: 'Régulateur Sectoriel', 
      icon: Zap, 
      gradient: 'from-amber-500 to-yellow-700', 
      shadow: 'shadow-amber-500/20' 
    },
    { 
      role: UserRole.MINISTRY, 
      label: 'Autorité Contractante', 
      fullLabel: 'Autorité Contractante (AC)', 
      icon: Building2, 
      gradient: 'from-slate-600 to-slate-800', 
      shadow: 'shadow-slate-500/20' 
    },
    { 
      role: UserRole.ANALYST, 
      label: 'DGCMP (Contrôle)', 
      fullLabel: 'DGCMP (Contrôle)', 
      icon: Settings, 
      gradient: 'from-rose-500 to-red-800', 
      shadow: 'shadow-rose-500/20' 
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Veuillez utiliser votre identifiant @gouv.cd ou @ucppp.cd.');
      return;
    }

    if (password.length < 4) {
      setError('Mot de passe requis pour cette instance.');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);

    const currentOption = roleOptions.find(o => o.role === selectedRole);
    const finalName = selectedRole === UserRole.MINISTRY ? selectedAuthority : currentOption?.fullLabel || email;
    onLogin(finalName, selectedRole);
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-[#F0F2F5]">
      <div className="w-full max-w-6xl bg-white rounded-[60px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 flex flex-col md:flex-row min-h-[750px]">
        
        {/* Volet Gauche - Identité Visuelle */}
        <div className="md:w-5/12 bg-primary-900 p-12 text-white relative flex flex-col justify-between overflow-hidden">
           {/* Décoration de fond */}
           <div className="absolute -top-20 -right-20 w-96 h-96 bg-accent-400/20 rounded-full blur-[100px]"></div>
           <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-[100px]"></div>
           
           <div className="relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-accent-400 to-accent-600 rounded-[32px] flex items-center justify-center text-primary-900 font-black text-4xl shadow-2xl mb-12 transform hover:rotate-6 transition-transform cursor-default">UC</div>
              <h2 className="text-5xl font-black mb-8 uppercase tracking-tighter leading-[0.9] text-white">
                Système <br/>
                <span className="text-accent-400">National</span> <br/>
                des PPP
              </h2>
              <div className="space-y-6 max-w-xs">
                <p className="text-primary-200 text-sm leading-relaxed font-medium">Plateforme d'interconnexion sécurisée des instances décisionnelles de la RDC.</p>
                <div className="flex flex-col gap-3 mt-10">
                   <div className="flex items-center gap-4 text-[9px] font-black uppercase text-accent-400 bg-white/5 p-4 rounded-2xl border border-white/10 tracking-[0.2em] backdrop-blur-sm">
                      <ShieldCheck size={18} /> Accès Multi-Facteurs (MFA)
                   </div>
                   <div className="flex items-center gap-4 text-[9px] font-black uppercase text-primary-300 bg-white/5 p-4 rounded-2xl border border-white/10 tracking-[0.2em] backdrop-blur-sm">
                      <Lock size={18} /> Cryptage Gouv-Cloud
                   </div>
                </div>
              </div>
           </div>

           <div className="relative z-10 flex flex-col gap-1 border-t border-white/10 pt-8">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">République Démocratique du Congo</span>
             <span className="text-[9px] font-bold text-primary-400 uppercase tracking-[0.1em]">Primature | Unité de Conseil (UC-PPP)</span>
           </div>
        </div>

        {/* Volet Droit - Sélection d'Instance & Login */}
        <div className="md:w-7/12 p-8 md:p-14 bg-white flex flex-col overflow-y-auto">
          <div className="mb-10 text-left">
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em] mb-3 block">Authentification Officielle</span>
            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Portail Inter-Instance</h3>
          </div>

          {/* ÉTAPE 1 : MENU BOUTONS DES INSTANCES AVEC FONDS AMÉLIORÉS */}
          <div className="mb-8">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
               <span className="w-5 h-5 rounded-full bg-primary-900 text-white flex items-center justify-center text-[10px]">1</span>
               Sélectionnez votre Institution
            </p>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {roleOptions.map((opt) => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setSelectedRole(opt.role)}
                  className={`relative h-28 flex flex-col items-center justify-center rounded-[24px] transition-all duration-300 group overflow-hidden border-4 ${
                    selectedRole === opt.role 
                      ? `border-accent-400 ${opt.shadow} scale-[1.05] z-10` 
                      : `border-transparent opacity-80 hover:opacity-100 hover:scale-[1.02]`
                  }`}
                >
                  {/* Background Dégradé Institutionnel */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${opt.gradient} ${selectedRole === opt.role ? 'opacity-100' : 'opacity-10'}`}></div>
                  
                  {/* Overlay Glossy / Reflet */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-30"></div>

                  <div className={`relative z-10 mb-2 p-2 rounded-xl backdrop-blur-md border border-white/20 transition-all duration-500 ${selectedRole === opt.role ? 'bg-white/20 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}>
                    <opt.icon size={20} className={selectedRole === opt.role ? 'animate-pulse' : ''} />
                  </div>
                  
                  <span className={`relative z-10 text-[8px] md:text-[9px] font-black uppercase tracking-tight text-center px-2 leading-tight ${selectedRole === opt.role ? 'text-white' : 'text-gray-500'}`}>
                    {opt.label}
                  </span>

                  {selectedRole === opt.role && (
                    <div className="absolute top-2 right-2 text-accent-400 animate-fade-in">
                      <Check size={12} className="stroke-[4px]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ÉTAPE 2 : FORMULAIRE LOGIN */}
          <div className="animate-slide-up pt-6 border-t border-gray-100">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
               <span className="w-5 h-5 rounded-full bg-primary-900 text-white flex items-center justify-center text-[10px]">2</span>
               Identifiants de Sécurité
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-2xl flex items-center gap-4 animate-shake">
                  <AlertCircle size={20} className="text-red-500 shrink-0" />
                  <p className="text-[10px] font-black text-red-700 uppercase tracking-tight">{error}</p>
                </div>
              )}

              {selectedRole === UserRole.MINISTRY && (
                <div className="space-y-2 animate-slide-down">
                  <div className="relative group">
                    <Building2 size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-600 transition-transform group-focus-within:scale-110" />
                    <select 
                      value={selectedAuthority}
                      onChange={(e) => setSelectedAuthority(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-14 pr-10 py-4 text-[11px] font-black uppercase focus:border-primary-500 focus:bg-white outline-none appearance-none transition-all shadow-inner"
                    >
                      {CONTRACTING_AUTHORITIES.map((m, idx) => <option key={idx} value={m.name}>{m.name}</option>)}
                    </select>
                    <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                   <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-600 transition-colors" />
                   <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Identifiant Gouv.cd"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-14 pr-4 py-4 text-sm font-bold focus:border-primary-500 focus:bg-white outline-none transition-all shadow-inner"
                      required
                   />
                </div>

                <div className="relative group">
                   <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-600 transition-colors" />
                   <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Clé d'Accès"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl pl-14 pr-14 py-4 text-sm font-bold focus:border-primary-500 focus:bg-white outline-none transition-all shadow-inner"
                      required
                   />
                   <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-900 transition-colors"
                   >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-primary-900 text-white font-black py-6 rounded-[30px] disabled:opacity-50 hover:bg-black transition-all shadow-2xl shadow-primary-900/30 uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-5 group active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={24} className="animate-spin text-accent-400" /> Session en cours...
                    </>
                  ) : (
                    <>
                      Lancer l'Application <ArrowRight size={22} className="transition-transform group-hover:translate-x-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-auto pt-10 flex flex-col items-center gap-2">
            <div className="flex gap-6">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest hover:text-primary-600 cursor-pointer transition-colors">Documentation IT</span>
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest hover:text-primary-600 cursor-pointer transition-colors">Assistance</span>
            </div>
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">Audit Trail v4.28 Security Ready</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1); }

        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Login;
