import { create } from 'zustand';

interface AppState {
  mode: 'tree' | 'explode';
  setMode: (mode: 'tree' | 'explode') => void;
  toggleMode: () => void;
  
  handRotation: number;
  setHandRotation: (val: number) => void;

  isHandDetected: boolean;
  setIsHandDetected: (detected: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  mode: 'tree',
  setMode: (mode) => set({ mode }),
  toggleMode: () => set((state) => ({ mode: state.mode === 'tree' ? 'explode' : 'tree' })),
  
  handRotation: 0,
  setHandRotation: (val) => set({ handRotation: val }),

  isHandDetected: false,
  setIsHandDetected: (detected) => set({ isHandDetected: detected }),
}));