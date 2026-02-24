import "@supabase/functions-js/edge-runtime.d.ts";

const INFOBIP_BASE_URL = Deno.env.get("INFOBIP_BASE_URL")!;
const INFOBIP_API_KEY = Deno.env.get("INFOBIP_API_KEY")!;
const INFOBIP_SENDER = Deno.env.get("INFOBIP_SENDER") || "VERONA";

interface SendSmsPayload {
    user: {
        id: string;
        phone: string;
    };
    sms: {
        otp: string;
    };
}

Deno.serve(async (req) => {
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    try {
        const payload: SendSmsPayload = await req.json();
        const { phone } = payload.user;
        const { otp } = payload.sms;

        if (!phone || !otp) {
            console.error("Missing phone or otp in payload");
            return new Response(
                JSON.stringify({ error: "Missing phone or otp" }),
                { status: 400 }
            );
        }

        const response = await fetch(`https://${INFOBIP_BASE_URL}/sms/3/messages`, {
            method: "POST",
            headers: {
                Authorization: `App ${INFOBIP_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: [
                    {
                        sender: INFOBIP_SENDER,
                        destinations: [{ to: phone }],
                        content: {
                            text: `Tu codigo de verificacion VERONA es: ${otp}. Expira en 60 segundos.`,
                        },
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Infobip error [${response.status}]: ${errorBody}`);
            return new Response(
                JSON.stringify({ error: "Failed to send SMS" }),
                { status: response.status }
            );
        }

        const result = await response.json();
        console.log("SMS sent:", result.messages?.[0]?.messageId);

        return new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Unexpected error:", err);
        return new Response(
            JSON.stringify({ error: "Internal error" }),
            { status: 500 }
        );
    }
});
