"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function entrarConGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/portal/auth/callback`,
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>De La Jefecita</CardTitle>
          <CardDescription>Acceso privado para socios del negocio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={entrarConGoogle} disabled={loading}>
            {loading ? "Redirigiendo…" : "Entrar con Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
