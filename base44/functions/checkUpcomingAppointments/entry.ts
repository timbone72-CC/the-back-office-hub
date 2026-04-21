import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { differenceInHours } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Fetch active scheduled appointments
        const appointments = await base44.asServiceRole.entities.ClientScheduleLead.filter({
            status: 'scheduled'
        });

        const now = new Date();
        const notificationsSent = [];

        for (const appointment of appointments) {
            if (!appointment.date) continue;
            
            const appointmentDate = new Date(appointment.date);
            const hoursUntil = differenceInHours(appointmentDate, now);

            // Check if appointment is roughly 3 hours away (e.g., between 2 and 4 to be safe with cron frequency)
            // Since we poll from the frontend, we need a wider window or state to avoid duplicate alerts.
            // For this POC, we'll just check if it's within the 3 hour window (3 to 4 hours)
            if (hoursUntil === 3) {
                // Fetch client details
                let clientName = "Unknown Client";
                if (appointment.client_profile_id) {
                     const clients = await base44.asServiceRole.entities.ClientProfile.filter({
                        id: appointment.client_profile_id
                    });
                    if (clients.length > 0) clientName = clients[0].name;
                }

                // Send Email Notification
                // We need a recipient. We'll try to get the app owner or just use a placeholder if not available.
                // In a real scenario, we'd have a User Settings or Profile to pull email from.
                // Here we will use the `SendEmail` integration to the current user (if invoked by user) or fail gracefully.
                // Since this is called from Layout (User context), we can use `base44.auth.me()`? 
                // Wait, this function uses `asServiceRole` so it might not have user context if called by system.
                // But we are calling it from frontend Layout, so `req` has user auth.
                
                try {
                    const user = await base44.auth.me();
                    if (user && user.email) {
                        await base44.integrations.Core.SendEmail({
                            to: user.email,
                            subject: `Reminder: Appointment with ${clientName} in 3 hours`,
                            body: `You have an appointment scheduled for ${new Date(appointment.date).toLocaleString()}. \n\nClient: ${clientName}\nTask: ${appointment.title}`
                        });
                        notificationsSent.push(`Email sent to ${user.email} for appointment ${appointment.id}`);
                    }
                } catch (e) {
                    console.error("Failed to send email", e);
                }
            }
        }

        return Response.json({ 
            success: true, 
            notifications_triggered: notificationsSent 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});