import { Box, Flex, Grid, Heading, Link, Stack, Table, Text } from "@chakra-ui/react";

import { PrintButton } from "@/components/ui/print-button";
import { Link as LocaleLink } from "@/i18n/navigation";

export type QuestionnaireText = {
  publisher: string;
  title: string;
  church: string;
  messagesTitle: string;
  message: string;
  dateShown: string;
  absent: string;
  notesTitle: string;
  costsTitle: string;
  place: string;
  signature: string;
};

// The printable questionnaire for Lebensstrom, laid out like its form, on
// white paper whatever the screen's colour mode.
export function Questionnaire(props: {
  toolbar: { backHref: string; back: string; print: string };
  lang: string;
  text: QuestionnaireText;
  rows: readonly { label: string; value: string }[];
  messages: readonly { number: number; date: string; absent: number }[];
  notes: string;
  costs: string;
}) {
  const { text } = props;
  const cell = { py: "1.5", borderBottomWidth: "1px", borderColor: "fg" } as const;
  return (
    <Stack gap="4">
      <Flex justify="space-between" align="center" gap="4" wrap="wrap" _print={{ display: "none" }}>
        <Link asChild fontSize="sm" color="fg" textDecoration="underline">
          <LocaleLink href={props.toolbar.backHref}>{props.toolbar.back}</LocaleLink>
        </Link>
        <PrintButton label={props.toolbar.print} />
      </Flex>
      <Box
        className="light"
        lang={props.lang}
        bg="bg"
        color="fg"
        maxW="210mm"
        mx="auto"
        p={{ base: "6", md: "12" }}
        fontSize="sm"
        borderWidth="1px"
        _print={{ borderWidth: "0", p: "0" }}
      >
        <Stack gap="6">
          <Stack gap="1" borderBottomWidth="2px" borderColor="fg" pb="3">
            <Text fontSize="xs" color="fg.muted">
              {text.publisher}
            </Text>
            <Heading as="h1" size="xl">
              {text.title}
            </Heading>
            <Text>{text.church}</Text>
          </Stack>

          <Table.Root size="sm" variant="line" css={{ "& th, & td": { borderColor: "fg" } }}>
            <Table.Body>
              {props.rows.map((r) => (
                <Table.Row key={r.label}>
                  <Table.ColumnHeader as="th" scope="row" fontWeight="normal" w="62%" {...cell}>
                    {r.label}
                  </Table.ColumnHeader>
                  <Table.Cell fontVariantNumeric="tabular-nums" {...cell}>
                    {r.value}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          <Stack gap="2">
            <Heading as="h2" size="md">
              {text.messagesTitle}
            </Heading>
            <Table.Root size="sm" variant="line">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader {...cell}>{text.message}</Table.ColumnHeader>
                  <Table.ColumnHeader {...cell}>{text.dateShown}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end" {...cell}>
                    {text.absent}
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body fontVariantNumeric="tabular-nums">
                {props.messages.map((m) => (
                  <Table.Row key={m.number}>
                    <Table.Cell py="1">{m.number}</Table.Cell>
                    <Table.Cell py="1">{m.date}</Table.Cell>
                    <Table.Cell py="1" textAlign="end">
                      {m.absent}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Stack>

          <Stack gap="2">
            <Heading as="h2" size="md">
              {text.notesTitle}
            </Heading>
            <Text whiteSpace="pre-line">{props.notes || "–"}</Text>
          </Stack>

          <Stack gap="2">
            <Heading as="h2" size="md">
              {text.costsTitle}
            </Heading>
            <Text>{props.costs}</Text>
          </Stack>

          <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="12" mt="12">
            <Text borderTopWidth="1px" borderColor="fg" pt="1.5">
              {text.place}
            </Text>
            <Text borderTopWidth="1px" borderColor="fg" pt="1.5">
              {text.signature}
            </Text>
          </Grid>
        </Stack>
      </Box>
    </Stack>
  );
}
