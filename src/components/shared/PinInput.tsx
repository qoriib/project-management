import { useEffect, useRef } from "react";
import { HStack } from "@astryxdesign/core";
import { sanitizePin } from "@/utils/formatters";

export interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  onSubmit?: () => void;
  length?: number;
  isError?: boolean;
  isDisabled?: boolean;
  autoFocus?: boolean;
  name?: string;
}

export function PinInput({
  value = "",
  onChange,
  onComplete,
  onSubmit,
  length = 4,
  isError = false,
  isDisabled = false,
  autoFocus = true,
  name = "pin",
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const handleDigitChange = (index: number, rawVal: string) => {
    const sanitized = sanitizePin(rawVal);
    const nextDigits = [...digits];

    if (sanitized) {
      nextDigits[index] = sanitized[0];
      const nextPin = nextDigits.join("");
      onChange(nextPin);

      if (nextPin.length === length && onComplete) {
        onComplete(nextPin);
      }

      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      nextDigits[index] = "";
      onChange(nextDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (event.key === "Enter" && onSubmit) {
      onSubmit();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = sanitizePin(event.clipboardData.getData("text"));
    if (!pasted) return;

    const nextDigits = Array.from({ length }, (_, pos) => value[pos] ?? "");
    const pastedChars = pasted.slice(0, length).split("");

    for (let i = 0; i < length; i += 1) {
      if (pastedChars[i] !== undefined) {
        nextDigits[i] = pastedChars[i];
      }
    }

    const nextPin = nextDigits.join("");
    onChange(nextPin);

    if (nextPin.length === length && onComplete) {
      onComplete(nextPin);
    }

    const lastIndex = Math.min(pasted.length, length) - 1;
    if (lastIndex >= 0) {
      inputRefs.current[Math.min(lastIndex, length - 1)]?.focus();
    }
  };

  return (
    <HStack gap={2} justify="center">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={isDisabled}
          autoComplete="off"
          name={`${name}-${index}`}
          onChange={(e) => handleDigitChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          style={{
            width: 46,
            height: 54,
            border: isError ? "1px solid var(--color-error)" : "1px solid var(--color-border)",
            borderRadius: "var(--radius-container)",
            backgroundColor: "var(--color-background-surface)",
            color: "var(--color-text-primary)",
            fontSize: "1.5rem",
            fontWeight: 700,
            textAlign: "center",
            outline: "none",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          }}
        />
      ))}
    </HStack>
  );
}
