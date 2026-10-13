const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      require.resolve('./src/app/global.css');
      require('tailwindcss');
      require('postcss-custom-properties');
    }
    return config;
  },
};

module.exports = nextConfig;