import { Flex, Heading, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { groupSizeOk } from "@/lib/domain/groups";

import type { GroupMember } from "./group-board";
import { MoveMenu } from "./MoveMenu";

// One study group, or the people in none: its size (flagged outside 8–10),
// its language and cities, and a "Move" menu beside each person.
export function StudyGroupCard(props: {
  title: string;
  meta: string | null;
  members: readonly GroupMember[];
  // The groups a person here can move to.
  targets: readonly { id: string; label: string }[];
  move: (registrationId: string, groupId: string) => Promise<void>;
  checkSize: boolean;
}) {
  const t = useTranslations("coordinator");
  const size = props.members.length;
  return (
    <Card as="section" gap="3">
      <Stack gap="0.5">
        <Flex justify="space-between" align="center" gap="2">
          <Heading as="h2" size="md">
            {props.title}
          </Heading>
          <StatusTag
            tone={props.checkSize && !groupSizeOk(size) ? "warning" : "neutral"}
            fontVariantNumeric="tabular-nums"
          >
            {t("groups.people", { count: size })}
          </StatusTag>
        </Flex>
        {props.meta && (
          <Text fontSize="sm" color="fg.muted">
            {props.meta}
          </Text>
        )}
      </Stack>
      <List.Root listStyle="none" borderTopWidth="1px">
        {props.members.map((m) => (
          <List.Item
            key={m.id}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap="2"
            minH="11"
            borderBottomWidth="1px"
          >
            <Text fontSize="sm">
              {m.name}
              {m.seat !== "full_time" && (
                <Text as="span" fontSize="xs" color="fg.muted">
                  {` ${t(`seatShort.${m.seat}`)}`}
                </Text>
              )}
            </Text>
            {props.targets.length > 0 && (
              <MoveMenu
                personName={m.name}
                groups={props.targets}
                move={props.move.bind(null, m.id)}
              />
            )}
          </List.Item>
        ))}
      </List.Root>
    </Card>
  );
}
