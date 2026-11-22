import type { ReactNode } from "react";

import { MainColumn } from "@/features/shell/MainColumn";

// The registrant's pages share the narrow reading column.
export default function PublicTrainingLayout({ children }: { children: ReactNode }) {
  return <MainColumn>{children}</MainColumn>;
}
