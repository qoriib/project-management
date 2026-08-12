import { Dialog, Button, VStack, Text, HStack } from "@astryxdesign/core";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Hapus",
  isDestructive = true,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} width={400}>
      <VStack gap={4}>
        <Text color="secondary">{message}</Text>
        <HStack gap={2} justify="end">
          <Button variant="tertiary" onPress={onClose} isDisabled={isLoading}>
            Batal
          </Button>
          <Button
            variant={isDestructive ? "negative" : "primary"}
            onPress={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </HStack>
      </VStack>
    </Dialog>
  );
}
