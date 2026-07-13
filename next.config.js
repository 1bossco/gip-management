/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode catches potential issues in development
  reactStrictMode: true,

  // Allow cross-origin requests to Google Apps Script
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
