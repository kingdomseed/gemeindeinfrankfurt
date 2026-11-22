import type { ReactNode } from "react";

import { MainColumn } from "@/features/shell/MainColumn";

export default function CoordinatorLoginLayout({ children }: { children: ReactNode }) {
  return <MainColumn>{children}</MainColumn>;
}
