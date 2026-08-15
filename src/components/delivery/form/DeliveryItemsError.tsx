import { Text } from "@astryxdesign/core";
import type { useDeliveryForm } from "./useDeliveryForm";

interface DeliveryItemsErrorProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
}

/**
 * Menampilkan pesan error level-array untuk field `items`:
 * misalnya "Minimal ada 1 item yang diterima."
 */
export function DeliveryItemsError({ form }: DeliveryItemsErrorProps) {
  return (
    <form.Field name="items">
      {(field) => {
        const hasError = field.state.meta.errors.length > 0;

        if (!hasError) {
          return null;
        }

        const firstError = field.state.meta.errors[0];
        const isString = typeof firstError === "string";
        const message = isString
          ? firstError
          : (firstError as { message?: string })?.message;

        return (
          <Text size="sm" style={{ color: "#e3193b" }}>
            {message}
          </Text>
        );
      }}
    </form.Field>
  );
}
