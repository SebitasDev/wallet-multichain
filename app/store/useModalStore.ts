import { create } from "zustand";

type ModalState = {
  addOpen: boolean;
  receiveOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;
  openReceive: () => void;
  closeReceive: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
  addOpen: false,
  receiveOpen: false,
  openAdd: () => set({ addOpen: true }),
  closeAdd: () => set({ addOpen: false }),
  openReceive: () => set({ receiveOpen: true }),
  closeReceive: () => set({ receiveOpen: false }),
}));
