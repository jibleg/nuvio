import type { Variants, Transition } from "framer-motion";

export const easeOutSoft: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const springSoft: Transition = {
  type: "spring",
  stiffness: 140,
  damping: 20,
  mass: 0.9,
};

/** Fade + rise, used for section reveals. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: easeOutSoft },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.9, ease: easeOutSoft } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: easeOutSoft },
  },
};

/** Stagger container: children animate in sequence. */
export const stagger = (staggerChildren = 0.1, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren, delayChildren },
  },
});

/** Common viewport config so sections reveal once, slightly early. */
export const viewportOnce = { once: true, amount: 0.3 } as const;
