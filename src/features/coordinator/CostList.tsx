import { Box, Button, Flex, Image, Link, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { AddPhotoForm } from "./AddPhotoForm";
import type { FormState } from "./types";

export type CostRow = {
  id: string;
  description: string;
  amount: string;
  meta: string;
  photoUrl: string | null;
  addPhoto: (prev: FormState, form: FormData) => Promise<FormState>;
};

// The costs to reimburse with their invoice photos, and the total.
export function CostList(props: {
  costs: readonly CostRow[];
  total: string;
  remove: (form: FormData) => Promise<void>;
}) {
  const t = useTranslations("coordinator.report");
  if (props.costs.length === 0) return <Text color="fg.muted">{t("noCosts")}</Text>;
  return (
    <Stack gap="3">
      <List.Root listStyle="none" borderTopWidth="1px">
        {props.costs.map((c) => (
          <List.Item
            key={c.id}
            display="grid"
            gridTemplateColumns="3.5rem minmax(0, 1fr) auto"
            columnGap="4"
            rowGap="2"
            alignItems="center"
            py="2"
            borderBottomWidth="1px"
          >
            {c.photoUrl ? (
              <Link
                href={c.photoUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={t("openPhoto", { cost: c.description })}
              >
                <Image src={c.photoUrl} alt="" boxSize="14" objectFit="cover" rounded="sm" />
              </Link>
            ) : (
              <Box
                boxSize="14"
                rounded="sm"
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="fg.warning"
              />
            )}
            <Stack gap="1" minW="0">
              <Text>{c.description}</Text>
              {c.meta && (
                <Text fontSize="xs" color="fg.muted">
                  {c.meta}
                </Text>
              )}
              {!c.photoUrl && (
                <>
                  <Text fontSize="xs" color="fg.warning">
                    {t("photoMissing")}
                  </Text>
                  <AddPhotoForm label={t("photoFor", { cost: c.description })} add={c.addPhoto} />
                </>
              )}
            </Stack>
            <Flex direction="column" align="flex-end" gap="1">
              <Text fontVariantNumeric="tabular-nums">{c.amount}</Text>
              <form action={props.remove}>
                <input type="hidden" name="id" value={c.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="xs"
                  color="fg"
                  aria-label={t("removeCost", { cost: c.description })}
                >
                  {t("remove")}
                </Button>
              </form>
            </Flex>
          </List.Item>
        ))}
      </List.Root>
      <Flex justify="space-between" gap="4" fontWeight="semibold">
        <Text>{t("totalToReimburse")}</Text>
        <Text fontVariantNumeric="tabular-nums">{props.total}</Text>
      </Flex>
    </Stack>
  );
}
