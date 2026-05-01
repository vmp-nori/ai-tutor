import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GeneratePageClient } from "./GeneratePageClient";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  if (!hasSupabaseConfig()) {
    redirect("/sign-in?callbackUrl=/generate");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?callbackUrl=/generate");
  }

  return <GeneratePageClient />;
}
