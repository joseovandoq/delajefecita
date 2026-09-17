"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

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
        <CardHeader className="items-center justify-items-center text-center">
          <Image
            src="/logo.png"
            alt="De La Jefecita"
            width={200}
            height={200}
            className="mb-2 w-28 rounded-xl"
            priority
          />
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
