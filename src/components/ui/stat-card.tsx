import { Stat } from "@chakra-ui/react";

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Stat.Root bg="bg.subtle" rounded="lg" p="3" gap="0">
      <Stat.Label fontSize="sm">{label}</Stat.Label>
      <Stat.ValueText fontSize="xl" fontVariantNumeric="tabular-nums">
        {value}
      </Stat.ValueText>
    </Stat.Root>
  );
}
