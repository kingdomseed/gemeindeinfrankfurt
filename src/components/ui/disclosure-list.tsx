import { Accordion, Span } from "@chakra-ui/react";
import type { ReactNode } from "react";

// A list of headings that each open to show their content, such as
// questions and answers. Several can be open at once.
export function DisclosureList(props: {
  items: readonly { id: string; title: string; content: ReactNode }[];
}) {
  return (
    <Accordion.Root multiple collapsible variant="outline" size="lg">
      {props.items.map((item) => (
        <Accordion.Item key={item.id} value={item.id}>
          <Accordion.ItemTrigger minH="11" cursor="pointer">
            <Span flex="1" fontWeight="semibold" textAlign="start">
              {item.title}
            </Span>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>{item.content}</Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
