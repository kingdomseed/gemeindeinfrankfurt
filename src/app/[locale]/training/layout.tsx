import { MainColumn } from "@/features/shell/MainColumn";
import { TrainingContacts } from "@/features/shell/TrainingContacts";
import { siteContacts } from "@/lib/site";

export default function TrainingLayout({ children }: LayoutProps<"/[locale]/training">) {
  return (
    <>
      <MainColumn>{children}</MainColumn>
      <TrainingContacts contacts={siteContacts()} />
    </>
  );
}
