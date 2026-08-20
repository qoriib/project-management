import { HStack, IconButton, VStack, Selector } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { getFieldError } from "@/utils/form";
import type { Vendor } from "@/db/repositories";
import type { CellFormProps } from "./types";

interface VendorSelectorCellProps extends CellFormProps {
  vendors: Vendor[];
  onAddNewVendor: () => void;
}

export function VendorSelectorCell({
  form,
  vendors,
  onAddNewVendor,
}: VendorSelectorCellProps) {
  return (
    <form.Field name="vendor_id">
      {(field) => {
        const options = vendors.map((v) => ({
          label: v.vendor_name,
          value: String(v.vendor_id),
        }));

        return (
          <HStack gap={1} align="start" width="100%">
            <VStack width="100%">
              <Selector
                label="Vendor"
                isLabelHidden
                placeholder="Pilih vendor..."
                options={options}
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                onBlur={field.handleBlur}
                statusVariant="tooltip"
                status={getFieldError(
                  field.state.meta.errors,
                  field.state.meta.isTouched,
                )}
              />
            </VStack>
            <IconButton
              type="button"
              variant="secondary"
              icon={<Plus size={16} />}
              label="Tambah Vendor"
              onClick={onAddNewVendor}
            />
          </HStack>
        );
      }}
    </form.Field>
  );
}
