"use client";

import dynamic from "next/dynamic";

// The configurator renders WebGL via three.js, so it is client-only.
const Configurator = dynamic(
  () => import("@/components/configurator/Configurator"),
  { ssr: false }
);

export default function ConfigurePage() {
  return <Configurator />;
}
