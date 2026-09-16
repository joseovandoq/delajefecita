export function Proximamente({ modulo }: { modulo: string }) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">{modulo}</h1>
      <p className="text-muted-foreground">
        Este módulo todavía no está construido. Próximamente.
      </p>
    </div>
  );
}
