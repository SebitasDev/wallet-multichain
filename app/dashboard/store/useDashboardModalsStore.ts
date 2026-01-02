import { create } from "zustand";

export type CrossChainProps = {
  initialSourceChain?: string;
  lockSourceChain?: boolean;
  initialDestChain?: string;
  lockDestChain?: boolean;
};

type ModalState = {
  addOpen: boolean;
  receiveOpen: boolean;
  crossChainOpen: boolean;
  crossChainProps: CrossChainProps; // [NEW]
  openAdd: () => void;
  closeAdd: () => void;
  openReceive: () => void;
  closeReceive: () => void;
  openCrossChain: (props?: CrossChainProps) => void; // [UPDATED]
  closeCrossChain: () => void;
};

export const useDashboardModalsStore = create<ModalState>((set) => ({
  addOpen: false,
  receiveOpen: false,
  crossChainOpen: false,
  crossChainProps: {}, // Default empty
  openAdd: () => set({ addOpen: true }),
  closeAdd: () => set({ addOpen: false }),
  openReceive: () => set({ receiveOpen: true }),
  closeReceive: () => set({ receiveOpen: false }),
  openCrossChain: (props = {}) => set({ crossChainOpen: true, crossChainProps: props }), // [UPDATED]
  closeCrossChain: () => set({ crossChainOpen: false, crossChainProps: {} }), // Reset props on close
}));
