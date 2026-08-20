import {
  Button,
  Dialog,
  HStack,
  Heading,
  Text,
  VStack,
} from "@astryxdesign/core";

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
    <Dialog
      width={400}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <VStack gap={4}>
        <Heading level={3}>{title}</Heading>
        <Text color="secondary">{message}</Text>
        <HStack gap={2} justify="end">
          <Button
            label="Batal"
            variant="secondary"
            onClick={onClose}
            isDisabled={isLoading}
          />
          <Button
            label={confirmLabel}
            variant={isDestructive ? "destructive" : "primary"}
            onClick={onConfirm}
            isLoading={isLoading}
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}
