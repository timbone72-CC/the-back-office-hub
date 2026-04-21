import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const { notes } = await req.json();

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return Response.json({ keywords: [] });
    }

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract construction material preferences from these client notes: "${notes}".
Return a JSON with a "keywords" array containing specific material names or types mentioned as preferences (e.g. "Cedar", "PEX", "Granite").
Ignore general preferences unrelated to materials.`,
      response_json_schema: {
        type: "object",
        properties: {
          keywords: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json(res);
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});