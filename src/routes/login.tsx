import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Card, Center, Icon, Text, TextInput, VStack } from "@astryxdesign/core";
import { Lock } from "lucide-react";
import { login } from "@/services/auth";
import { useForm } from "@tanstack/react-form";
import * as v from "valibot";
import { APP } from "@/configs/app.config";

const loginSchema = v.object({
  pin: v.pipe(v.string(), v.length(6, "PIN harus tepat 6 digit")),
});

function LoginPage() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      pin: "",
    },
    validators: {
      onChange: loginSchema,
      onSubmitAsync: async ({ value, formApi }) => {
        try {
          const success = await login(value.pin);

          if (success) {
            return null;
          } else {
            formApi.setFieldValue("pin", "");

            return {
              fields: {
                pin: "PIN salah. Silakan coba lagi.",
              },
            };
          }
        } catch (err: any) {
          return {
            fields: {
              pin: err.message || "Gagal login. Terjadi kesalahan internal.",
            },
          };
        }
      },
    },
    onSubmit: () => {
      navigate({ to: "/" });
    },
  });

  return (
    <Center minHeight="100vh">
      <Card padding={8} width={400}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <VStack gap={6} align="center">
            <Center
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "50%",
                height: "64px",
                width: "64px",
              }}
            >
              <Icon size="lg" color="primary" icon={Lock} />
            </Center>
            <VStack gap={2} align="center">
              <Text size="lg" weight="bold">
                {APP.title}
              </Text>
              <Text color="secondary">Masukkan PIN untuk mengakses aplikasi</Text>
            </VStack>
            <VStack gap={4} width="100%">
              <form.Field
                name="pin"
                children={(field) => {
                  const fieldError =
                    field.state.meta.errors.length > 0
                      ? field.state.meta.errors[0]?.toString()
                      : undefined;

                  return (
                    <TextInput
                      isLabelHidden
                      hasAutoFocus
                      label="PIN"
                      type="text"
                      size="lg"
                      statusVariant="attached"
                      placeholder="• • • • • •"
                      value={field.state.value}
                      status={fieldError ? { message: fieldError, type: "error" } : undefined}
                      onBlur={field.handleBlur}
                      onChange={(val) => {
                        const cleaned = (val || "").replaceAll(/\D/g, "").slice(0, 6);
                        field.handleChange(cleaned);
                      }}
                    />
                  );
                }}
              />
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    width="100%"
                    size="lg"
                    type="submit"
                    variant="primary"
                    label="Buka Aplikasi"
                    isLoading={isSubmitting}
                    isDisabled={!canSubmit}
                  />
                )}
              />
            </VStack>
          </VStack>
        </form>
      </Card>
    </Center>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
