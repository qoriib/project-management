import {
  Button,
  Dialog,
  HStack,
  Heading,
  Text,
  TextInput,
  VStack,
} from "@astryxdesign/core";
import { useEffect, useState } from "react";

interface SettingsResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function SettingsResetDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: SettingsResetDialogProps) {
  const [resetConfirmText, setResetConfirmText] = useState("");

  // Clear input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setResetConfirmText("");
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (resetConfirmText === "RESET") {
      await onConfirm();
    }
  };

  return (
    <Dialog
      width={500}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
      purpose="required"
    >
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={3}>Reset Database</Heading>
          <Text style={{ color: "var(--color-danger)" }}>
            Peringatan: Tindakan ini tidak dapat dibatalkan!
          </Text>
        </VStack>

        <Text>
          Anda akan menghapus bersih{" "}
          <Text as="span" weight="bold">
            SELURUH
          </Text>{" "}
          isi database aplikasi ini termasuk semua Master Data (vendor, daftar
          harga item, dll) secara permanen. Tindakan ini tidak bisa dibatalkan!
        </Text>

        <TextInput
          label="Ketik 'RESET' untuk melanjutkan:"
          placeholder="RESET"
          value={resetConfirmText}
          onChange={(val) => setResetConfirmText(val || "")}
        />

        <HStack gap={2} justify="end" style={{ marginTop: "var(--spacing-2)" }}>
          <Button
            label="Batal"
            variant="secondary"
            onClick={onClose}
            isDisabled={isLoading}
          />
          <Button
            label="Hapus & Reset"
            variant="secondary"
            isDisabled={resetConfirmText !== "RESET"}
            onClick={handleConfirm}
            isLoading={isLoading}
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}
