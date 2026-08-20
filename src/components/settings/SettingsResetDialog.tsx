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
        <Heading level={3}>Reset Database</Heading>
        <Text color="secondary">
          Tindakan ini akan menghapus bersih <strong>seluruh</strong> isi basis
          data termasuk semua Master Data secara permanen.
        </Text>
        <TextInput
          label="Ketik 'RESET' untuk melanjutkan:"
          placeholder="RESET"
          value={resetConfirmText}
          onChange={(val) => setResetConfirmText(val || "")}
        />
        <HStack gap={2} justify="end">
          <Button
            label="Batal"
            variant="secondary"
            onClick={onClose}
            isDisabled={isLoading}
          />
          <Button
            label="Hapus & Reset"
            variant="destructive"
            isDisabled={resetConfirmText !== "RESET"}
            onClick={handleConfirm}
            isLoading={isLoading}
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}
