import { redirect } from "next/navigation";

// Temporary: redirect root to dashboard while we build auth
export default function Home() {
  redirect("/dashboard");
}
