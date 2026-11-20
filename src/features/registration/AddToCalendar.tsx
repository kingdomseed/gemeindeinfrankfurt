import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

// Buttons that put the messages into a calendar app. `icsUrl` is the absolute
// https link to the .ics file; calendar apps subscribe to it as webcal.
export function AddToCalendar(props: { icsUrl: string; label: string }) {
  const t = useTranslations("calendar");
  const webcal = props.icsUrl.replace(/^https?:/, "webcal:");
  const links = [
    {
      key: "google",
      href: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`,
    },
    { key: "apple", href: webcal },
    {
      key: "outlook",
      href: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(props.icsUrl)}`,
    },
  ] as const;
  return (
    <Stack gap="2">
      <Text fontWeight="medium">{props.label}</Text>
      <HStack wrap="wrap" gap="2">
        <Button asChild variant="outline" size="sm">
          <a href={props.icsUrl} download>
            {t("download")}
          </a>
        </Button>
        {links.map((l) => (
          <Button key={l.key} asChild variant="outline" size="sm">
            <a href={l.href} target="_blank" rel="noopener noreferrer">
              {t(l.key)}
            </a>
          </Button>
        ))}
      </HStack>
    </Stack>
  );
}
