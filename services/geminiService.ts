
import { GoogleGenAI } from "@google/genai";
import { Project } from "../types";

// Standardizing @google/genai usage following senior engineer guidelines.

export const generateProjectRiskAnalysis = async (project: Project): Promise<string> => {
  try {
    // Always use { apiKey: process.env.API_KEY } for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Using gemini-3-pro-preview for complex reasoning and expert analysis tasks
    // Using systemInstruction for role definition as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analysez les données du projet suivant :
      Titre: ${project.title}
      Secteur: ${project.sector}
      Description: ${project.description}
      CAPEX: ${project.capex} USD
      OPEX: ${project.opex} USD
      Durée: ${project.durationYears} ans
      Localisation: ${project.location}

      Veuillez fournir une analyse concise contenant :
      1. Trois risques majeurs potentiels (financiers, socio-politiques ou techniques).
      2. Une stratégie d'atténuation pour chaque risque.
      3. Une note de risque estimée sur 100 (où 100 est très risqué).

      Formatez la réponse en HTML simple (utilisez <ul>, <li>, <strong>, <p>).`,
      config: {
        systemInstruction: "Agissez en tant qu'expert international en gestion de projets Partenariat Public-Privé (PPP) pour le gouvernement de la RDC.",
      },
    });

    // Access .text property directly as per latest SDK guidelines
    return response.text || "Impossible de générer l'analyse.";
  } catch (error) {
    console.error("Error generating risk analysis:", error);
    return "Erreur lors de la communication avec l'assistant IA.";
  }
};

export const generatePublicSummary = async (project: Project): Promise<string> => {
  try {
    // Always use { apiKey: process.env.API_KEY } for initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Using gemini-3-flash-preview for general purpose text summarization tasks
    // Moving context to systemInstruction for clearer task definition
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Projet: ${project.title}
      Description technique: ${project.description}
      Secteur: ${project.sector}`,
      config: {
        systemInstruction: "Résumez ce projet d'infrastructure pour le grand public citoyen de la RDC. Utilisez un langage simple, transparent et rassurant. Expliquez les bénéfices directs pour la population.",
      },
    });

    // Access .text property directly as per latest SDK guidelines
    return response.text || "Résumé non disponible.";
  } catch (error) {
    console.error("Error generating public summary:", error);
    return "Erreur de génération du résumé.";
  }
};
