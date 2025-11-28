"use client";

import { Suspense } from "react";

function GlobalClientEffectsContent() {
  return null;
}

export default function GlobalClientEffects() {
  return (
    <Suspense fallback={null}>
      <GlobalClientEffectsContent />
    </Suspense>
  );
}

