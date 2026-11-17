import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';
const DATA_DIR = path.resolve(__dirname, '.data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

function readSessionsStore(): Record<string, unknown> {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return {};
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeSessionsStore(store: Record<string, unknown>): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY no está configurada en el servidor. Configúrala en Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, model: MODEL_NAME });
  });

  // Persistencia de avances y memoria del estudiante entre sesiones
  app.get('/api/session/:sessionId', (req, res) => {
    const id = req.params.sessionId.trim();
    if (!id) {
      res.status(400).json({ error: 'Código de sesión inválido.' });
      return;
    }
    const store = readSessionsStore();
    if (!store[id]) {
      res.status(404).json({ error: 'No se encontró una sesión guardada con ese código.' });
      return;
    }
    res.json({ sessionId: id, state: store[id] });
  });

  app.put('/api/session/:sessionId', (req, res) => {
    const id = req.params.sessionId.trim();
    if (!id || !req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Datos de sesión inválidos.' });
      return;
    }
    const store = readSessionsStore();
    store[id] = req.body;
    writeSessionsStore(store);
    res.json({ ok: true, sessionId: id, savedAt: new Date().toISOString() });
  });

  // 1. Estudio de posibles negocios y propuesta de modelos personalizados basados en la pasión del estudiante
  app.post('/api/gemini/passion-study', async (req, res) => {
    try {
      const { passion, studentName, budgetPreference, region } = req.body ?? {};
      if (!passion || typeof passion !== 'string' || passion.trim().length < 4) {
        res.status(400).json({ error: 'Describe primero qué amas hacer (al menos 4 caracteres).' });
        return;
      }

      const ai = getGeminiClient();
      const prompt = `Eres un consultor senior de emprendimiento en Costa Rica.
Un estudiante llamado "${studentName || 'Estudiante'}" ama hacer lo siguiente:
"${passion.trim()}"
Región o contexto: ${region || 'Costa Rica'}
Preferencia de inicio: ${budgetPreference || 'Empezar en pequeño con inversión realista'}

Realiza un estudio de los posibles negocios relacionados con su pasión y propón exactamente 4 modelos de negocio distintos, realistas para Costa Rica (en colones costarricenses ₡, considerando el entorno PyME costarricense: SINPE Móvil, Hacienda, CCSS, municipalidades).
Responde en español claro, práctico y motivador.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              passionAnalysis: {
                type: Type.STRING,
                description: 'Análisis breve (2-3 oraciones) del potencial comercial de la pasión del estudiante en Costa Rica.',
              },
              businessModels: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    tagline: { type: Type.STRING },
                    description: { type: Type.STRING },
                    valueProposition: { type: Type.STRING },
                    targetAudience: { type: Type.STRING },
                    revenueStreams: { type: Type.ARRAY, items: { type: Type.STRING } },
                    estimatedInitialCostCRC: { type: Type.INTEGER },
                    estimatedMonthlyRevenueCRC: { type: Type.INTEGER },
                    timeToBreakevenMonths: { type: Type.INTEGER },
                    difficulty: { type: Type.STRING },
                    keyTools: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommendedLegalForm: { type: Type.STRING },
                  },
                  required: [
                    'id',
                    'name',
                    'tagline',
                    'description',
                    'valueProposition',
                    'targetAudience',
                    'revenueStreams',
                    'estimatedInitialCostCRC',
                    'estimatedMonthlyRevenueCRC',
                    'timeToBreakevenMonths',
                    'difficulty',
                    'keyTools',
                    'recommendedLegalForm',
                  ],
                },
              },
            },
            required: ['passionAnalysis', 'businessModels'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al consultar Gemini.';
      console.error('Error /api/gemini/passion-study:', message);
      res.status(500).json({ error: message });
    }
  });

  // 2. Agente de IA Mentor en tiempo real con memoria persistente de avances
  app.post('/api/gemini/mentor', async (req, res) => {
    try {
      const { messages, projectContext } = req.body ?? {};
      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Se requiere al menos un mensaje para el agente.' });
        return;
      }

      const ai = getGeminiClient();
      const systemInstruction = `Eres "Mentor Gemini EmprendeCR", un agente de IA académico con memoria persistente que guía en tiempo real a estudiantes en Costa Rica mientras construyen su empresa simulada y el "Informe final : Toma de decision gerencial para construir una empresa".

Contexto y memoria actual del estudiante:
${JSON.stringify(projectContext ?? {}, null, 2)}

Reglas de guía:
1. Responde siempre en español con tono cercano, claro, estructurado y práctico.
2. Orienta específicamente al contexto real de Costa Rica cuando corresponda (Ministerio de Hacienda / IVA 13% / Renta / Factura electrónica, CCSS, INS Riesgos del Trabajo, Patente Municipal, Ministerio de Salud, MEIC PYME, y bancos como BNCR, BCR, BAC Credomatic y Banco Popular / SBD).
3. Conecta tus recomendaciones con la Rúbrica de Sistema de Información Gerencial (objetivos estratégicos, entorno, recursos tecnológicos, respaldo de especialista, tecnología imperante, trabajo colaborativo, APA 7.ª ed., retroalimentación).
4. Además de tu respuesta ("reply"), genera un "memoryNote" breve (1 oración, máximo 16 palabras) si el estudiante compartió un avance o decisión nueva importante para recordarla en futuras sesiones (o cadena vacía si es una consulta general).`;

      const conversationText = messages
        .slice(-10)
        .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Estudiante' : 'Mentor'}: ${m.content}`)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: conversationText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              memoryNote: { type: Type.STRING },
            },
            required: ['reply', 'memoryNote'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        reply: parsed.reply ?? 'No se pudo generar respuesta.',
        memoryNote: typeof parsed.memoryNote === 'string' ? parsed.memoryNote.trim() : '',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error en el agente Gemini.';
      console.error('Error /api/gemini/mentor:', message);
      res.status(500).json({ error: message });
    }
  });

  // 3. Asistente puntual para ayudar al estudiante a redactar o mejorar una de las 40 preguntas
  app.post('/api/gemini/question-coach', async (req, res) => {
    try {
      const { questionNumber, questionTitle, questionPrompt, currentAnswer, companyContext } = req.body ?? {};
      if (!questionPrompt) {
        res.status(400).json({ error: 'Falta el enunciado de la pregunta.' });
        return;
      }

      const ai = getGeminiClient();
      const prompt = `Ayuda al estudiante a responder o mejorar la Pregunta #${questionNumber} (${questionTitle}) de su plan de negocios en Costa Rica.
Pregunta: "${questionPrompt}"
Respuesta actual del estudiante: "${currentAnswer || '(Aún sin respuesta)'}"
Contexto de su empresa: ${JSON.stringify(companyContext ?? {})}

Genera:
1) Un borrador guía personalizado (3-5 líneas concretas que el estudiante pueda adaptar o usar como punto de partida).
2) 2 consejos clave para obtener nivel 4 en la rúbrica SIG.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedDraft: { type: Type.STRING },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['suggestedDraft', 'tips'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al asistir la pregunta.';
      console.error('Error /api/gemini/question-coach:', message);
      res.status(500).json({ error: message });
    }
  });

  // 4. Evaluación automática con Gemini de la Rúbrica SIG (10 criterios x 4 pts = 40 pts) + comentario explicativo
  app.post('/api/gemini/evaluate-rubric', async (req, res) => {
    try {
      const { projectSummary } = req.body ?? {};
      if (!projectSummary) {
        res.status(400).json({ error: 'Faltan los datos del proyecto para evaluar.' });
        return;
      }

      const ai = getGeminiClient();
      const prompt = `Evalúa de manera rigurosa, justa y pedagógica la propuesta de plan de negocios y sistema de información gerencial del estudiante según los 10 criterios oficiales (escala de 1 a 4 por criterio, máximo 40 puntos):

1. Ajuste a los objetivos estratégicos
2. Consideración del entorno empresarial
3. Determinación de recursos tecnológicos
4. Respaldo de un especialista
5. Respuesta a la tecnología imperante
6. Trabajo colaborativo
7. Uso de la tecnología
8. Uso del APA
9. Estilo y redacción
10. Uso de la retroalimentación del docente

Datos y respuestas del estudiante:
${JSON.stringify(projectSummary)}

Reglas:
- Si muchas preguntas están vacías o incompletas, asigna puntajes reales (1 o 2) y explícalo con respeto y claridad.
- Si las respuestas están completas, fundamentadas y adaptadas a Costa Rica con APA y SIG, asigna 3 o 4 según corresponda.
- El comentario final debe explicar con precisión la puntuación total asignada sobre 40 puntos.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              criteria: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    score: { type: Type.INTEGER },
                    justification: { type: Type.STRING },
                  },
                  required: ['id', 'score', 'justification'],
                },
              },
              finalComment: { type: Type.STRING },
            },
            required: ['criteria', 'finalComment'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al evaluar rúbrica con Gemini.';
      console.error('Error /api/gemini/evaluate-rubric:', message);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EmprendeCR Studio running on http://localhost:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
