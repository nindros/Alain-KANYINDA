
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://obkpyjzdzdklssfluxak.supabase.co';
const supabaseAnonKey = 'sb_publishable_gSpOLOPKWYyuZX4E28iC-Q_EZzYv3b3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Synchro du profil à la connexion pour mettre à jour la date
    if (data.user) {
      await this.syncProfile(data.user);
    }
    return data;
  },

  async signUp(email: string, password: string, metadata: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    if (data.user) {
      // Pour un auto-enregistrement, on peut définir un statut 'Inactive' par défaut
      await this.syncProfile(data.user, metadata.is_manual_admin ? 'Active' : 'Inactive');
    }
    return data;
  },

  async syncProfile(user: any, defaultStatus: 'Active' | 'Inactive' = 'Active') {
    // Vérifier si le profil existe déjà pour ne pas écraser le statut 'Active'
    const { data: existing } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata.full_name,
        role: user.user_metadata.role,
        authority: user.user_metadata.authority,
        status: existing?.status || defaultStatus,
        last_login: new Date().toISOString()
      });
    if (error) console.error("Erreur synchro profil:", error.message);
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data;
  }
};

export const projectService = {
  async getAllProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`*, approval_logs (*)`)
      .order('updated_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async createProject(project: any) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        id: project.id,
        title: project.title,
        description: project.description,
        sector: project.sector,
        location: project.location,
        status: project.status,
        contracting_authority: project.authority,
        parent_ministry: project.parentMinistry,
        capex_total: project.capex || 0,
        progress: project.progress || 5
      }])
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
};
