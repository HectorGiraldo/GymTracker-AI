import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  async generateRoutine(params: any): Promise<any> {
    try {
      // Soporte para AI Studio (GEMINI_API_KEY global) y para producción en Coolify (window.__ENV__)
      let apiKey = '';
      try {
        apiKey = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
      } catch (e) {}
      
      if (!apiKey) {
        apiKey = (window as any).__ENV__?.GEMINI_API_KEY || '';
      }

      if (!apiKey) {
        throw new Error('API Key de Gemini no encontrada. Configura GEMINI_API_KEY en las variables de entorno.');
      }

      const ai = new GoogleGenAI({ apiKey });

      const userContextStr = params.userContext 
        ? `\n    - Contexto del usuario: Nombre: ${params.userContext.name || 'No especificado'}, Peso: ${params.userContext.weight || 'No especificado'} kg, Altura: ${params.userContext.height || 'No especificado'} cm.`
        : '';

      const prompt = `
        Genera una rutina de gimnasio con los siguientes parámetros:
        - Días por semana: ${params.days}
        - Nivel: ${params.level}
        - Objetivo: ${params.objective}
        - Equipamiento: ${params.equipment}
        - Duración por sesión: ${params.duration} minutos
        - Zonas a priorizar: ${params.muscles || 'Ninguna'}
        - Lesiones/Limitaciones: ${params.injuries || 'Ninguna'}${userContextStr}

        REGLAS ESTRICTAS PARA EVITAR CORTES EN LA RESPUESTA:
        1. Genera un MÁXIMO de 5 ejercicios por día.
        2. Las descripciones deben ser de 3 a 5 palabras máximo.
        3. Asegúrate de cerrar correctamente todas las llaves y corchetes del JSON.
      `;

      const systemInstruction = `
        Eres "GymTracker AI", un entrenador personal.
        DEBES responder ÚNICA Y EXCLUSIVAMENTE con un objeto JSON válido.
        Las descripciones de los ejercicios deben ser de MÁXIMO 10 palabras.
        No incluyas NINGUNA información redundante. Sé extremadamente breve.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rutina_nombre: { type: Type.STRING },
              dias: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nombre_dia: { type: Type.STRING },
                    calentamiento: { type: Type.STRING },
                    ejercicios: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          nombre: { type: Type.STRING },
                          series: { type: Type.INTEGER },
                          repeticiones: { type: Type.STRING },
                          descanso: { type: Type.INTEGER },
                          desc: { type: Type.STRING }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error('Error generating routine with AI:', error);
      throw error;
    }
  }
}
