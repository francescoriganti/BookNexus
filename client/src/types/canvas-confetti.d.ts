declare module 'canvas-confetti' {
  export interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: ('circle' | 'square')[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  type ConfettiFunction = (options?: Options) => Promise<null>;

  export interface GlobalOptions {
    resize: boolean;
    useWorker: boolean;
  }

  export interface CreateTypes {
    (options?: GlobalOptions): {
      (options?: Options): Promise<null>;
      reset: () => void;
    };
  }

  const confetti: ConfettiFunction & {
    create: CreateTypes;
    reset: () => void;
  };

  export default confetti;
}