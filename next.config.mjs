/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      fallback: [{ source: '/:slug([a-zA-Z0-9-]{1,40})', destination: '/go/:slug' }],
    };
  },
};

export default nextConfig;
