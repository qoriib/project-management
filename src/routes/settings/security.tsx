import { createFileRoute } from "@tanstack/react-router";
import { Button, Heading, Text, TextInput, VStack, HStack } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { changePin } from "@/db/services/auth.service";
import { useForm } from "@tanstack/react-form";
import { getFieldError, handleFormError } from "@/utils/form";
import { sanitizePin } from "@/utils/formatters";
import * as v from "valibot";

const changePinSchema = v.object({
  newPin: v.pipe(v.string(), v.length(6, "PIN harus tepat 6 digit")),
});

function SettingsSecurity() {
  const showToast = useToast();

  const form = useForm({
    defaultValues: {
      newPin: "",
    },
    validators: {
      onChange: changePinSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await changePin(value.newPin);
          showToast({ body: "PIN berhasil diubah!", type: "info" });
          return null;
        } catch (error: any) {
          handleFormError(error, showToast);
          return null;
        }
      },
    },
    onSubmit: () => {
      form.reset();
    },
  });

  return (
    <HStack vAlign="start" gap={6}>
      <VStack width="100%" gap={1}>
        <Heading level={3}>Keamanan & PIN Akses</Heading>
        <Text type="supporting" color="secondary">
          Kelola PIN yang digunakan untuk masuk ke dalam aplikasi. Jika Anda lupa PIN, Anda tidak akan bisa membuka
          aplikasi.
        </Text>
      </VStack>
      <VStack gap={3} width={480}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FormLayout>
            <form.Field
              name="newPin"
              children={(field) => (
                <TextInput
                  label="PIN Baru"
                  type="text"
                  placeholder="6 digit PIN baru"
                  value={field.state.value}
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                  onBlur={field.handleBlur}
                  onChange={(val) => field.handleChange(sanitizePin(val))}
                />
              )}
            />
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  isDisabled={!canSubmit}
                  label="Simpan PIN"
                />
              )}
            />
          </FormLayout>
        </form>
      </VStack>
    </HStack>
  );
}

export const Route = createFileRoute("/settings/security")({
  component: SettingsSecurity,
});
