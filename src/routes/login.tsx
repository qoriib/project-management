import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Card, Center, Icon, Text, TextInput, VStack } from "@astryxdesign/core";
import { Lock } from "lucide-react";
import { useState } from "react";
import { login } from "@/services/auth";
import { useForm } from "@tanstack/react-form";
import * as v from "valibot";

const loginSchema = v.object({
  pin: v.pipe(v.string(), v.length(6, "PIN harus tepat 6 digit")),
});

function LoginPage() {
  const navigate = useNavigate(),
    [error, setError] = useState(""),
    form = useForm({
      defaultValues: {
        pin: "",
      },
      onSubmit: async ({ value }) => {
        setError("");
        try {
          const success = await login(value.pin);
          if (success) {
            navigate({ to: "/" });
          } else {
            setError("PIN salah. Silakan coba lagi.");
            form.setFieldValue("pin", "");
          }
        } catch (err: any) {
          setError(err.message || "Gagal login. Terjadi kesalahan internal.");
        }
      },
      validators: {
        onChange: loginSchema,
      },
    });

  return (
    <Center style={{ backgroundColor: "var(--color-surface-dimmed)", minHeight: "100vh" }}>
      <Card padding={8} style={{ maxWidth: "90vw", width: "400px" }}>
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
                Aplikasi Proyek
              </Text>
              <Text color="secondary">Masukkan 6-digit PIN untuk mengakses aplikasi</Text>
            </VStack>

            <VStack gap={4} style={{ width: "100%" }}>
              <form.Field
                name="pin"
                children={(field) => {
                  const fieldError =
                    field.state.meta.errors.length > 0
                      ? field.state.meta.errors[0]?.toString()
                      : error || undefined;

                  return (
                    <TextInput
                      isLabelHidden
                      label="PIN"
                      type="text"
                      size="lg"
                      placeholder="• • • • • •"
                      value={field.state.value}
                      onChange={(val) => {
                        const cleaned = (val || "").replaceAll(/\D/g, "").slice(0, 6);
                        field.handleChange(cleaned);
                      }}
                      onBlur={field.handleBlur}
                      statusVariant="tooltip"
                      status={fieldError ? { message: fieldError, type: "error" } : undefined}
                      hasAutoFocus
                    />
                  );
                }}
              />

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    size="lg"
                    variant="primary"
                    style={{ width: "100%" }}
                    isLoading={isSubmitting}
                    isDisabled={!canSubmit}
                    label="Buka Aplikasi"
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
