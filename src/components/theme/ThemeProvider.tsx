// src/components/theme/ThemeProvider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Suppress React 19 false-positive warning for next-themes inline script in dev (both SSR and client)
if (process.env.NODE_ENV === "development") {
    const origError = console.error;
    console.error = (...args: unknown[]) => {
        if (
            typeof args[0] === "string" &&
            args[0].includes("Encountered a script tag while rendering React component")
        ) {
            return;
        }
        origError.apply(console, args);
    };
}

export default function ThemeProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme={false}
        >
            {children}
        </NextThemesProvider>
    );
}
