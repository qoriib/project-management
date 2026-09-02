import { useEffect } from "react";
import { Button, Dialog, HStack, Heading, TextArea, TextInput } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError, handleFormError } from "@/utils/form";
import type { Vendor } from "@/db/repositories";
import * as v from "valibot";

const vendorSchema = v.object({
  address: v.string(),
  phone: v.string(),
  vendor_name: v.pipe(v.string(), v.nonEmpty("Nama vendor harus diisi.")),
});

export type VendorFormValues = v.InferOutput<typeof vendorSchema>;

export function buildDefaultValues(initialData?: Vendor | null): VendorFormValues {
  return {
    address: initialData?.address ?? "",
    phone: initialData?.phone ?? "",
    vendor_name: initialData?.vendor_name ?? "",
  };
}

interface MasterVendorFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Vendor | null;
}

export function MasterVendorForm({ isOpen, onClose, initialData }: MasterVendorFormProps) {
  const showToast = useToast();
  const { createVendor, updateVendor } = useMasterStore();

  const form = useForm({
    defaultValues: buildDefaultValues(initialData),
    onSubmit: async ({ value }) => {
      try {
        if (initialData) {
          await updateVendor(initialData.vendor_id, value);
        } else {
          await createVendor(value);
        }
      } catch (error: any) {
        handleFormError(error, showToast);
      } finally {
        onClose();
      }
    },
    validators: {
      onChange: vendorSchema,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(buildDefaultValues(initialData));
    }
  }, [isOpen, initialData]);

  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={520}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Layout
          header={
            <LayoutHeader hasDivider>
              <Heading level={3}>{initialData ? "Edit Vendor" : "Tambah Vendor"}</Heading>
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={4}>
              <FormLayout>
                <form.Field
                  name="vendor_name"
                  children={(field) => (
                    <TextInput
                      label="Nama Vendor"
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                      onBlur={field.handleBlur}
                      isRequired
                      statusVariant="tooltip"
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                    />
                  )}
                />
                <form.Field
                  name="phone"
                  children={(field) => (
                    <TextInput
                      label="Telepon"
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                      onBlur={field.handleBlur}
                      statusVariant="tooltip"
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                    />
                  )}
                />
                <form.Field
                  name="address"
                  children={(field) => (
                    <TextArea
                      label="Alamat"
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                      onBlur={field.handleBlur}
                      statusVariant="tooltip"
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                    />
                  )}
                />
              </FormLayout>
            </LayoutContent>
          }
          footer={
            <LayoutFooter hasDivider>
              <HStack gap={2} justify="end" width="100%">
                <Button variant="secondary" label="Batal" onClick={onClose} type="button" />
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                  children={([canSubmit, isSubmitting]) => (
                    <Button
                      variant="primary"
                      label="Simpan"
                      type="submit"
                      isLoading={isSubmitting}
                      isDisabled={!canSubmit}
                    />
                  )}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </form>
    </Dialog>
  );
}
