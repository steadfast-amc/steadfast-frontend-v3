import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Combines conditional class logic (clsx) with conflict resolution
// (tailwind-merge, so e.g. "p-2" + "p-4" correctly resolves to just "p-4"
// instead of both being applied). Standard pattern in every Tailwind
// component library for a reason — worth the two tiny dependencies.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
