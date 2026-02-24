/**
 * /api/chat
 * Server-side proxy to OpenAI — keeps the API key off the client.
 *
 * Features:
 *  - Rich system prompt with full Lixan company knowledge
 *  - OpenAI function calling: capturar_prospecto → saved to Sanity via /api/save-lead
 *  - Natural Colombian Spanish tone, no hallucinations
 *  - Escalates to WhatsApp (+573124843933) or Cal.com booking
 *
 * POST body: { messages: Array<{ role: 'user'|'assistant', content: string }> }
 * Response:  { reply: string } | { error: string }
 */
import type { APIRoute } from 'astro';
import OpenAI from 'openai';

// ─────────────────────────────────────────────────────────────
// System prompt — full company knowledge
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres el asistente virtual de Lixan (lixantech.com), una agencia colombiana de automatizaciones y diseño web.

SOBRE LIXAN
Trabajamos con pequeñas y medianas empresas que quieren crecer sin contratar más personal ni quedar atrapadas en procesos manuales. Construimos soluciones digitales concretas, bien hechas y entregadas a tiempo. Somos un equipo pequeño: trato directo, sin intermediarios.

SERVICIOS
1. Landing Pages — páginas de alta conversión, carga ultrarrápida, optimizadas para captura de leads y ventas.
2. Sitios Web Corporativos — presencia digital con gestor de contenido propio, sin plugins lentos ni dependencia de terceros.
3. Automatizaciones — flujos automáticos con Make y N8N: formularios, notificaciones, CRMs, reportes, sincronización de datos.
4. IA & Chatbots — asistentes de atención 24/7, calificadores de leads, bots de soporte interno con inteligencia artificial.
5. CMS & Dashboards — paneles de gestión a medida, sin herramientas genéricas con el 80% de funciones que nunca vas a usar.
6. Integraciones — conectamos las herramientas que ya usas: HubSpot, Shopify, WhatsApp Business, Notion, Airtable, Google Sheets, email y más.

PROCESO DE TRABAJO
1. Diagnóstico (llamada gratuita 30 min): entendemos el negocio, las herramientas y el problema real. Sin demo de ventas.
2. Propuesta (en 48 horas): alcance, entregables y precio fijo. Sabés exactamente qué vas a recibir antes de comprometerte.
3. Construcción (2–4 semanas): actualizaciones semanales reales, no informes vacíos que dicen "en progreso".
4. Entrega y soporte: documentación completa + 30 días de garantía post-entrega sin costo adicional.

GARANTÍAS Y DIFERENCIADORES
- Precio fijo: el precio acordado es el precio final, sin sorpresas ni cobros extra.
- Respuesta garantizada menor a 24h: si tenés una duda durante el proyecto, respondemos antes de 24 horas.
- 30 días post-entrega: ajustes y correcciones sin costo adicional por 30 días.
- Sin código spaghetti: construimos para que dure, con documentación clara.
- Sin agencias enormes: equipo pequeño, trato directo, sin burocracia.

