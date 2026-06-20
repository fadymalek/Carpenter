/** @type {import('next').NextConfig} */
const nextConfig = {
  // The two screens are ported from validated single-file prototypes;
  // skip blocking the build on lint/style nits in this starter.
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
