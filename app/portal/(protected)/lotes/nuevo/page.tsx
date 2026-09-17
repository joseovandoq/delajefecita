import { LoteForm } from "../lote-form";
import { crearLote } from "../actions";
import {
  listarProductosActivos,
  listarUbicaciones,
  listarInsumosActivos,
  listarRecetaPorProducto,
} from "../queries";

export default async function NuevoLotePage() {
  const [productos, ubicaciones, insumos, recetas] = await Promise.all([
    listarProductosActivos(),
    listarUbicaciones(),
    listarInsumosActivos(),
    listarRecetaPorProducto(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Registrar lote</h1>
      <LoteForm
        productos={productos}
        ubicaciones={ubicaciones}
        insumos={insumos}
        recetas={recetas}
        action={crearLote}
        submitLabel="Registrar lote"
      />
    </div>
  );
}
