import { InsumoForm } from "../insumo-form";
import { crearInsumo } from "../actions";
import { listarProveedoresActivos, listarUbicaciones } from "../queries";

export default async function NuevoInsumoPage() {
  const [proveedores, ubicaciones] = await Promise.all([
    listarProveedoresActivos(),
    listarUbicaciones(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Nuevo insumo</h1>
      <InsumoForm
        proveedores={proveedores}
        ubicaciones={ubicaciones}
        action={crearInsumo}
        submitLabel="Crear insumo"
        mostrarStockInicial
      />
    </div>
  );
}
