import { useEffect, useState } from "react";
import { Button, Dialog, HStack, Heading, Text, TextInput, VStack } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";

interface SettingsResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function SettingsResetDialog({ isOpen, onClose, onConfirm, isLoading = false }: SettingsResetDialogProps) {
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
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
      width={520}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleConfirm();
        }}
      >
        <VStack gap={3}>
          <Heading level={3}>Reset Database</Heading>
          <FormLayout>
            <Text type="supporting" color="secondary">
              Tindakan ini akan menghapus bersih seluruh isi basis data termasuk semua Master Data secara permanen.
            </Text>
            <TextInput
              isRequired
              label="Konfirmasi Tindakan"
              placeholder="Ketik 'RESET' untuk melanjutkan"
              value={resetConfirmText}
              onChange={(val) => setResetConfirmText(val || "")}
            />
            <HStack gap={2} justify="end">
              <Button variant="secondary" label="Batal" onClick={onClose} isDisabled={isLoading} type="button" />
              <Button
                variant="destructive"
                label="Hapus & Reset"
                type="submit"
                isDisabled={resetConfirmText !== "RESET" || isLoading}
                isLoading={isLoading}
              />
            </HStack>
          </FormLayout>
        </VStack>
      </form>
    </Dialog>
  );
}
