
import { createClient } from '@supabase/supabase-js';

// Note: Dans un environnement réel, l'URL et la clé seraient dans process.env
// Ici nous utilisons la clé fournie par l'utilisateur.
const supabaseUrl = 'https://zvtunfofjwyndujlqfyt.supabase.co'; // URL déduite ou placeholder nécessaire pour l'init
const supabaseAnonKey = 'sb_publishable_gSpOLOPKWYyuZX4E28iC-Q_EZzYv3b3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Service pour mapper les données entre le frontend (CamelCase) 
 * et la base de données PostgreSQL (SnakeCase) définie dans la proposition technique.
 */
export const projectService = {
  async getAllProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        approval_logs (*)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
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
        capex_total: project.capex,
        progress: project.progress || 5
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async updateProjectStatus(projectId: string, newStatus: string, log: any) {
    // 1. Mise à jour du projet
    const { error: projectError } = await supabase
      .from('projects')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (projectError) throw projectError;

    // 2. Ajout du log d'approbation
    const { error: logError } = await supabase
      .from('approval_logs')
      .insert([{
        project_id: projectId,
        action: log.action,
        comment: log.comment,
        new_status: newStatus
      }]);

    if (logError) throw logError;
  }
};
