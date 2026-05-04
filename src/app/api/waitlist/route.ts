import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address.", code: "invalid_email" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("waitlist")
      .insert({ email });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "That email is already on the list.", code: "duplicate" }, { status: 409 });
      }
      console.error("Waitlist insert error:", error);
      return NextResponse.json({ error: "Something went wrong on our end. Try again in a moment.", code: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Waitlist route error:", err);
    return NextResponse.json({ error: "Something went wrong on our end. Try again in a moment.", code: "server_error" }, { status: 500 });
  }
}
