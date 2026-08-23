import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Card, Center, HStack, Text, VStack, Heading } from "@astryxdesign/core";
import { login } from "@/db/services/auth.service";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import { APP } from "@/configs/app.config";
import { sanitizePin } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";
import sbrLight from "@/assets/branding/sbr-logo-lighttheme.png";
import sbrDark from "@/assets/branding/sbr-logo-darktheme.png";
import { useRef } from "react";
import * as v from "valibot";

const PIN_LENGTH = 6;

const loginSchema = v.object({
  pin: v.pipe(v.string(), v.length(6, "PIN harus tepat 6 digit")),
});

function LoginPage() {
  const navigate = useNavigate();
  const resolvedMode = useAppStore((s) => s.resolvedMode);
  const sbrLogo = resolvedMode === "dark" ? sbrDark : sbrLight;
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

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
            <img src={sbrLogo} alt="SBR" className="pm-logo-login" />
            <VStack gap={1} align="center">
              <Heading level={3} justify="center">
                {APP.title}
              </Heading>
              <Text size="sm" color="secondary" justify="center">
                Masuk dengan PIN 6 digit · {APP.companyName}
              </Text>
            </VStack>
            <VStack gap={4} width="100%">
              <form.Field name="pin">
                {(field) => {
                  const pinDigits = Array.from({ length: PIN_LENGTH }, (_, index) => field.state.value[index] ?? "");
                  const errorText = getFieldError(field.state.meta.errors, field.state.meta.isTouched);

                  return (
                    <VStack gap={2} width="100%">
                      <HStack gap={2} justify="center" width="100%">
                        {pinDigits.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => {
                              inputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            autoComplete={index === 0 ? "one-time-code" : "off"}
                            aria-label={`Digit PIN ${index + 1}`}
                            value={digit}
                            onBlur={field.handleBlur}
                            onChange={(event) => {
                              const rawValue = event.target.value;
                              const sanitized = sanitizePin(rawValue);
                              const nextValue = sanitized.slice(-1);
                              const currentDigits = Array.from(
                                { length: PIN_LENGTH },
                                (_, pos) => field.state.value[pos] ?? "",
                              );

                              if (nextValue) {
                                currentDigits[index] = nextValue;
                                field.handleChange(currentDigits.join(""));
                                if (index < PIN_LENGTH - 1) {
                                  inputRefs.current[index + 1]?.focus();
                                }
                              } else {
                                currentDigits[index] = "";
                                field.handleChange(currentDigits.join(""));
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Backspace" && !digit && index > 0) {
                                inputRefs.current[index - 1]?.focus();
                              }
                              if (event.key === "ArrowLeft" && index > 0) {
                                inputRefs.current[index - 1]?.focus();
                              }
                              if (event.key === "ArrowRight" && index < PIN_LENGTH - 1) {
                                inputRefs.current[index + 1]?.focus();
                              }
                              if (event.key === "Enter") {
                                form.handleSubmit();
                              }
                            }}
                            onPaste={(event) => {
                              event.preventDefault();
                              const pasted = sanitizePin(event.clipboardData.getData("text"));
                              if (!pasted) return;

                              const currentDigits = Array.from(
                                { length: PIN_LENGTH },
                                (_, pos) => field.state.value[pos] ?? "",
                              );
                              const nextDigits = pasted.slice(0, PIN_LENGTH).split("");

                              for (let i = 0; i < PIN_LENGTH; i += 1) {
                                currentDigits[i] = nextDigits[i] ?? "";
                              }

                              field.handleChange(currentDigits.join(""));
                              const lastFilledIndex = Math.min(pasted.length, PIN_LENGTH) - 1;
                              if (lastFilledIndex >= 0) {
                                inputRefs.current[Math.min(lastFilledIndex, PIN_LENGTH - 1)]?.focus();
                              }
                            }}
                            className={`pm-pin-input${errorText ? " is-error" : ""}`}
                          />
                        ))}
                      </HStack>
                      {errorText ? (
                        <Text size="sm" justify="center" className="pm-error-text">
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
