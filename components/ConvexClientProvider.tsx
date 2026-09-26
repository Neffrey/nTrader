"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useState } from "react";

export default function ConvexClientProvider({
  convexUrl,
  children,
}: {
  convexUrl: string;
  children: ReactNode;
}) {
  const [convex] = useState(() => new ConvexReactClient(convexUrl));
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
