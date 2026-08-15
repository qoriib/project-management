import { Card, VStack } from "@astryxdesign/core";
import { DateInput } from "@astryxdesign/core/DateInput";
import { getFieldError } from "@/utils/form";
import type { usePOForm } from "./usePOForm";

type ISODate = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

interface PODateCardProps {
  form: ReturnType<typeof usePOForm>["form"];
}

/** Card displaying PO Date field */
export function PODateCard({ form }: PODateCardProps) {
  console.log(form);

  return (
    <Card padding={4}>
      <VStack width={320}>
        <form.Field name="po_date">
          {(field) => (
            <DateInput
              label="Tanggal PO"
              value={field.state.value as ISODate}
              onChange={(v) => field.handleChange(v || "")}
              onBlur={field.handleBlur}
              format="system_date"
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