CONTACTO Y CANALES PRINCIPALES
- WhatsApp (canal preferido): https://wa.me/573124843933 — para consultas rápidas y arrancar conversaciones
- Agendar llamada gratuita de 30 min: en el calendario de la página web (sección #agendar)
- Email: hola@lixantech.com
- Instagram: @lixan_col

INSTRUCCIONES DE COMPORTAMIENTO
- Sé natural y cercano, como un asesor de confianza, no como un robot de FAQ.
- Usá "usted" en tono informal pero respetuoso (estilo colombiano natural). Podés tutear si el usuario tutea primero.
- Hacé preguntas de seguimiento para entender mejor al usuario antes de proponer soluciones.
- Podés usar algo de calidez cuando sea apropiado, sin exagerar.
- Sé conciso: máximo 3 oraciones por respuesta. Si podés decirlo en 2 y hacer una pregunta, mejor.
- NUNCA inventes precios exactos, clientes reales, métricas o casos de éxito específicos.
- Si no sabés algo, decí: "No tengo esa información, pero nuestro equipo la puede resolver. ¿Le comparto el WhatsApp?"
- Cuando el usuario muestre interés real, invitalo con entusiasmo a WhatsApp (https://wa.me/573124843933) o a agendar llamada en la sección #agendar de la página.

CAPTURA DE PROSPECTOS
- Cuando el usuario haya dado su nombre Y al menos un dato de contacto (email o teléfono), llamá a la función capturar_prospecto.
- Pedí el nombre de forma natural: "¿Con quién tengo el gusto?" o "¿Cómo le puedo llamar?"
- Pedí email o teléfono solo cuando la conversación fluya naturalmente y el usuario muestre interés real.
- No insistas más de una vez por el mismo dato de contacto.
- Después de guardar, seguí la conversación con normalidad.

Respondé siempre en español colombiano natural. Nunca rompas el personaje.`;

// ─────────────────────────────────────────────────────────────
// Tool definitions
// ─────────────────────────────────────────────────────────────
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'capturar_prospecto',
      description:
        'Guarda los datos de contacto de un prospecto interesado en el CRM. Llamá esta función cuando el usuario haya dado su nombre Y al menos un dato de contacto (email o teléfono), o cuando haya expresado interés claro en un servicio y proporcionado su nombre.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Nombre del prospecto',
          },
          email: {
            type: 'string',
            description: 'Email del prospecto (si lo proporcionó)',
          },
          phone: {
            type: 'string',
            description: 'Teléfono del prospecto (si lo proporcionó)',
          },
          interest: {
            type: 'string',
            enum: ['landing_page', 'sitio_web', 'automatizacion', 'chatbot', 'cms', 'integracion', 'otro'],
            description: 'Servicio o área de interés principal',
          },
          notes: {
            type: 'string',
            description: 'Resumen breve del problema o necesidad que describió el usuario',
          },
        },
        required: ['name', 'interest', 'notes'],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Chat no disponible en este momento.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { messages?: unknown[] };
  try {
    body = await request.json() as { messages?: unknown[] };
  } catch {
    return new Response(
      JSON.stringify({ error: 'Solicitud inválida.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Se requiere al menos un mensaje.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Keep last 12 turns max to control token usage
  const recent = messages.slice(-12) as OpenAI.ChatCompletionMessageParam[];

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...recent,
      ],
      tools,
      tool_choice: 'auto',
      max_tokens: 400,
      temperature: 0.72,
    });

    const choice = completion.choices[0];

    // ── Handle tool calls (lead capture) ──────────────────────
    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls?.length) {
      const toolCall = choice.message.tool_calls[0];
      let toolResult = 'ok';

      if (toolCall.function.name === 'capturar_prospecto') {
        try {
          const args = JSON.parse(toolCall.function.arguments) as {
            name: string;
            email?: string;
            phone?: string;
            interest: string;
            notes: string;
          };

          // Save lead to Sanity via the save-lead endpoint
          const origin = new URL(request.url).origin;
          const saveRes = await fetch(`${origin}/api/save-lead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args),
          });

          toolResult = saveRes.ok
            ? 'Prospecto guardado correctamente en el CRM.'
            : 'No se pudo guardar el prospecto (error de CMS).';
        } catch {
          toolResult = 'Error al guardar el prospecto.';
        }
      }

      // Second call: let the model respond after the tool result
      const followup = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...recent,
          choice.message,
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult,
          },
        ],
        max_tokens: 400,
        temperature: 0.72,
      });

      const reply = followup.choices[0]?.message?.content?.trim() ?? '';
      return new Response(
        JSON.stringify({ reply }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Normal text reply ──────────────────────────────────────
    const reply = choice.message?.content?.trim() ?? '';
    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[/api/chat] OpenAI error:', err);
    return new Response(
      JSON.stringify({ error: 'No se pudo obtener respuesta. Intenta de nuevo.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
