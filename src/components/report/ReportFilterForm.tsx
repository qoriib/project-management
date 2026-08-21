import { useForm } from "@tanstack/react-form";
import { FormLayout } from "@astryxdesign/core";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { type ISODateString } from "@astryxdesign/core/Calendar";

export interface ReportFilterFormProps {
  startDate?: ISODateString;
  endDate?: ISODateString;
  onFilterChange: (startDate?: ISODateString, endDate?: ISODateString) => void;
}

export function ReportFilterForm({ startDate, endDate, onFilterChange }: ReportFilterFormProps) {
  const form = useForm({
    defaultValues: {
      startDate,
      endDate,
    },
    onSubmit: ({ value }) => {
      onFilterChange(value.startDate, value.endDate);
    },
  });

  return (
    <FormLayout direction="horizontal">
      <form.Field name="startDate">
        {(field) => (
          <DateInput
            hasClear
            label=""
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
            label=""
            placeholder="Sampai Tanggal"
            format="system_date"
            statusVariant="tooltip"
            value={field.state.value as DateInputProps["value"]}
            onChange={(v) => {
              field.handleChange(v as ISODateString | undefined);
              setTimeout(() => form.handleSubmit(), 0);
            }}
            min={form.getFieldValue("startDate") as ISODateString | undefined}
          />
        )}
      </form.Field>
    </FormLayout>
  );
}
