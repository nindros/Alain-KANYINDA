
import React, { useState, useRef } from 'react';
import { UserRole } from '../types';
import { 
  User, Lock, ArrowRight, Building2, ShieldCheck, 
  Mail, Eye, EyeOff, Loader2, Target, Gavel, LogIn,
  Coins, Receipt, Landmark, ChevronDown, CheckCircle, Clock
} from 'lucide-react';
import { authService } from '../services/supabase';

interface LoginProps {
  onLogin: (name: string, role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAwaitingValidation, setIsAwaitingValidation] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MINISTRY);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [authority, setAuthority] = useState('');
  const [parentMinistry, setParentMinistry] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quickLoadingId, setQuickLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Updated Quick Roles with fresh emails
  const quickRoles = [
    { id: 'uc', name: 'UC-PPP (Coordinateur)', role: UserRole.COORDINATOR, email: 'admin-ucppp@uc-ppp.cd', icon: ShieldCheck, color: 'bg-primary-900' },
    { id: 'min', name: 'Secteur (SNEL)', role: UserRole.MINISTRY, email: 'chef-projet@snel.cd', icon: Building2, color: 'bg-slate-700' },
    { id: 'plan', name: 'Plan (Validation P1)', role: UserRole.VALIDATOR, email: 'expert-plan@plan.cd', icon: Target, color: 'bg-blue-600' },
    { id: 'fin', name: 'Finances (Avis P2)', role: UserRole.FINANCE, email: 'expert-fin@finance.cd', icon: Coins, color: 'bg-amber-600' },
    { id: 'bud', name: 'Budget (Avis P2)', role: UserRole.BUDGET, email: 'expert-bud@budget.cd', icon: Receipt, color: 'bg-amber-500' },
    { id: 'dgcmp', name: 'DGCMP (Contrôle P3)', role: UserRole.ANALYST, email: 'controleur@dgcmp.cd', icon: Gavel, color: 'bg-emerald-600' },
  ];

  const handleQuickSelection = (roleEmail: string, id: string) => {
    setEmail(roleEmail);
    setError('');
    setQuickLoadingId(id);
    if (password === '') setPassword('PPP-RDC-2025');
    setTimeout(() => {
        setQuickLoadingId(null);
        passwordInputRef.current?.focus();
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isSignUp) {
        await authService.signUp(email, password, { 
          full_name: fullName, 
          role: selectedRole, 
          authority: authority, 
          parent_ministry: parentMinistry 
        });
        setIsAwaitingValidation(true);
      } else {
        const data = await authService.signIn(email, password);
        const userMetadata = data.user?.user_metadata;
        onLogin(
          userMetadata?.full_name || email.split('@')[0].toUpperCase(), 
          (userMetadata?.role as UserRole) || UserRole.MINISTRY
        );
      }
    } catch (err: any) {
      if (err.message === "HABILITATION_PENDING") {
        setError("VOTRE DOSSIER EST EN COURS D'INSTRUCTION. L'accès vous sera ouvert dès validation par le Bureau de Coordination UC-PPP.");
      } else if (err.message?.includes("Invalid login credentials")) {
        setError("Identifiants incorrects. Veuillez vérifier votre email et mot de passe.");
      } else {
        setError(err.message || "Impossible de se connecter.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isAwaitingValidation) {
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
              <p className="text-[10px] font-black text-accent-600 uppercase tracking-[0.4em]">Habilitation Institutionnelle transmise</p>
           </div>
           <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 text-left">
              <p className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase">
                Expert <span className="text-primary-900 font-black">{fullName}</span>,<br/><br/>
                Votre demande d'accès à la plateforme nationale UC-PPP pour l'entité <span className="text-primary-900 font-black">{authority}</span> a été transmise au Bureau de Coordination.<br/><br/>
                <span className="text-accent-700 italic">Vous recevrez une notification par email dès que votre habilitation sera signée numériquement.</span>
              </p>
           </div>
           <button onClick={() => { setIsAwaitingValidation(false); setIsSignUp(false); }} className="px-10 py-5 bg-primary-900 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all">
              Retourner à l'accueil
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 flex flex-col items-center justify-center min-h-screen bg-[#0a192f]">
      <div className="w-full max-w-6xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        <div className="md:w-1/2 bg-primary-900 p-8 lg:p-10 text-white relative flex flex-col overflow-hidden">
           <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-accent-400/10 rounded-full blur-[100px]"></div>
           <div className="relative z-10 h-full flex flex-col">
              <div className="w-14 h-14 bg-accent-500 rounded-2xl flex items-center justify-center text-primary-900 font-black text-xl mb-6 shadow-lg border border-white/20">UC</div>
              <h2 className="text-2xl lg:text-3xl font-black mb-2 uppercase tracking-tighter leading-none">
                PLATEFORME <span className="text-accent-400">DIGITALE</span>
              </h2>
              <p className="text-primary-300 text-[9px] font-black uppercase tracking-[0.4em] mb-8">Accès par Bureau Institutionnel</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 flex-1 overflow-y-auto pr-2 no-scrollbar">
                {quickRoles.map((qr) => (
                   <button key={qr.id} disabled={isLoading} onClick={() => handleQuickSelection(qr.email, qr.id)}
                    className="group flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-accent-400/30 transition-all text-left disabled:opacity-50"
                   >
                      <div className={`p-3 rounded-xl ${qr.color} text-white group-hover:scale-105 transition-transform flex items-center justify-center min-w-[44px] shadow-lg`}>
                         {quickLoadingId === qr.id ? <Loader2 size={16} className="animate-spin" /> : <qr.icon size={18} />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                         <p className="text-[10px] font-black uppercase tracking-tight text-white group-hover:text-accent-400 truncate">{qr.name}</p>
                         <p className="text-[7px] font-bold text-white/40 uppercase mt-0.5 truncate">{qr.email}</p>
                      </div>
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-accent-400" />
                   </button>
                ))}
              </div>

              <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/30">UC-PPP RDC © 2025</span>
                 <button onClick={() => onLogin('Public', UserRole.PUBLIC)} className="text-[9px] font-black uppercase tracking-widest text-accent-400 flex items-center gap-2 hover:text-white transition-colors">
                   <LogIn size={12}/> Portail Public
                 </button>
              </div>
           </div>
        </div>

        <div className="md:w-1/2 p-8 lg:p-12 bg-white flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-8 text-center">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-1">
                {isSignUp ? "Habilitation" : "Connexion Agent"}
              </h3>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
                {isSignUp ? "Demander un accès officiel" : "Authentification sécurisée"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className={`p-4 rounded-xl flex items-center gap-4 border-l-4 animate-slide-up ${error.includes('INSTRUCTION') ? 'bg-amber-50 border-amber-500 text-amber-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
                   {error.includes('INSTRUCTION') ? <Clock size={20}/> : <ShieldCheck size={20}/>}
                   <p className="text-[9px] font-black uppercase tracking-tight leading-relaxed">{error}</p>
                </div>
              )}

              {isSignUp && (
                <div className="space-y-3 animate-fade-in">
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="text" placeholder="Nom complet (Ex: Jean Mukendi)" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 py-3 text-xs font-bold outline-none" required />
                  </div>
                  
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="text" placeholder="Institution / AC (Ex: ANSER, SNEL)" value={authority} onChange={(e) => setAuthority(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 py-3 text-xs font-bold outline-none" required />
                  </div>

                  <div className="relative">
                    <Landmark size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <select 
                      value={parentMinistry} 
                      onChange={(e) => setParentMinistry(e.target.value)} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-10 py-3 text-[9px] font-black uppercase outline-none appearance-none"
                      required
                    >
                      <option value="">Sélectionner le Ministère de Tutelle</option>
                      <option value="Ministère de l'Énergie">Ministère de l'Énergie</option>
                      <option value="Ministère des ITPR">Ministère des ITPR</option>
                      <option value="Ministère des Transports">Ministère des Transports</option>
                      <option value="Ministère de l'Industrie">Ministère de l'Industrie</option>
                      <option value="Ministère de l'Agriculture">Ministère de l'Agriculture</option>
                      <option value="Ministère de la Santé">Ministère de la Santé</option>
                      <option value="Ministère des Mines">Ministère des Mines</option>
                      <option value="Ministère de l'Économie">Ministère de l'Économie</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-10 py-3 text-[9px] font-black uppercase outline-none appearance-none">
                      {Object.values(UserRole).filter(r => r !== UserRole.PUBLIC && r !== UserRole.ADMIN).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="email" placeholder="Email professionnel" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 py-3 text-xs font-bold outline-none" required />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input ref={passwordInputRef} type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-12 py-3 text-xs font-bold outline-none" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-primary-900 text-white font-black py-4 rounded-2xl shadow-xl uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>{isSignUp ? 'Demander l\'accès' : 'Ouvrir ma session'} <ArrowRight size={16} /></>}
              </button>

              <div className="text-center mt-6">
                <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-[9px] font-black text-primary-600 uppercase underline underline-offset-4 hover:text-primary-800 transition-colors">
                  {isSignUp ? 'Retour à la connexion' : 'Demander une habilitation officielle'}
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
