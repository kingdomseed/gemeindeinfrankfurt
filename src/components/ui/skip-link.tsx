import { Link } from "@chakra-ui/react";

// The id of each page's <main>, which the skip link jumps to.
export const mainContentId = "inhalt";

// First stop for keyboard users: hidden until it has focus, then shown in the
// top corner, so they can jump past the header and menu.
export function SkipLink({ label }: { label: string }) {
  return (
    <Link
      href={`#${mainContentId}`}
      position="absolute"
      top="2"
      insetStart="2"
      zIndex="max"
      px="4"
      minH="11"
      bg="bg.panel"
      color="fg"
      borderWidth="1px"
      rounded="l2"
      shadow="md"
      transform="translateY(-200%)"
      _focusVisible={{ transform: "none" }}
    >
      {label}
    </Link>
  );
}
