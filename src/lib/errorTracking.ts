import { create } from 'zustand';

interface ErrorState {
  hasFetchError: boolean;
  setFetchError: (hasError: boolean) => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  hasFetchError: false,
  setFetchError: (hasError) => set({ hasFetchError: hasError }),
}));
