import { Button, Flex } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/ui/page-heading";

export function CoordinatorHeader(props: { trainingTitle: string; signOut: () => Promise<void> }) {
  const t = useTranslations("coordinator");
  return (
    <Flex wrap="wrap" align="flex-start" justify="space-between" columnGap="6" rowGap="2">
      <PageHeading title={t("title")} subtitle={props.trainingTitle} />
      <form action={props.signOut}>
        <Button
          type="submit"
          variant="plain"
          px="0"
          color="fg"
          fontSize="sm"
          textDecoration="underline"
        >
          {t("signOut")}
        </Button>
      </form>
    </Flex>
  );
}
