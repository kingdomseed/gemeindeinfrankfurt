import { Box, Heading, SimpleGrid, Text } from "@chakra-ui/react";

// Short statements, each with its Bible references, as a grid of cards.
export function StatementGrid(props: {
  items: readonly { id: string; heading: string; text: string; references: string }[];
}) {
  return (
    <SimpleGrid as="ul" columns={{ base: 1, md: 2 }} gap="4" listStyleType="none">
      {props.items.map((item) => (
        <Box as="li" key={item.id} borderWidth="1px" rounded="l3" p="5" bg="bg.panel">
          <Heading
            as="h2"
            size="sm"
            color="brand.fg"
            letterSpacing="wider"
            textTransform="uppercase"
          >
            {item.heading}
          </Heading>
          <Text mt="2" lineHeight="tall">
            {item.text}
          </Text>
          {item.references && (
            <Text mt="3" fontSize="sm" color="fg.muted">
              {item.references}
            </Text>
          )}
        </Box>
      ))}
    </SimpleGrid>
  );
}
