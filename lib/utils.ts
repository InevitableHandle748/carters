import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const STORE_SIZE_LABELS: Record<string, string> = {
  TWO_REGISTER: '2 Register',
  THREE_REGISTER: '3 Register',
  FOUR_REGISTER: '4 Register',
}

export function formatStoreSize(size?: string | null): string {
  if (!size) return ''
  return STORE_SIZE_LABELS[size] ?? size
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}