/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que Next.js "descargue" de memoria páginas/layouts que llevan
  // un rato sin visitarse (comportamiento normal en dev), lo cual causa
  // ChunkLoadError al volver a una pestaña que quedó inactiva.
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 10,
  },
};

export default nextConfig;
