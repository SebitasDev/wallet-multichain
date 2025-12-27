import { create } from "zustand";

type ModalState = {
  addOpen: boolean;
  receiveOpen: boolean;
  crossChainOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;
  openReceive: () => void;
  closeReceive: () => void;
  openCrossChain: () => void;
  closeCrossChain: () => void;
};

export const useDashboardModalsStore = create<ModalState>((set) => ({
  addOpen: false,
  receiveOpen: false,
  crossChainOpen: false,
  openAdd: () => set({ addOpen: true }),
  closeAdd: () => set({ addOpen: false }),
  openReceive: () => set({ receiveOpen: true }),
  closeReceive: () => set({ receiveOpen: false }),
  openCrossChain: () => set({ crossChainOpen: true }),
  closeCrossChain: () => set({ crossChainOpen: false }),
}));
