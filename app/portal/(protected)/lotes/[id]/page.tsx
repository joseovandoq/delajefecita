import { notFound } from "next/navigation";
import { LoteForm } from "../lote-form";
import { actualizarLote } from "../actions";
import { obtenerLote, listarProductosActivos, listarUbicaciones } from "../queries";

export default async function EditarLotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lote, productos, ubicaciones] = await Promise.all([
    obtenerLote(id),
    listarProductosActivos(),
    listarUbicaciones(),
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
        action={actionConId}
        submitLabel="Guardar cambios"
        defaultValues={{
          productoId: lote.productoId,
          cantidad: lote.cantidad,
          unidad: lote.unidad,
          fechaProduccion: lote.fechaProduccion,
          fechaCaducidad: lote.fechaCaducidad,
          ubicacionId: lote.ubicacionId,
          notas: lote.notas,
        }}
      />
    </div>
  );
}
