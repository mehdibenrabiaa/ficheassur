"use client";

import { useSyncExternalStore } from "react";

// The current year for the footer's copyright. Next.js refuses `new Date()`
// while prerendering, even in a client component's render: the prerender
// uses the server snapshot (nothing), the browser reads the real year.
const noSubscription = () => () => {};

export default function CurrentYear() {
  const year = useSyncExternalStore(noSubscription, () => new Date().getFullYear(), () => null);
  return <>{year}</>;
}
