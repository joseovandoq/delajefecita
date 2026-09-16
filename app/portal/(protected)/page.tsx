import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-6 text-muted-foreground">
        Control de operación de De La Jefecita.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/portal/lotes">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle>Lotes de producción</CardTitle>
              <CardDescription>
                Cuándo y cuánta salsa se hizo, caducidad y ubicación.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
