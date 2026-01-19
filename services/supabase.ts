
import { createClient } from '@supabase/supabase-js';
import { ProjectStatus } from '../types';

// Configuration Supabase réelle (Production)
const supabaseUrl = 'https://obkpyjzdzdklssfluxak.supabase.co';
const supabaseAnonKey = 'sb_publishable_gSpOLOPKWYyuZX4E28iC-Q_EZzYv3b3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Liste des administrateurs système (Privilèges étendus de visibilité)
// Changement de l'email principal pour résoudre le conflit d'authentification
export const SYSTEM_ADMINS = ['admin-ucppp@uc-ppp.cd', 'uc-ppp@uc-ppp.cd', 'akanyinda@yahoo.fr', 'alkanis2000@gmail.com'];

// Liste blanche des emails de test pour auto-activation
const AUTO_ACTIVATE_EMAILS = [
    'admin-ucppp@uc-ppp.cd', // Nouvel Admin
    'expert-plan@plan.cd', 
    'expert-fin@finance.cd', 
    'expert-bud@budget.cd', 
    'controleur@dgcmp.cd', 
    'chef-projet@snel.cd'
];

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // On s'assure que le profil existe (Sync) si c'est la première connexion
    if (data.user) {
        try {
            await this.syncProfile(data.user, 'Inactive');
        } catch (e) { console.error("Auto-sync profile login error", e); }
    }

    return data;
  },

  async signUp(email: string, password: string, metadata: any) {
    // Utilisation d'un client temporaire isolé pour ne pas écraser la session admin
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    const { data, error } = await tempClient.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    
    // Vérification si le compte doit être auto-activé (Test accounts)
    const shouldAutoActivate = AUTO_ACTIVATE_EMAILS.includes((email || '').toLowerCase());
    const initialStatus = shouldAutoActivate ? 'Active' : 'Inactive';

    if (data.user) {
      if (data.session) {
          const { error: profileError } = await tempClient.from('profiles').insert([{
            id: data.user.id,
            email: (email || '').toLowerCase(),
            full_name: metadata.full_name || email.split('@')[0],
            role: metadata.role || 'Ministère Sectoriel / AC',
            authority: metadata.authority || 'UC-PPP',
            parent_ministry: metadata.parent_ministry || 'Non spécifié',
            status: initialStatus, 
            last_login: new Date().toISOString()
          }]);
          
          if (profileError) {
              console.error("Erreur création profil via tempClient:", profileError);
              try {
                await this.syncProfile(data.user, initialStatus);
              } catch (e) { console.error("Echec total création profil", e); }
          }
      } else {
          try {
            await this.syncProfile(data.user, initialStatus);
          } catch (e) { console.error("Sync profile warning (Admin context):", e); }
      }
    }
    return data;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },

  async resetPasswordEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
    return data;
  },

  async syncProfile(user: any, defaultStatus: 'Active' | 'Inactive' | 'Rejected' = 'Inactive') {
    const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116' && fetchError.code !== '42P01') {
         throw fetchError;
    }

    const metadata = user.user_metadata || {};
    const email = (user.email || '').toLowerCase();
    
    const isCoordinator = email === 'uc-ppp@uc-ppp.cd' || email === 'admin-ucppp@uc-ppp.cd';
    const isSpecificAdmin = email === 'akanyinda@yahoo.fr' || email === 'alkanis2000@gmail.com';
    const isSystemAdmin = isCoordinator || isSpecificAdmin;
    const isTestAccount = AUTO_ACTIVATE_EMAILS.includes(email);
    
    let forcedRole = null;
    if (isCoordinator) forcedRole = 'Coordonnateur UC-PPP';
    if (isSpecificAdmin) forcedRole = 'Administrateur';

    const roleToApply = forcedRole || metadata.role || 'Ministère Sectoriel / AC';
    
    // Logique de statut : Admin et Test Accounts sont toujours Active
    const finalStatus = (isSystemAdmin || isTestAccount) ? 'Active' : defaultStatus;

    if (existing) {
        const updates: any = {
            last_login: new Date().toISOString()
        };
        // Mise à jour forcée du statut pour les admins et comptes de test
        if (isSystemAdmin || isTestAccount) {
            updates.status = 'Active';
        }
        if (forcedRole) updates.role = forcedRole;

        await supabase.from('profiles').update(updates).eq('id', user.id);
    } else {
        await supabase.from('profiles').insert([{
            id: user.id,
            email: email,
            full_name: metadata.full_name || email.split('@')[0] || 'Utilisateur',
            role: roleToApply,
            authority: metadata.authority || 'UC-PPP',
            parent_ministry: metadata.parent_ministry || 'Non spécifié',
            status: finalStatus,
            last_login: new Date().toISOString()
        }]);
    }
  },

  async updateProfileStatus(profileId: string, newStatus: 'Active' | 'Inactive' | 'Rejected') {
    const { error, count } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', profileId)
      .select('id', { count: 'exact' }); // Demande le nombre de lignes modifiées
    
    if (error) throw error;
    if (count === 0) {
        console.warn(`Attention: Aucune ligne mise à jour pour l'ID ${profileId}. Vérifiez les politiques RLS.`);
    }
  },

  async updateProfileDetails(profileId: string, updates: any) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId);
    if (error) throw error;
  },

  async rejectProfile(profileId: string) {
    return this.updateProfileStatus(profileId, 'Rejected');
  },
  
  async deleteAllProfilesExcept(currentUserId: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .neq('id', currentUserId); 
      
    if (error) throw error;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return { data };
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
        if (error.code === '42P01') return [];
        throw error;
    }
    return data || [];
  }
};

