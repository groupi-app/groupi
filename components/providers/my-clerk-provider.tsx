"use client";

import { darkClerk, lightClerk } from "@/styles/clerk";
import { ClerkProvider as ImportedClerkProvider } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);
  const selectedTheme = resolvedTheme === "dark" ? darkClerk : lightClerk;

  return (
    <>
      {mounted && (
        <ImportedClerkProvider
          appearance={{
            variables: selectedTheme,
          }}
        >
          {children}
        </ImportedClerkProvider>
      )}
    </>
  );
}
