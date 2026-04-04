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
        Genera una rutina de gimnasio estructurada y realista con los siguientes parámetros:
        - Días por semana: ${params.days}
        - Nivel: ${params.level}
        - Objetivo: ${params.objective}
        - Equipamiento: ${params.equipment}
        - Duración por sesión: ${params.duration} minutos
        - Zonas a priorizar: ${params.muscles || 'Ninguna'}
        - Lesiones/Limitaciones: ${params.injuries || 'Ninguna'}${userContextStr}

        REGLAS ESTRICTAS:
        1. Genera un MÁXIMO de 5 ejercicios por día.
        2. Las descripciones deben ser MUY CORTAS (máximo 5 palabras).
        3. DEBES devolver ÚNICAMENTE un JSON válido con esta estructura exacta:
        {
          "rutina_nombre": "Nombre",
          "objetivo": "Objetivo",
          "nivel": "Nivel",
          "dias": [
            {
              "dia_numero": 1,
              "nombre_dia": "Día 1",
              "duracion_estimada_minutos": 60,
              "calentamiento": {
                "descripcion": "Breve",
                "duracion_minutos": 10,
                "ejercicios_calentamiento": ["Ej 1", "Ej 2"]
              },
              "ejercicios": [
                {
                  "orden": 1,
                  "nombre": "Nombre Ej",
                  "musculo_principal": "Músculo",
                  "series": 3,
                  "repeticiones": "10-12",
                  "descanso_segundos": 60,
                  "peso_sugerido": "Moderado",
                  "descripcion_completa": "Breve desc"
                }
              ]
            }
          ],
          "notas_generales": "Notas",
          "frecuencia_progresion": "Progresión"
        }
      `;

      const systemInstruction = `
        Eres "GymTracker AI", un entrenador personal experto.
        DEBES responder ÚNICA Y EXCLUSIVAMENTE con un objeto JSON válido. NO uses bloques de código markdown (\`\`\`json).
        Sé extremadamente breve en los textos para evitar que la respuesta se corte.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '{}';
      console.log('Raw AI Response:', text);
      return JSON.parse(text);
    } catch (error) {
      console.error('Error generating routine with AI:', error);
      throw error;
    }
  }
}
