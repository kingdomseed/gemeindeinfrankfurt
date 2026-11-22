import { Grid, Stack, Text } from "@chakra-ui/react";

export type NameTag = { id: string; names: string[]; meta: string };

// Name tags at 85 × 55 mm, two across an A4 page, with dashed lines to cut along.
export function NameTagSheet({ tags }: { tags: readonly NameTag[] }) {
  return (
    <Grid
      templateColumns="repeat(2, 85mm)"
      autoRows="55mm"
      bg="white"
      color="black"
      w="fit-content"
      maxW="full"
      overflowX="auto"
      _print={{ overflowX: "visible" }}
    >
      {tags.map((tag) => (
        <Stack
          key={tag.id}
          justify="center"
          gap="1.5"
          px="6"
          py="5"
          m="-0.5px"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="gray.400"
          breakInside="avoid"
        >
          {tag.names.map((name) => (
            <Text key={name} fontSize="2xl" lineHeight="short" fontWeight="semibold">
              {name}
            </Text>
          ))}
          <Text fontSize="sm">{tag.meta}</Text>
        </Stack>
      ))}
    </Grid>
  );
}
