# De La Jefecita

Sistema privado para llevar control de la operación del negocio (producción,
inventario, costos, ventas, etc.). La landing pública vive en `/` y no
menciona el acceso a la webapp; la webapp privada vive en `/portal` y solo
entran los correos dados de alta en la tabla `socios`.

## Stack

- Next.js 15 (App Router, TypeScript, Tailwind, shadcn/ui)
- Supabase (Postgres + Auth con Google + Storage) — capa gratuita
- Drizzle ORM / drizzle-kit
- Hosting: Vercel (capa gratuita)

## Setup local

### 1. Crear proyecto en Supabase

1. Crea una cuenta y un proyecto en https://supabase.com (capa gratuita).
2. Ve a **Authentication → Providers → Google** y actívalo. Necesitas un
   OAuth Client ID/Secret de Google Cloud Console:
   - En https://console.cloud.google.com crea un proyecto (o usa uno
     existente), ve a **APIs & Services → Credentials → Create Credentials →
     OAuth client ID** (tipo "Web application").
   - En "Authorized redirect URIs" agrega la URL de callback que te muestra
     Supabase en esa misma pantalla (algo como
     `https://<tu-proyecto>.supabase.co/auth/v1/callback`).
   - Pega el Client ID y Client Secret en Supabase.
3. En **Authentication → URL Configuration**, agrega
   `http://localhost:3000/portal/auth/callback` como Redirect URL (y luego la
   URL de producción cuando exista, ej.
   `https://tudominio.com/portal/auth/callback`).
4. Copia de **Project Settings → API**: `Project URL` y `anon public key`.
5. Copia de **Project Settings → Database → Connection string** el connection
   string con pooler (puerto 6543) para `DATABASE_URL`.

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Rellena `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
`DATABASE_URL` con los valores del paso anterior.

### 3. Instalar dependencias y preparar la base de datos

```bash
npm install
npm run db:push   # crea las tablas en Supabase a partir de lib/db/schema.ts
npm run db:seed   # siembra 1 socio (tu correo), los 3 productos y 2 ubicaciones de ejemplo
```

> Antes de correr `db:seed`, revisa `lib/db/seed.ts` — los nombres de las
> salsas están como placeholder ("Salsa roja/verde/habanera"); cámbialos por
> los reales.

### 4. Correr en desarrollo

```bash
npm run dev
```

- `http://localhost:3000` → landing pública.
- `http://localhost:3000/portal` → redirige a login si no hay sesión; con tu
  correo autorizado entra al dashboard.

## Agregar más socios

Inserta una fila en la tabla `socios` (por SQL en Supabase o con
`npm run db:studio`) con su correo de Google. No hace falta redeploy.

## Agregar un producto (salsa) nuevo

Inserta una fila en `productos`. Aparece automáticamente en el formulario de
lotes.

## Estructura de módulos

Cada módulo de negocio vive en su propia carpeta bajo
`app/portal/(protected)/<modulo>/` con este patrón (ver `lotes/` como
referencia):

- `page.tsx` — listado
- `nuevo/page.tsx`, `[id]/page.tsx` — alta/edición
- `actions.ts` — server actions (crear/actualizar/borrar)
- `queries.ts` — lecturas a la base de datos

Los módulos que aún no existen (insumos, costos, ventas, eventos,
utilidades) están como placeholders "Próximamente" y aparecen deshabilitados
en el menú lateral hasta que se construyan.

## Deploy (Vercel)

1. Sube el repo a GitHub.
2. En https://vercel.com, importa el repo (capa gratuita).
3. Configura las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`) en el proyecto de Vercel.
4. Agrega la URL de producción (`https://tudominio.vercel.app/portal/auth/callback`)
   en Supabase → Authentication → URL Configuration.
