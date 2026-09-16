import { LoteForm } from "../lote-form";
import { crearLote } from "../actions";
import { listarProductosActivos, listarUbicaciones } from "../queries";

export default async function NuevoLotePage() {
  const [productos, ubicaciones] = await Promise.all([
    listarProductosActivos(),
    listarUbicaciones(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Registrar lote</h1>
      <LoteForm
        productos={productos}
        ubicaciones={ubicaciones}
        action={crearLote}
        submitLabel="Registrar lote"
      />
    </div>
  );
}
