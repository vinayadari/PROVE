import "@/lib/polyfill";
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "PROVE — Talent, with receipts.",
  description: "Evidence-based talent intelligence platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== "undefined") {
                if (!window.crypto) { window.crypto = {}; }
                if (!window.crypto.randomUUID) {
                  window.crypto.randomUUID = function() {
                    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, function(c) {
                      var n = Number(c);
                      var r = (window.crypto.getRandomValues ? window.crypto.getRandomValues(new Uint8Array(1))[0] : Math.floor(Math.random() * 256));
                      return (n ^ ((r & 15) >> (n / 4))).toString(16);
                    });
                  };
                }
              }
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
