import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  FormLayout,
  HStack,
  Heading,
  IconButton,
  InputGroup,
  InputGroupText,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  Selector,
  Switch,
  Text,
  TextInput,
  VStack,
} from "@astryxdesign/core";
import { MoreHorizontal, X } from "lucide-react";
import { useSelector } from "@tanstack/react-form";
import { ItemPriceSummaryCard } from "@/components/shared/ItemPriceSummaryCard";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { useMasterStore } from "@/store/useMasterStore";
import { formatNumber, formatItemCode, sanitizeDecimalInput, parseDecimalInput } from "@/utils/formatters";
import { TAX_RATIO_PERCENT } from "@/utils/calc";
import { getFieldError } from "@/utils/form";
import { type ReceiptItemInputPayload, useReceiptItemForm } from "./form/useReceiptItemForm";
import type { OrderItemDetail, ReceiptItemDetail } from "@/db/repositories";

interface ReceiptItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ReceiptItemDetail;
  availableOrderItems: OrderItemDetail[];
  onSubmitItem: (item: ReceiptItemInputPayload) => void;
}

export function ReceiptItemDialog({
  isOpen,
  onClose,
  initialData,
  availableOrderItems,
  onSubmitItem,
}: ReceiptItemDialogProps) {
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
  const items = useMasterStore((state) => state.items);
  const itemPricesMap = useMasterStore((state) => state.itemPricesMap);
  const loadItemPrices = useMasterStore((state) => state.loadItemPrices);

  const { form, handleOrderItemChange } = useReceiptItemForm({
    initialData,
    availableOrderItems,
    onSubmitItem,
    onSuccess: () => {
      onClose();
    },
  });

  const selectedOrderItemId = useSelector(form.store, (state) => state.values.order_item_id);
  const selectedItemPriceId = useSelector(form.store, (state) => state.values.item_price_id);
  const selectedQty = useSelector(form.store, (state) => state.values.qty);
  const selectedHasTax = useSelector(form.store, (state) => state.values.has_tax);

  const selectedOrderItem = availableOrderItems.find((item) => item.order_item_id === selectedOrderItemId);
  const selectedItemId = selectedOrderItem?.item_id || initialData?.item_id;
  const selectedUnit = selectedOrderItem?.unit ?? initialData?.unit ?? "";

  useEffect(() => {
    if (selectedItemId) {
      loadItemPrices(selectedItemId);
    }
  }, [selectedItemId, loadItemPrices]);

  const priceOptions = (selectedItemId ? (itemPricesMap.get(selectedItemId) ?? []) : []).map((priceItem) => ({
    label: priceItem.note
      ? `Rp ${formatNumber(priceItem.price, "currency")} (${priceItem.note})`
      : `Rp ${formatNumber(priceItem.price, "currency")}`,
    value: String(priceItem.item_price_id),
  }));

  const orderItemOptions = availableOrderItems.map((item) => {
    const code = formatItemCode(item);
    const remainingText = formatNumber(item.remaining ?? 0, "volume");
    return {
      label: `${code ? `${code} - ` : ""}${item.item_name} (Sisa: ${remainingText} ${item.unit || ""})`,
      value: String(item.order_item_id),
    };
  });

  const currentPriceObj = selectedItemId
    ? itemPricesMap.get(selectedItemId)?.find((p) => p.item_price_id === selectedItemPriceId)
    : undefined;
  const currentPrice = currentPriceObj?.price ?? initialData?.price ?? 0;

  return (
    <>
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={520} maxHeight="85vh">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <Layout
            height="fill"
            header={
              <LayoutHeader hasDivider>
                <HStack justify="between" align="center" width="100%">
                  <Heading level={3}>{initialData ? "Edit Item Penerimaan" : "Tambah Item Penerimaan"}</Heading>
                  <IconButton type="button" variant="secondary" icon={<X />} label="Tutup" onClick={onClose} />
                </HStack>
              </LayoutHeader>
            }
            content={
              <LayoutContent padding={4}>
                <VStack gap={4}>
                  <FormLayout>
                    <form.Field name="order_item_id">
                      {(field) => (
                        <Selector
                          isRequired
                          hasSearch
                          label="Item Pesanan (PO)"
                          searchPlaceholder="Cari item dari pesanan..."
                          statusVariant="tooltip"
                          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                          options={orderItemOptions}
                          value={field.state.value || undefined}
                          isDisabled={Boolean(initialData)}
                          onChange={(val) => {
                            const v = (val as string) || "";
                            field.handleChange(v);
                            handleOrderItemChange(v);
                          }}
                        />
                      )}
                    </form.Field>

                    {selectedOrderItem ? (
                      <HStack justify="between" align="center">
                        <Text size="sm" color="secondary">
                          Volume Dipesan: {formatNumber(selectedOrderItem.qty, "volume")} {selectedUnit}
                        </Text>
                        <Text size="sm" color="secondary">
                          Sisa Belum Diterima: {formatNumber(selectedOrderItem.remaining ?? 0, "volume")} {selectedUnit}
                        </Text>
                      </HStack>
                    ) : null}

                    {/* Harga Satuan */}
                    <HStack gap={2} align="end" width="100%">
                      <VStack width="100%">
                        <form.Field
                          name="item_price_id"
                          children={(field) => (
                            <Selector
                              label="Harga Satuan (Rp)"
                              options={priceOptions}
                              value={field.state.value || undefined}
                              onChange={(val) => field.handleChange((val as string) || "")}
                              onBlur={field.handleBlur}
                              hasSearch
                              searchPlaceholder="Pilih variasi harga..."
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
                        icon={<MoreHorizontal />}
                        label="Kelola Harga"
                        onClick={() => setIsPriceFormOpen(true)}
                        type="button"
                        isDisabled={!selectedItemId}
                      />
                    </HStack>

                    <form.Field name="qty">
                      {(field) => (
                        <InputGroup
                          label="Volume Diterima"
                          isRequired
                          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                        >
                          <TextInput
                            label="Volume Diterima"
                            isLabelHidden
                            value={String(field.state.value ?? "")}
                            onChange={(val) => field.handleChange(sanitizeDecimalInput(val))}
                            onBlur={field.handleBlur}
                          />
                          <InputGroupText>{selectedUnit || "-"}</InputGroupText>
                        </InputGroup>
                      )}
                    </form.Field>

                    <form.Field name="has_tax">
                      {(field) => (
                        <Switch
                          label={`Kena Pajak PPn (${TAX_RATIO_PERCENT}%)`}
                          value={Boolean(field.state.value)}
                          onChange={(checked) => field.handleChange(checked)}
                        />
                      )}
                    </form.Field>
                  </FormLayout>

                  <ItemPriceSummaryCard
                    price={currentPrice}
                    qty={parseDecimalInput(selectedQty)}
                    hasTax={selectedHasTax}
                  />
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter hasDivider>
                <HStack justify="end" gap={2} width="100%">
                  <Button type="button" variant="secondary" label="Batal" onClick={onClose} />
                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                    {([canSubmit, isSubmitting]) => (
                      <Button
                        type="submit"
                        variant="primary"
                        label={initialData ? "Simpan Perubahan" : "Tambah Item"}
                        isLoading={isSubmitting}
                        isDisabled={!canSubmit}
                      />
                    )}
                  </form.Subscribe>
                </HStack>
              </LayoutFooter>
            }
          />
        </form>
      </Dialog>

      {isPriceFormOpen && (
        <MasterItemPriceDialog
          isOpen={isPriceFormOpen}
          item={items.find((i) => i.item_id === selectedItemId) ?? null}
          onClose={async () => {
            setIsPriceFormOpen(false);
            if (selectedItemId) {
              await loadItemPrices(selectedItemId);
            }
          }}
          onSuccess={(newPriceId) => {
            form.setFieldValue("item_price_id", newPriceId);
          }}
        />
      )}
    </>
  );
}
