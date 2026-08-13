import { useEffect, useState } from "react";
import { Dialog, TextInput, TextArea, VStack, HStack, Button, Heading } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { Banner } from "@astryxdesign/core/Banner";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import type { Vendor } from "@/db/repositories";
import * as v from "valibot";

const vendorSchema = v.object({
  vendor_name: v.pipe(v.string(), v.nonEmpty("Nama vendor harus diisi.")),
  phone: v.string(),
  address: v.string(),
});

interface MasterVendorFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Vendor | null;
}

export function MasterVendorForm({ isOpen, onClose, initialData }: MasterVendorFormProps) {
  const { createVendor, updateVendor } = useMasterStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const showToast = useToast();

  const form = useForm({
    defaultValues: {
      vendor_name: "",
      phone: "",
      address: "",
    },
    validators: {
      onChange: vendorSchema,
    },
    onSubmit: async ({ value }) => {
      setErrorMsg(null);
      try {
        if (initialData) {
          await updateVendor(initialData.vendor_id, value);
          showToast({ body: "Vendor berhasil diubah", type: "info" });
        } else {
          await createVendor(value);
          showToast({ body: "Vendor berhasil ditambahkan", type: "info" });
        }
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal menyimpan vendor");
      }
    }
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      form.reset();
      if (initialData) {
        form.setFieldValue("vendor_name", initialData.vendor_name);
        form.setFieldValue("phone", initialData.phone ?? "");
        form.setFieldValue("address", initialData.address ?? "");
      }
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
        <VStack gap={3}>
          <Heading level={3}>{initialData ? "Edit Vendor" : "Tambah Vendor"}</Heading>

          {errorMsg && <Banner status="error" title="Gagal menyimpan" description={errorMsg} />}

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
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors)}
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
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors)}
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
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors)}
                />
              )}
            />
          </FormLayout>

          <HStack gap={2} justify="end" style={{ marginTop: '1rem' }}>
            <Button variant="ghost" label="Batal" onClick={onClose} type="button" />
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              children={([canSubmit, isSubmitting]) => (
                <Button variant="primary" label="Simpan" type="submit" isLoading={isSubmitting} isDisabled={!canSubmit} />
              )}
            />
          </HStack>
        </VStack>
      </form>
    </Dialog>
  );
}
