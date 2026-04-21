import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, context } = await req.json();

        // context should contain clientName, jobTitle, etc.
        
        let prompt = "";
        if (type === 'review_request') {
            prompt = `Write a polite, friendly, and professional text message (short) and email subject/body (longer) asking for a review from a client named ${context.clientName}. 
            The job "${context.jobTitle}" was just completed. 
            Mention that it was a pleasure working with them.
            Return ONLY a JSON object with keys: "sms_text", "email_subject", "email_body".`;
        } else if (type === 'on_my_way') {
            // Usually pre-written, but if we want AI flair:
            prompt = `Write a friendly "On my way" text message to ${context.clientName}. 
            My ETA is ${context.eta || 'soon'}. 
            Return ONLY a JSON object with keys: "sms_text".`;
        }

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    sms_text: { type: "string" },
                    email_subject: { type: "string" },
                    email_body: { type: "string" }
                }
            }
        });

        return Response.json(response);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});