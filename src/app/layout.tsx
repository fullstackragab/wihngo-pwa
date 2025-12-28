import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

// Root layout that just passes children through.
// The actual HTML/body structure is in [locale]/layout.tsx
export default function RootLayout({ children }: Props) {
  return children;
}
