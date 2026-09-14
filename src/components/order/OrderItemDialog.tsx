import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  HStack,
  FormLayout,
  Heading,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  IconButton,
  InputGroup,
  InputGroupText,
  Selector,
  Switch,
  TextInput,
  VStack,
} from "@astryxdesign/core";
import { MoreHorizontal, Plus } from "lucide-react";
import { MasterItemForm } from "@/components/master/MasterItemForm";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { MasterVendorForm } from "@/components/master/MasterVendorForm";
import { RequirementGroupDialog } from "@/components/requirement/RequirementGroupDialog";
import { ItemPriceSummaryCard } from "@/components/shared/ItemPriceSummaryCard";
import { useMasterStore } from "@/store/useMasterStore";
import { useRequirementGroupStore } from "@/store/useRequirementGroupStore";
import { useAppStore } from "@/store/useAppStore";
import { formatNumber, formatItemCode, sanitizeDecimalInput } from "@/utils/formatters";
import { TAX_RATIO_PERCENT } from "@/utils/calc";
import { getFieldError } from "@/utils/form";
import { type OrderItemInputPayload, useOrderItemForm } from "./form/useOrderItemForm";
import { useSelector } from "@tanstack/react-form";
import type { OrderItemDetail } from "@/db/repositories";

interface OrderItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: OrderItemDetail;
  defaultRequirementGroupId?: string;
  onSubmitItem: (item: OrderItemInputPayload) => void;
}

export function OrderItemDialog({
  isOpen,
  onClose,
  initialData,
  defaultRequirementGroupId,
  onSubmitItem,
}: OrderItemDialogProps) {
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { groups, loadGroups } = useRequirementGroupStore();
  const { items, itemPricesMap, vendors, loadItemPrices } = useMasterStore();

  useEffect(() => {
    if (selectedProjectId) {
      loadGroups(selectedProjectId);
    }
  }, [selectedProjectId, loadGroups]);

  const { form, handleItemChange } = useOrderItemForm({
    defaultRequirementGroupId,
    initialData,
    onSubmitItem,
    onSuccess: () => {
      onClose();
    },
  });

  const groupOptions = groups.map((g) => ({
    label: g.group_name,
    value: String(g.requirement_group_id),
  }));

  const selectedItemId = useSelector(form.store, (s) => s.values.item_id);

  useEffect(() => {
    if (selectedItemId) {
      loadItemPrices(selectedItemId);
    }
  }, [selectedItemId, loadItemPrices]);

  const selectedItem = items.find((i) => i.item_id === selectedItemId);
  const selectedItemCode = selectedItem ? formatItemCode(selectedItem) : "";
  const priceOptions = (itemPricesMap.get(selectedItemId) ?? []).map((p) => ({
    label: `Rp ${formatNumber(p.price, 2)}`,
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
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={520} maxHeight="85vh">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <Layout
            header={
              <LayoutHeader hasDivider>
                <Heading level={3}>{initialData ? "Edit Item Pesanan" : "Tambah Item Pesanan"}</Heading>
              </LayoutHeader>
            }
            content={
              <LayoutContent padding={4}>
                <VStack gap={4}>
                  <FormLayout>
                    {/* Kelompok Pekerjaan */}
                    <HStack gap={2} align="end" width="100%">
                      <VStack width="100%">
                        <form.Field
                          name="requirement_group_id"
                          children={(field) => (
                            <Selector
                              hasSearch
                              isRequired
                              searchPlaceholder="Cari kelompok pekerjaan..."
                              statusVariant="tooltip"
                              label="Kelompok Pekerjaan"
                              options={groupOptions}
                              value={field.state.value || undefined}
                              onChange={(val) => field.handleChange((val as string) || "")}
                              onBlur={field.handleBlur}
                              status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                            />
                          )}
                        />
                      </VStack>
                      <IconButton
                        type="button"
                        variant="secondary"
                        label="Kelola Pekerjaan"
                        icon={<Plus />}
                        onClick={() => setIsGroupFormOpen(true)}
                      />
                    </HStack>

                    {/* Item */}
                    <HStack gap={2} align="end" width="100%">
                      <VStack width="100%">
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
                              hasSearch
                              searchPlaceholder="Cari item..."
                              isRequired
                              statusVariant="tooltip"
                              status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                            />
                          )}
                        />
                      </VStack>
                      <IconButton
                        variant="secondary"
                        icon={<Plus />}
                        label="Tambah Item Baru"
                        onClick={() => setIsItemFormOpen(true)}
                        type="button"
                      />
                    </HStack>

                    {/* Harga Satuan */}
                    <HStack gap={2} align="end" width="100%">
                      <VStack width="100%">
                        <form.Field
                          name="item_price_id"
                          children={(field) => (
                            <Selector
                              label="Harga Satuan (Rp)"
                              options={priceOptions}
                              value={field.state.value}
                              onChange={(val) => field.handleChange(val as string)}
                              onBlur={field.handleBlur}
                              hasSearch
                              searchPlaceholder="Cari riwayat harga..."
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

                    {/* Vendor */}
                    <HStack gap={2} align="end" width="100%">
                      <VStack width="100%">
                        <form.Field
                          name="vendor_id"
                          children={(field) => (
                            <Selector
                              label="Vendor"
                              options={vendorOptions}
                              value={field.state.value}
                              onChange={(val) => field.handleChange(val as string)}
                              onBlur={field.handleBlur}
                              hasSearch
                              searchPlaceholder="Cari vendor pemasok..."
                              isRequired
                              statusVariant="tooltip"
                              status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                            />
                          )}
                        />
                      </VStack>
                      <IconButton
                        variant="secondary"
                        icon={<Plus />}
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
                          label="Volume Pesanan"
                          isRequired
                          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                        >
                          <TextInput
                            label="Volume Pesanan"
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
                          label={`Terkena PPn (${TAX_RATIO_PERCENT}%)`}
                          value={Boolean(field.state.value)}
                          onChange={(checked) => field.handleChange(checked)}
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
                      return <ItemPriceSummaryCard price={priceNum} qty={qty} hasTax={hasTax} />;
                    }}
                  </form.Subscribe>
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter hasDivider>
                <HStack justify="end" gap={2} width="100%">
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
              </LayoutFooter>
            }
          />
        </form>
      </Dialog>

      <MasterItemForm
        isOpen={isItemFormOpen}
        onClose={() => setIsItemFormOpen(false)}
        initialData={null}
        onSuccess={async (newItemId) => {
          await handleItemChange(newItemId);
        }}
      />
      <MasterVendorForm
        isOpen={isVendorFormOpen}
        onClose={() => setIsVendorFormOpen(false)}
        initialData={null}
        onSuccess={(newVendorId) => {
          form.setFieldValue("vendor_id", newVendorId);
        }}
      />
      <MasterItemPriceDialog
        isOpen={isPriceFormOpen}
        item={selectedItem ?? null}
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
      <RequirementGroupDialog
        isOpen={isGroupFormOpen}
        onClose={() => setIsGroupFormOpen(false)}
        onSuccess={(newGroupId) => {
          form.setFieldValue("requirement_group_id", newGroupId);
        }}
      />
    </>
  );
}
