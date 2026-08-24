import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Card, Center, Heading, Text, VStack } from "@astryxdesign/core";
import { useForm } from "@tanstack/react-form";
import { login } from "@/db/services/auth.service";
import { getFieldError } from "@/utils/form";
import { APP } from "@/configs/app.config";
import { PinInput } from "@/components/shared/PinInput";
import * as v from "valibot";
import appLogo from "@/assets/branding/logo-menpro.svg";

const loginSchema = v.object({
  pin: v.pipe(v.string(), v.length(6, "PIN harus tepat 6 digit")),
});

function LoginPage() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { pin: "" },
    validators: {
      onChange: loginSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          const success = await login(value.pin);
          if (success) return null;
          return { fields: { pin: "PIN salah. Silakan coba lagi." } };
        } catch (err: any) {
          return { fields: { pin: err.message || "Gagal login. Terjadi kesalahan internal." } };
        }
      },
    },
    onSubmit: () => navigate({ to: "/" }),
  });

  return (
    <Center minHeight="100vh" padding={4}>
      <Card padding={6} width="100%" maxWidth={400}>
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <VStack gap={5} align="center">
            <img src={appLogo} alt="Manajemen Proyek" className="app-logo" />
            <VStack gap={1} align="center">
              <Heading level={3} justify="center">
                {APP.title}
              </Heading>
              <Text size="sm" color="secondary" justify="center">
                {APP.companyName}
              </Text>
            </VStack>
            <VStack gap={4} width="100%">
              <form.Field name="pin">
                {(field) => {
                  const errorText = getFieldError(field.state.meta.errors, field.state.meta.isTouched);

                  return (
                    <VStack gap={2} width="100%">
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
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                {([canSubmit, isSubmitting]) => (
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
              </form.Subscribe>
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
