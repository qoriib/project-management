const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = [
  ...walk('d:/project-management/src/components'),
  ...walk('d:/project-management/src/routes')
];

let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Replacements
  const replacements = [
    [/useBOMStore/g, 'useRequirementStore'],
    [/bomRepo/g, 'requirementRepo'],
    [/BOMDetail/g, 'RequirementDetail'],
    [/createBOM/g, 'createRequirement'],
    [/updateBOM/g, 'updateRequirement'],
    [/deleteBOM/g, 'deleteRequirement'],
    [/loadBOMs/g, 'loadRequirements'],
    [/isLoadingBOMs/g, 'isLoadingRequirements'],
    [/BOMTable/g, 'RequirementTable'],
    [/BOMGroupDialog/g, 'RequirementGroupDialog'],
    [/boms\.map/g, 'requirements.map'],
    [/boms\.length/g, 'requirements.length'],
    [/\bboms\b/g, 'requirements'],
    [/\bbom\b/g, 'requirement'],
    [/\bBOM\b/g, 'Requirement'],
    [/\bBOMs\b/g, 'Requirements'],

    [/usePOStore/g, 'useOrderStore'],
    [/purchaseOrderRepo/g, 'orderRepo'],
    [/POWithSummary/g, 'OrderWithSummary'],
    [/POItemDetail/g, 'OrderItemDetail'],
    [/createPO/g, 'createOrder'],
    [/updatePO/g, 'updateOrder'],
    [/deletePO/g, 'deleteOrder'],
    [/loadAllPOs/g, 'loadAllOrders'],
    [/loadPODetail/g, 'loadOrderDetail'],
    [/clearPODetail/g, 'clearOrderDetail'],
    [/currentPO/g, 'currentOrder'],
    [/POTable/g, 'OrderTable'],
    [/POForm/g, 'OrderForm'],
    [/POItemTrackingTable/g, 'OrderItemTrackingTable'],
    [/PODeliveryLogTable/g, 'OrderReceiptLogTable'],
    [/\bpos\b/g, 'orders'],
    [/\bpo\b/g, 'order'],
    [/\bPO\b/g, 'Order'],
    [/\bPOs\b/g, 'Orders'],

    [/useDeliveryStore/g, 'useReceiptStore'],
    [/deliveryRepo/g, 'receiptRepo'],
    [/DeliverySummary/g, 'ReceiptSummary'],
    [/DeliveryItemByPO/g, 'ReceiptItemByOrder'],
    [/createDelivery/g, 'createReceipt'],
    [/updateDelivery/g, 'updateReceipt'],
    [/deleteDelivery/g, 'deleteReceipt'],
    [/loadAllDeliveries/g, 'loadAllReceipts'],
    [/DeliveryTable/g, 'ReceiptTable'],
    [/DeliveryForm/g, 'ReceiptForm'],
    [/\bdeliveries\b/g, 'receipts'],
    [/\bdelivery\b/g, 'receipt'],
    [/\bDelivery\b/g, 'Receipt'],
    [/\bDeliveries\b/g, 'Receipts'],

    // Also update UI strings (Bahasa Indonesia domain terms)
    [/Kebutuhan Group/gi, 'Kebutuhan'],
    [/Group/g, 'Kategori'], // Usually bom group -> requirement category if at all
    [/bomGroups/g, '[]'], // Hardcode to empty if still present
  ];

  for (const [regex, replacement] of replacements) {
    newContent = newContent.replace(regex, replacement);
  }

  // Remove BOMGroupDialog import and usages
  newContent = newContent.replace(/import .*BOMGroupDialog.*(\n|$)/g, '');
  newContent = newContent.replace(/<BOMGroupDialog[^>]*\/>/g, '');
  newContent = newContent.replace(/<RequirementGroupDialog[^>]*\/>/g, ''); // in case it was already replaced
  newContent = newContent.replace(/import .*RequirementGroupDialog.*(\n|$)/g, '');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
  }
});

console.log(`Changed ${changedCount} files.`);
