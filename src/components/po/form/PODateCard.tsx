import { Card, VStack } from "@astryxdesign/core";
import { DateInput } from "@astryxdesign/core/DateInput";
import { getFieldError } from "@/utils/form";
import type { usePOForm } from "./usePOForm";

type ISODate = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

interface PODateCardProps {
  form: ReturnType<typeof usePOForm>["form"];
}

// ── PODateCard ────────────────────────────────────────────────────────────────

/** Card yang menampilkan field Tanggal PO */
export function PODateCard({ form }: PODateCardProps) {
  return (
    <Card padding={4}>
      <VStack width={320}>
        <form.Field name="poDate">
          {(field) => (
            <DateInput
              label="Tanggal PO"
              value={field.state.value as ISODate}
              onChange={(v) => field.handleChange(v || "")}
              onBlur={field.handleBlur}
              statusVariant="attached"
              status={getFieldError(
                field.state.meta.errors,
                !!field.state.meta.isTouched
              )}
              isRequired
            />
          )}
        </form.Field>
      </VStack>
    </Card>
  );
}
