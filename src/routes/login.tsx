import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  Button,
  Card,
  Center,
  Text,
  TextInput,
  VStack,
} from "@astryxdesign/core";
import { login } from "@/db/services/auth.service";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import { APP } from "@/configs/app.config";
import { sanitizePin } from "@/utils/formatters";
import * as v from "valibot";

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
      onSubmitAsync: async ({ value }) => {
        try {
          const success = await login(value.pin);

          if (success) {
            return null;
          } else {
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
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <VStack gap={6} align="center">
            <Avatar size={64} />
            <VStack gap={2} align="center">
              <Text size="lg" weight="bold">
                {APP.title}
              </Text>
              <Text color="secondary">
                Masukkan PIN untuk mengakses aplikasi
              </Text>
            </VStack>
            <VStack gap={4} width="100%">
              <form.Field
                name="pin"
                children={(field) => {
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
                      status={getFieldError(
                        field.state.meta.errors,
                        field.state.meta.isTouched,
                      )}
                      onBlur={field.handleBlur}
                      onChange={(val) => field.handleChange(sanitizePin(val))}
                    />
                  );
                }}
              />
              <form.Subscribe
                selector={(state) =>
                  [state.canSubmit, state.isSubmitting] as const
                }
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
