import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack strictly destroys Node.js sub-processes (WebWorkers) internally during the build.
  // We MUST politely ask Next.js to ignore `tesseract.js` and `pdf-parse` and run them cleanly out of `node_modules`.
  serverExternalPackages: ['tesseract.js', 'pdf-parse'],
};

export default nextConfig;
