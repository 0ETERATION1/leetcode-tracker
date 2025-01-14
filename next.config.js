/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        'mongodb-client-encryption': false,
        'aws4': false,
      };
    }
    return config;
  },
}

module.exports = nextConfig 