import { useState } from "react";
import { Button, Card, Dialog, HStack, Heading, NumberInput, Selector, Switch, Text, VStack } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Plus } from "lucide-react";
import { MasterItemForm } from "@/components/master/MasterItemForm";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { MasterVendorForm } from "@/components/master/MasterVendorForm";
import { useMasterStore } from "@/store/useMasterStore";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { useOrderItemForm } from "./form/useOrderItemForm";
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

  const { items, itemPricesMap, vendors } = useMasterStore();

  const { form, handleItemChange } = useOrderItemForm({
    initialData,
    onSubmitItem,
    onSuccess: () => {
      onClose();
    },
  });

  const selectedItemId = form.getFieldValue("item_id");
  const selectedItem = items.find((i) => i.item_id === selectedItemId);
  const priceOptions = (itemPricesMap.get(selectedItemId) ?? []).map((p) => ({
    label: `Rp ${formatNumber(p.price)}`,
    value: String(p.item_price_id),
  }));

  const vendorOptions = vendors.map((v) => ({
    label: v.vendor_name,
    value: String(v.vendor_id),
  }));

  const itemOptions = items.map((item) => {
    const code = formatItemCode(item);
    return {
      label: `${code ? `[${code}] ` : ""}${item.item_name}`,
      value: String(item.item_id),
    };
  });

  return (
    <>
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={580}>
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
              <form.Field
                name="item_id"
                children={(field) => (
                  <VStack gap={1}>
                    <HStack justify="between" align="center">
                      <Text size="sm" weight="medium">
                        Item / Material <span style={{ color: "var(--color-error)" }}>*</span>
                      </Text>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Plus size={14} />}
                        label="Item Baru"
                        onClick={() => setIsItemFormOpen(true)}
                        type="button"
                      />
                    </HStack>
                    <Selector
                      label="Item"
                      isLabelHidden
                      options={itemOptions}
                      value={field.state.value}
                      onChange={async (val) => {
                        await handleItemChange(val as string);
                      }}
                      onBlur={field.handleBlur}
                      isRequired
                      statusVariant="attached"
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                    />
                  </VStack>
                )}
              />

              <HStack gap={3}>
                <VStack gap={1} style={{ flex: 1 }}>
                  <HStack justify="between" align="center">
                    <Text size="sm" weight="medium">
                      Harga Satuan <span style={{ color: "var(--color-error)" }}>*</span>
                    </Text>
                    {selectedItemId && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Plus size={14} />}
                        label="Tambah Harga"
                        onClick={() => setIsPriceFormOpen(true)}
                        type="button"
                      />
                    )}
                  </HStack>
                  <form.Field
                    name="item_price_id"
                    children={(field) => (
                      <Selector
                        label="Harga"
                        isLabelHidden
                        options={priceOptions}
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val as string)}
                        onBlur={field.handleBlur}
                        isDisabled={!selectedItemId}
                        isRequired
                        statusVariant="attached"
                        status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                      />
                    )}
                  />
                </VStack>

                <VStack gap={1} style={{ width: 120 }}>
                  <Text size="sm" weight="medium">
                    Satuan
                  </Text>
                  <Text
                    style={{
                      height: 38,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 var(--spacing-3)",
                      backgroundColor: "var(--color-surface-subtle)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    {selectedItem?.unit_name || "-"}
                  </Text>
                </VStack>
              </HStack>

              <form.Field
                name="vendor_id"
                children={(field) => (
                  <VStack gap={1}>
                    <HStack justify="between" align="center">
                      <Text size="sm" weight="medium">
                        Vendor Supplier <span style={{ color: "var(--color-error)" }}>*</span>
                      </Text>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Plus size={14} />}
                        label="Vendor Baru"
                        onClick={() => setIsVendorFormOpen(true)}
                        type="button"
                      />
                    </HStack>
                    <Selector
                      label="Vendor"
                      isLabelHidden
                      options={vendorOptions}
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val as string)}
                      onBlur={field.handleBlur}
                      isRequired
                      statusVariant="attached"
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                    />
                  </VStack>
                )}
              />

              <HStack gap={3} align="end">
                <form.Field
                  name="qty"
                  children={(field) => (
                    <NumberInput
                      label="Volume / Qty"
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val ?? 0)}
                      onBlur={field.handleBlur}
                      min={0}
                      step={0.01}
                      isRequired
                      statusVariant="attached"
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                    />
                  )}
                />

                <form.Field
                  name="has_tax"
                  children={(field) => (
                    <VStack gap={1} style={{ paddingBottom: 4 }}>
                      <Text size="sm" weight="medium">
                        PPn (12%)
                      </Text>
                      <HStack gap={2} align="center" style={{ height: 38 }}>
                        <Switch
                          label="Kena PPn"
                          isLabelHidden
                          value={field.state.value}
                          onChange={(checked) => field.handleChange(checked)}
                          onBlur={field.handleBlur}
                        />
                        <Text size="sm">{field.state.value ? "PPn 12%" : "Tanpa PPn"}</Text>
                      </HStack>
                    </VStack>
                  )}
                />
              </HStack>
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
                const subtotal = (qty || 0) * priceNum;
                const taxAmount = hasTax ? subtotal * 0.12 : 0;
                const total = subtotal + taxAmount;

                return (
                  <Card padding={3}>
                    <VStack gap={1.5}>
                      <HStack justify="between">
                        <Text size="sm" color="secondary">
                          Subtotal:
                        </Text>
                        <Text type="code">Rp {formatNumber(subtotal)}</Text>
                      </HStack>
                      <HStack justify="between">
                        <Text size="sm" color="secondary">
                          PPn (12%):
                        </Text>
                        <Text type="code">{hasTax ? `Rp ${formatNumber(taxAmount)}` : "-"}</Text>
                      </HStack>
                      <HStack justify="between" style={{ borderTop: "1px solid var(--color-border)", paddingTop: 4 }}>
                        <Text weight="bold">Total Biaya:</Text>
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
            await handleItemChange(selectedItemId);
          }
        }}
      />
    </>
  );
}
