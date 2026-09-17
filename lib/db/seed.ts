import { db } from "./index";
import { socios, productos, ubicaciones, proveedores } from "./schema";

async function seed() {
  await db
    .insert(socios)
    .values({
      nombre: "Jose",
      email: "jose.ovando1@gmail.com",
      rol: "admin",
    })
    .onConflictDoNothing();

  await db
    .insert(productos)
    .values([
      { nombre: "Salsa roja" },
      { nombre: "Salsa verde" },
      { nombre: "Salsa habanera" },
    ])
    .onConflictDoNothing();

  await db
    .insert(ubicaciones)
    .values([{ nombre: "Bodega casa" }, { nombre: "Refrigerador tienda" }])
    .onConflictDoNothing();

  await db
    .insert(proveedores)
    .values([{ nombre: "HEB" }, { nombre: "Plastikart" }, { nombre: "Papelería" }])
    .onConflictDoNothing();

  console.log("Seed completado.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
