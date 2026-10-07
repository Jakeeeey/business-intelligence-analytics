import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
    output: "standalone",
    outputFileTracingRoot: path.join(__dirname),
  /* config options here */
  allowedDevOrigins: ['msi-andrie', 'msi-jake', '100.81.225.79', '100.124.104.46', '100.119.180.15','100.114.249.96','msi-eulysis', '100.116.150.68'],
};

export default nextConfig;
