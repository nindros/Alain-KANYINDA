
import React, { useState } from 'react';
import { UserRole } from '../types';
import { 
  User, Lock, ArrowRight, Building2, ShieldCheck, 
  AlertCircle, Landmark, Mail, 
  Eye, EyeOff, Loader2, ChevronDown, Target, Gavel, LogIn, CheckCircle2,
  Coins, Receipt
} from 'lucide-react';
import { authService } from '../services/supabase';

interface LoginProps {
  onLogin: (name: string, role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MINISTRY);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quickLoadingId, setQuickLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const quickRoles = [
    { id: 'uc', name: 'UC-PPP', role: UserRole.COORDINATOR, email: 'expert.coordonnateur.uc.ppp@ppp.gouv.cd', icon: ShieldCheck, color: 'bg-primary-900', desc: 'Pilotage & Visas' },
    { id: 'plan', name: 'Plan', role: UserRole.VALIDATOR, email: 'expert.ministere.du.plan@ppp.gouv.cd', icon: Target, color: 'bg-blue-600', desc: 'PIP & Validation' },
    { id: 'fin', name: 'Finances', role: UserRole.FINANCE, email: 'expert.ministere.des.finances@ppp.gouv.cd', icon: Coins, color: 'bg-amber-600', desc: 'Soutenabilité' },
    { id: 'bud', name: 'Budget', role: UserRole.BUDGET, email: 'expert.ministere.du.budget@ppp.gouv.cd', icon: Receipt, color: 'bg-amber-500', desc: 'Programmation' },
    { id: 'dgcmp', name: 'DGCMP', role: UserRole.ANALYST, email: 'expert.dgcmp@ppp.gouv.cd', icon: Gavel, color: 'bg-emerald-600', desc: 'Contrôle & ANO' },
    { id: 'min', name: 'Secteurs', role: UserRole.MINISTRY, email: 'expert.ministere.sectoriel.ac@ppp.gouv.cd', icon: Building2, color: 'bg-slate-700', desc: 'AC / Tutelle' },
  ];

  const handleQuickLogin = async (id: string, roleEmail: string) => {
    setError('');
    setQuickLoadingId(id);
    setIsLoading(true);
    try {
      const data = await authService.signIn(roleEmail, 'PPP-2025-RDC');
      const userMetadata = data.user?.user_metadata;
      onLogin(userMetadata?.full_name || roleEmail, userMetadata?.role || UserRole.COORDINATOR);
    } catch (err: any) {
      setError(`Bureau indisponible : Identifiants non activés.`);
    } finally {
      setIsLoading(false);
      setQuickLoadingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      if (isSignUp) {
        if (selectedRole === UserRole.ADMIN) throw new Error("Accès Admin restreint.");
        await authService.signUp(email, password, { full_name: fullName, role: selectedRole, authority: "En attente", is_manual_admin: false });
        setSuccessMessage("Demande soumise. Validation admin requise.");
        setIsSignUp(false);
      } else {
        const data = await authService.signIn(email, password);
        const userMetadata = data.user?.user_metadata;
        onLogin(userMetadata?.full_name || email, userMetadata?.role || UserRole.COORDINATOR);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur d\'authentification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-2 md:p-4 flex flex-col items-center justify-center min-h-screen bg-[#0a192f]">
      <div className="w-full max-w-6xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Volet Gauche : Compacté */}
        <div className="md:w-1/2 bg-primary-900 p-8 lg:p-10 text-white relative flex flex-col overflow-hidden">
           <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-accent-400/10 rounded-full blur-[100px]"></div>
           <div className="relative z-10 h-full flex flex-col">
              <div className="w-14 h-14 bg-accent-500 rounded-2xl flex items-center justify-center text-primary-900 font-black text-xl mb-6">UC</div>
              <h2 className="text-2xl lg:text-3xl font-black mb-2 uppercase tracking-tighter leading-none">
                ACCÈS <span className="text-accent-400">OFFICIEL</span>
              </h2>
              <p className="text-primary-300 text-[9px] font-black uppercase tracking-[0.4em] mb-8">Passerelle sécurisée</p>
              
              <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto pr-2 no-scrollbar">
                {quickRoles.map((qr) => (
                   <button key={qr.id} disabled={isLoading} onClick={() => handleQuickLogin(qr.id, qr.email)}
                    className="group flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-accent-400/30 transition-all text-left disabled:opacity-50"
                   >
                      <div className={`p-3 rounded-xl ${qr.color} text-white group-hover:scale-105 transition-transform flex items-center justify-center min-w-[40px]`}>
                         {quickLoadingId === qr.id ? <Loader2 size={16} className="animate-spin" /> : <qr.icon size={16} />}
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-black uppercase tracking-tight text-white group-hover:text-accent-400">{qr.name}</p>
                         <p className="text-[8px] font-bold text-white/30 uppercase mt-0.5">{qr.desc}</p>
                      </div>
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                   </button>
                ))}
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/30">UC-PPP RDC © 2025</span>
                 <button onClick={() => onLogin('Public', UserRole.PUBLIC)} className="text-[9px] font-black uppercase tracking-widest text-accent-400 flex items-center gap-2">
                   <LogIn size={12}/> Citoyen
                 </button>
              </div>
           </div>
        </div>

        {/* Volet Droit : Compacté */}
        <div className="md:w-1/2 p-8 lg:p-12 bg-white flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-8 text-center">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-1">
                {isSignUp ? 'Habilitation' : 'S\'identifier'}
              </h3>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
                {isSignUp ? 'Demande d\'accès agent' : 'Espace Individuel'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-2 text-[9px] font-black text-red-700 uppercase tracking-tight">{error}</div>}
              {successMessage && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-[9px] font-black text-emerald-800 uppercase text-center">{successMessage}</div>}

              {isSignUp && (
                <div className="space-y-4">
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="text" placeholder="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 py-3 text-xs font-bold outline-none" required />
                  </div>
                  <div className="relative">
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[9px] font-black uppercase outline-none appearance-none">
                      {Object.values(UserRole).filter(r => r !== UserRole.PUBLIC && r !== UserRole.ADMIN).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="email" placeholder="Email professionnel" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 py-3 text-xs font-bold outline-none" required />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-12 py-3 text-xs font-bold outline-none" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-primary-900 text-white font-black py-4 rounded-2xl shadow-xl uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-black transition-all">
                {isLoading && !quickLoadingId ? <Loader2 size={16} className="animate-spin" /> : <>{isSignUp ? 'Soumettre' : 'Connexion'} <ArrowRight size={16} /></>}
              </button>

              <div className="text-center mt-6">
                <button type="button" onClick={() => { setIsSignUp(!isSignUp); setSuccessMessage(''); setError(''); }} className="text-[9px] font-black text-primary-600 uppercase underline underline-offset-4">
                  {isSignUp ? 'Retour' : 'Demander une habilitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
