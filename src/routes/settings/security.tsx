import { createFileRoute } from "@tanstack/react-router";
import { Button, Heading, Text, VStack, HStack } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { changePin } from "@/db/services/auth.service";
import { useForm } from "@tanstack/react-form";
import { getFieldError, handleFormError } from "@/utils/form";
import { sanitizePin } from "@/utils/formatters";
import { useRef } from "react";
import * as v from "valibot";

const PIN_LENGTH = 6;

const changePinSchema = v.object({
  newPin: v.pipe(v.string(), v.length(6, "PIN harus tepat 6 digit")),
});

function SettingsSecurity() {
  const showToast = useToast();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

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
            <form.Field name="newPin">
              {(field) => {
                const pinDigits = Array.from({ length: PIN_LENGTH }, (_, index) => field.state.value[index] ?? "");
                const errorText = getFieldError(field.state.meta.errors, field.state.meta.isTouched);

                return (
                  <VStack gap={2} width="100%">
                    <Text size="sm" color="secondary">Masukkan 6 digit angka</Text>
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
                          aria-label={`Digit PIN baru ${index + 1}`}
                          value={digit}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            const rawValue = event.target.value;
                            const nextValue = sanitizePin(rawValue).slice(-1);
                            const currentDigits = Array.from({ length: PIN_LENGTH }, (_, pos) => field.state.value[pos] ?? "");

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

                            const currentDigits = Array.from({ length: PIN_LENGTH }, (_, pos) => field.state.value[pos] ?? "");
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
                          autoComplete="off"
                          style={{
                            width: "46px",
                            height: "54px",
                            border: `1px solid ${errorText ? "var(--color-border-critical)" : "var(--color-border-primary)"}`,
                            borderRadius: "12px",
                            background: "var(--color-background-surface)",
                            color: "var(--color-text-primary)",
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            textAlign: "center",
                            outline: "none",
                            boxShadow: digit ? "0 0 0 2px rgba(59,130,246,0.15)" : "none",
                          }}
                        />
                      ))}
                    </HStack>
                    {errorText ? (
                      <Text size="sm" style={{ textAlign: "center", color: "var(--color-text-critical)" }}>
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
