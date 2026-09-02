import { useForm } from "@tanstack/react-form";
import { HStack } from "@astryxdesign/core";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { type ISODateString } from "@astryxdesign/core/Calendar";

export interface ReportFilterFormProps {
  startDate?: ISODateString;
  endDate?: ISODateString;
  onFilterChange: (startDate?: ISODateString, endDate?: ISODateString) => void;
}

export function ReportFilterForm({ startDate, endDate, onFilterChange }: ReportFilterFormProps) {
  const form = useForm({
    defaultValues: { startDate, endDate },
    onSubmit: ({ value }) => onFilterChange(value.startDate, value.endDate),
  });

  return (
    <HStack gap={2} wrap="wrap">
      <form.Field name="startDate">
        {(field) => (
          <DateInput
            hasClear
            isLabelHidden
            label="Dari Tanggal"
            placeholder="Dari Tanggal"
            format="system_date"
            statusVariant="tooltip"
            value={field.state.value as DateInputProps["value"]}
            onChange={(v) => {
              field.handleChange(v as ISODateString | undefined);
              setTimeout(() => form.handleSubmit(), 0);
            }}
          />
        )}
      </form.Field>
      <form.Field name="endDate">
        {(field) => (
          <DateInput
            hasClear
            isLabelHidden
            label="Sampai Tanggal"
            placeholder="Sampai Tanggal"
            format="system_date"
            statusVariant="tooltip"
            min={form.getFieldValue("startDate") as ISODateString | undefined}
            value={field.state.value as DateInputProps["value"]}
            onChange={(v) => {
              field.handleChange(v as ISODateString | undefined);
              setTimeout(() => form.handleSubmit(), 0);
            }}
          />
        )}
      </form.Field>
    </HStack>
  );
}
