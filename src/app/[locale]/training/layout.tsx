import { TrainingContacts } from "@/features/shell/TrainingContacts";
import { siteContacts } from "@/lib/site";

// Registration, sign-in links and the coordinator area show live data.
export const dynamic = "force-dynamic";

export default function TrainingLayout({ children }: LayoutProps<"/[locale]/training">) {
  return (
    <>
      {children}
      <TrainingContacts contacts={siteContacts()} />
    </>
  );
}
