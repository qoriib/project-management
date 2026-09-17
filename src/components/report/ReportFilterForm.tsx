import { InputGroup, InputGroupText } from "@astryxdesign/core";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { type ISODateString } from "@astryxdesign/core/Calendar";

export interface ReportFilterFormProps {
  startDate?: ISODateString;
  endDate?: ISODateString;
  onFilterChange: (startDate?: ISODateString, endDate?: ISODateString) => void;
}

export function ReportFilterForm({ startDate, endDate, onFilterChange }: ReportFilterFormProps) {
  return (
    <InputGroup label="Rentang Tanggal" isLabelHidden>
      <DateInput
        hasClear
        isLabelHidden
        label="Dari Tanggal"
        placeholder="Dari Tanggal"
        format="system_date"
        statusVariant="tooltip"
        width={160}
        value={startDate as DateInputProps["value"]}
        onChange={(value) => onFilterChange(value as ISODateString | undefined, endDate)}
      />
      <InputGroupText>s/d</InputGroupText>
      <DateInput
        hasClear
        isLabelHidden
        label="Sampai Tanggal"
        placeholder="Sampai Tanggal"
        format="system_date"
        statusVariant="tooltip"
        width={160}
        min={startDate}
        value={endDate as DateInputProps["value"]}
        onChange={(value) => onFilterChange(startDate, value as ISODateString | undefined)}
      />
    </InputGroup>
  );
}
