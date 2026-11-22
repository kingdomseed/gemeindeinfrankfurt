import { Stat } from "@chakra-ui/react";

// A figure on a tint, with an optional line under it that explains the figure.
export function StatCard(props: { label: string; value: string; help?: string | undefined }) {
  const { label, value, help } = props;
  return (
    <Stat.Root bg="bg.subtle" rounded="lg" p="3" gap="0">
      <Stat.Label fontSize="sm">{label}</Stat.Label>
      <Stat.ValueText fontSize="xl" fontVariantNumeric="tabular-nums">
        {value}
      </Stat.ValueText>
      {help && (
        <Stat.HelpText fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
          {help}
        </Stat.HelpText>
      )}
    </Stat.Root>
  );
}
