import { createFileRoute } from "@tanstack/react-router";
import { Button, HStack, Heading, Text, VStack } from "@astryxdesign/core";
import { useToast } from "@astryxdesign/core/Toast";
import { useForm } from "@tanstack/react-form";
import { changePin } from "@/db/services/auth.service";
import { getFieldError, handleFormError } from "@/utils/form";
import { PinInput } from "@/components/shared/PinInput";
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <VStack width={320} gap={4}>
          <form.Field name="newPin">
            {(field) => {
              const errorText = getFieldError(field.state.meta.errors, field.state.meta.isTouched);

              return (
                <VStack gap={2}>
                  <Text size="sm" weight="medium">
                    PIN Baru (6 Digit)
                  </Text>
                  <PinInput
                    length={6}
                    value={field.state.value}
                    onChange={(val) => field.handleChange(val)}
                    isError={Boolean(errorText)}
                    onSubmit={() => form.handleSubmit()}
                  />
                  {errorText ? (
                    <Text size="sm" justify="center" style={{ color: "var(--color-error)" }}>
                      {errorText.message}
                    </Text>
                  ) : null}
                </VStack>
              );
            }}
          </form.Field>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                label="Simpan PIN Baru"
                variant="primary"
                isDisabled={!canSubmit}
                isLoading={isSubmitting}
              />
            )}
          />
        </VStack>
      </form>
    </HStack>
  );
}

export const Route = createFileRoute("/settings/security")({
  component: SettingsSecurity,
});
