import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Dialog,
  HStack,
  Heading,
  IconButton,
  InputGroup,
  InputGroupText,
  Selector,
  Switch,
  Text,
  TextInput,
  VStack,
} from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { MoreHorizontal, Plus } from "lucide-react";
import { MasterItemForm } from "@/components/master/MasterItemForm";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { MasterVendorForm } from "@/components/master/MasterVendorForm";
import { useMasterStore } from "@/store/useMasterStore";
import { formatNumber, formatItemCode, sanitizeDecimalInput, parseDecimalInput } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { useOrderItemForm } from "./form/useOrderItemForm";
import { useStore } from "@tanstack/react-form";
import type { OrderItemDetail } from "@/db/repositories";

interface OrderItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: OrderItemDetail;
  onSubmitItem: (item: any) => void;
}

export function OrderItemDialog({ isOpen, onClose, initialData, onSubmitItem }: OrderItemDialogProps) {
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);

  const { items, itemPricesMap, vendors, loadItemPrices } = useMasterStore();

  const { form, handleItemChange } = useOrderItemForm({
    initialData,
    onSubmitItem,
    onSuccess: () => {
      onClose();
    },
  });

  const selectedItemId = useStore(form.store, (s) => s.values.item_id);

  useEffect(() => {
    if (selectedItemId) {
      loadItemPrices(selectedItemId);
    }
  }, [selectedItemId, loadItemPrices]);

  const selectedItem = items.find((i) => i.item_id === selectedItemId);
  const selectedItemCode = selectedItem ? formatItemCode(selectedItem) : "";
  const priceOptions = (itemPricesMap.get(selectedItemId) ?? []).map((p) => ({
    label: `Rp ${formatNumber(p.price)}`,
    value: String(p.item_price_id),
  }));

  const vendorOptions = vendors.map((v) => ({
    label: v.vendor_name,
    value: String(v.vendor_id),
  }));

  const itemOptions = items.map((item) => ({
    label: item.item_name,
    value: String(item.item_id),
  }));

  return (
    <>
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={520}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <VStack gap={4}>
            <Heading level={3}>{initialData ? "Edit Item Order" : "Tambah Item Order"}</Heading>
            <FormLayout>
              {/* Item */}
              <HStack gap={2} align="end" width="100%">
                <VStack style={{ flex: 1 }}>
                  <form.Field
                    name="item_id"
                    children={(field) => (
                      <Selector
                        label="Item"
                        description={selectedItemCode ? `Kode: ${selectedItemCode}` : undefined}
                        options={itemOptions}
                        value={field.state.value}
                        onChange={async (val) => {
                          await handleItemChange(val as string);
                        }}
                        onBlur={field.handleBlur}
                        isRequired
                        statusVariant="tooltip"
                        status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                      />
                    )}
                  />
                </VStack>
                <IconButton
                  variant="secondary"
                  icon={<Plus size={16} />}
                  label="Tambah Item Baru"
                  onClick={() => setIsItemFormOpen(true)}
                  type="button"
                />
              </HStack>

              {/* Harga Satuan */}
              <HStack gap={2} align="end" width="100%">
                <VStack style={{ flex: 1 }}>
                  <form.Field
                    name="item_price_id"
                    children={(field) => (
                      <Selector
                        label="Harga Satuan"
                        options={priceOptions}
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val as string)}
                        onBlur={field.handleBlur}
                        isDisabled={!selectedItemId}
                        isRequired
                        statusVariant="tooltip"
                        status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                      />
                    )}
                  />
                </VStack>
                <IconButton
                  variant="secondary"
                  icon={<MoreHorizontal size={16} />}
                  label="Kelola Harga"
                  onClick={() => setIsPriceFormOpen(true)}
                  type="button"
                  isDisabled={!selectedItemId}
                />
              </HStack>

              {/* Vendor */}
              <HStack gap={2} align="end" width="100%">
                <VStack style={{ flex: 1 }}>
                  <form.Field
                    name="vendor_id"
                    children={(field) => (
                      <Selector
                        label="Vendor"
                        options={vendorOptions}
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val as string)}
                        onBlur={field.handleBlur}
                        isRequired
                        statusVariant="tooltip"
                        status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                      />
                    )}
                  />
                </VStack>
                <IconButton
                  variant="secondary"
                  icon={<Plus size={16} />}
                  label="Tambah Vendor Baru"
                  onClick={() => setIsVendorFormOpen(true)}
                  type="button"
                />
              </HStack>

              {/* Volume dengan InputGroup Satuan */}
              <form.Field
                name="qty"
                children={(field) => (
                  <InputGroup
                    label="Volume"
                    isRequired
                    status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                  >
                    <TextInput
                      label="Volume"
                      isLabelHidden
                      value={String(field.state.value ?? "")}
                      onChange={(val) => field.handleChange(sanitizeDecimalInput(val))}
                      onBlur={field.handleBlur}
                    />
                    <InputGroupText>{selectedItem?.unit_name || "-"}</InputGroupText>
                  </InputGroup>
                )}
              />

              {/* Kena PPn */}
              <form.Field
                name="has_tax"
                children={(field) => (
                  <Switch
                    label="PPn (12%)"
                    value={field.state.value}
                    onChange={(checked) => field.handleChange(checked)}
                    onBlur={field.handleBlur}
                  />
                )}
              />
            </FormLayout>

            {/* Realtime calculation summary card */}
            <form.Subscribe
              selector={(s) => ({
                itemId: s.values.item_id,
                priceId: s.values.item_price_id,
                qty: s.values.qty,
                hasTax: s.values.has_tax,
              })}
            >
              {({ itemId, priceId, qty, hasTax }) => {
                let priceNum = 0;
                if (itemId && priceId) {
                  const prices = itemPricesMap.get(itemId) ?? [];
                  const pObj = prices.find((p) => String(p.item_price_id) === String(priceId));
                  if (pObj) priceNum = pObj.price;
                }
                const numQty = parseDecimalInput(qty);
                const subtotal = numQty * priceNum;
                const taxAmount = hasTax ? subtotal * 0.12 : 0;
                const total = subtotal + taxAmount;

                return (
                  <Card padding={3}>
                    <VStack gap={1.5}>
                      <HStack justify="between">
                        <Text size="sm" color="secondary">
                          Subtotal
                        </Text>
                        <Text type="code">Rp {formatNumber(subtotal)}</Text>
                      </HStack>
                      <HStack justify="between">
                        <Text size="sm" color="secondary">
                          PPn (12%)
                        </Text>
                        <Text type="code">{hasTax ? `Rp ${formatNumber(taxAmount)}` : "-"}</Text>
                      </HStack>
                      <HStack justify="between" style={{ borderTop: "1px solid var(--color-border)", paddingTop: 4 }}>
                        <Text weight="bold">Total</Text>
                        <Text type="code" weight="bold" color="primary">
                          Rp {formatNumber(total)}
                        </Text>
                      </HStack>
                    </VStack>
                  </Card>
                );
              }}
            </form.Subscribe>

            <HStack justify="end" gap={2}>
              <Button variant="secondary" label="Batal" onClick={onClose} type="button" />
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    variant="primary"
                    label="Simpan"
                    type="submit"
                    isLoading={isSubmitting}
                    isDisabled={!canSubmit}
                  />
                )}
              />
            </HStack>
          </VStack>
        </form>
      </Dialog>

      <MasterItemForm isOpen={isItemFormOpen} onClose={() => setIsItemFormOpen(false)} initialData={null} />
      <MasterVendorForm isOpen={isVendorFormOpen} onClose={() => setIsVendorFormOpen(false)} initialData={null} />
      <MasterItemPriceDialog
        isOpen={isPriceFormOpen}
        item={selectedItem ?? null}
        onClose={async () => {
          setIsPriceFormOpen(false);
          if (selectedItemId) {
            await loadItemPrices(selectedItemId);
          }
        }}
      />
    </>
  );
}
