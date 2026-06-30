/** @type {import('next').NextConfig} */
const nextConfig = {
  // La diferencia entre export y standalone es que export genera archivos estaticos
  // mientras que standalone genera una version optimizada para produccion.
  // https://nextjs.org/docs/pages/building-your-application/deploying/standalone
  // https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
  output: 'standalone',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    // Si usas varios proveedores de avatar, añade más dominios/remotos:
    domains: ['lh3.googleusercontent.com'],
    // O bien con patrones:
    // remotePatterns: [
    //   { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    // ],
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  basePath: '',
  distDir: '.next'
}

export default nextConfig
