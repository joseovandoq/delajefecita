import { notFound } from "next/navigation";
import { LoteForm } from "../lote-form";
import { actualizarLote } from "../actions";
import {
  obtenerLote,
  listarProductosActivos,
  listarUbicaciones,
  listarInsumosActivos,
  listarConsumoDeLote,
  listarRecetaPorProducto,
} from "../queries";

export default async function EditarLotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lote, productos, ubicaciones, insumos, consumo, recetas] = await Promise.all([
    obtenerLote(id),
    listarProductosActivos(),
    listarUbicaciones(),
    listarInsumosActivos(),
    listarConsumoDeLote(id),
    listarRecetaPorProducto(),
  ]);

  if (!lote) {
    notFound();
  }

  const actionConId = actualizarLote.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Editar lote</h1>
      <LoteForm
        productos={productos}
        ubicaciones={ubicaciones}
        insumos={insumos}
        recetas={recetas}
        action={actionConId}
        submitLabel="Guardar cambios"
        defaultValues={{
          productoId: lote.productoId,
          cantidad: lote.cantidad,
          unidad: lote.unidad,
          numeroRecetas: lote.numeroRecetas,
          fechaProduccion: lote.fechaProduccion,
          fechaCaducidad: lote.fechaCaducidad,
          ubicacionId: lote.ubicacionId,
          notas: lote.notas,
        }}
        defaultConsumo={consumo}
      />
    </div>
  );
}
