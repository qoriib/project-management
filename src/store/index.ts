/**
 * Store Barrel Export & State Reset Utilities.
 */

import { useAppStore } from "./useAppStore";
import { useMasterStore } from "./useMasterStore";
import { useOrderStore } from "./useOrderStore";
import { useReceiptStore } from "./useReceiptStore";
import { useRequirementStore } from "./useRequirementStore";

export { useAppStore } from "./useAppStore";
export { useMasterStore } from "./useMasterStore";
export { useOrderStore } from "./useOrderStore";
export { useReceiptStore } from "./useReceiptStore";
export { useRequirementStore } from "./useRequirementStore";

/**
 * Resets all global Zustand stores to their fresh, default initial states.
 * Invoked after administrative actions like database reset or data wipe.
 */
export function resetAllStores(): void {
  useAppStore.setState({
    activeNav: "/",
    selectedProjectId: null,
  });

  useMasterStore.setState({
    categories: [],
    isLoaded: false,
    itemPricesMap: new Map(),
    items: [],
    projects: [],
    units: [],
    vendors: [],
  });

  useOrderStore.setState({
    currentItems: [],
    currentOrder: null,
    currentReceiptItems: [],
    orders: [],
  });

  useReceiptStore.setState({
    receipts: [],
  });

  useRequirementStore.setState({
    isLoadingRequirements: false,
    requirements: [],
  });
}