export const projectService = {
  async getAllProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        approval_logs (*)
      `)
      .order('updated_at', { ascending: false });
    
    if (error) {
        if (error.code === '42P01') return []; 
        throw error;
    }
    return data || [];
  },

  async createProject(project: any) {
    const dbProject = {
        id: project.id || `UC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title: project.title,
        description: project.description,
        sector: project.sector,
        location: project.location,
        status: project.status,
        contracting_authority: project.authority,
        parent_ministry: project.parentMinistry,
        capex_total: project.capex || 0,
        alignment: project.alignment,
        priority_degree: project.priorityDegree,
        purpose: project.purpose,
        expected_results: project.expectedResults,
        activities: project.activities,
        contractual_form: project.contractualForm,
        duration_years: project.durationYears,
        ppp_justification: project.pppJustification,
        total_cost: project.totalCost,
        opex: project.opex,
        public_contribution_capex: project.publicContributionCapex,
        private_contribution_capex: project.privateContributionCapex,
        public_contribution_opex: project.publicContributionOpex,
        private_contribution_opex: project.privateContributionOpex,
        estimated_revenue: project.estimatedRevenue,
        remuneration_mode: project.remunerationMode,
        gps_coordinates: project.gpsCoordinates,
        impact_zone: project.impactZone,
        legal_framework: project.legalFramework,
        related_projects: project.relatedProjects,
        private_partner: project.privatePartner,
        development_stage: project.developmentStage,
        next_step: project.nextStep,
        contact_person: project.contactPerson,
        progress: project.progress || 0,
        documents: project.documents || []
    };

    const { data, error } = await supabase
      .from('projects')
      .insert([dbProject])
      .select();
    if (error) throw error;
    return data?.[0];
  },

  async updateProjectTechnicalData(projectId: string, project: any) {
    const dbProject: any = {
        title: project.title,
        description: project.description,
        sector: project.sector,
        location: project.location,
        contracting_authority: project.authority,
        parent_ministry: project.parentMinistry,
        capex_total: project.capex || 0,
        alignment: project.alignment,
        priority_degree: project.priorityDegree,
        purpose: project.purpose,
        expected_results: project.expectedResults,
        activities: project.activities,
        contractual_form: project.contractualForm,
        duration_years: project.durationYears,
        ppp_justification: project.pppJustification,
        total_cost: project.totalCost,
        opex: project.opex,
        public_contribution_capex: project.publicContributionCapex,
        private_contribution_capex: project.privateContributionCapex,
        public_contribution_opex: project.publicContributionOpex,
        private_contribution_opex: project.privateContributionOpex,
        estimated_revenue: project.estimatedRevenue,
        remuneration_mode: project.remunerationMode,
        gps_coordinates: project.gpsCoordinates,
        impact_zone: project.impactZone,
        legal_framework: project.legalFramework,
        related_projects: project.relatedProjects,
        private_partner: project.privatePartner,
        development_stage: project.developmentStage,
        next_step: project.nextStep,
        contact_person: project.contactPerson,
        documents: project.documents || [],
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('projects')
      .update(dbProject)
      .eq('id', projectId)
      .select();
    if (error) throw error;
    return data?.[0];
  },

  async updateProjectStatus(projectId: string, newStatus: string, log: any) {
    const { error: projectError } = await supabase
      .from('projects')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', projectId);
    if (projectError) throw projectError;

    if (log) {
        const { error: logError } = await supabase
        .from('approval_logs')
        .insert([{
            project_id: projectId,
            action: log.action,
            comment: log.comment,
            new_status: newStatus,
            actor_id: log.actor 
        }]);
        if (logError) throw logError;
    }
  }
};
