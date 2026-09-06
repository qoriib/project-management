import { useForm } from "@tanstack/react-form";
import { InputGroup, InputGroupText } from "@astryxdesign/core";
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
    <InputGroup label="Rentang Tanggal" isLabelHidden>
      <form.Field name="startDate">
        {(field) => (
          <DateInput
            hasClear
            isLabelHidden
            label="Dari Tanggal"
            placeholder="Dari Tanggal"
            format="system_date"
            statusVariant="tooltip"
            width={160}
            value={field.state.value as DateInputProps["value"]}
            onChange={(v) => {
              field.handleChange(v as ISODateString | undefined);
              setTimeout(() => form.handleSubmit(), 0);
            }}
          />
        )}
      </form.Field>
      <InputGroupText>s/d</InputGroupText>
      <form.Field name="endDate">
        {(field) => (
          <DateInput
            hasClear
            isLabelHidden
            label="Sampai Tanggal"
            placeholder="Sampai Tanggal"
            format="system_date"
            statusVariant="tooltip"
            width={160}
            min={form.getFieldValue("startDate") as ISODateString | undefined}
            value={field.state.value as DateInputProps["value"]}
            onChange={(v) => {
              field.handleChange(v as ISODateString | undefined);
              setTimeout(() => form.handleSubmit(), 0);
            }}
          />
        )}
      </form.Field>
    </InputGroup>
  );
}
