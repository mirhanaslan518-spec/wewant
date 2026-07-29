import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const payload = await req.json()
    const receiverId = payload.record?.receiver_id

    if (!receiverId) {
      return new Response(JSON.stringify({ error: "no receiver_id" }), { status: 400 })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const supabase = createClient(supabaseUrl!, serviceRoleKey!)

    const { data: profile } = await supabase
      .from("profiles")
      .select("expo_push_token")
      .eq("id", receiverId)
      .single()

    if (!profile?.expo_push_token) {
      return new Response(JSON.stringify({ skipped: "no token" }), { status: 200 })
    }

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: profile.expo_push_token,
        sound: "default",
        title: "",
        body: "Seni düşünüyor",
      }),
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
