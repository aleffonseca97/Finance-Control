declare module 'next/cache' {
  export function revalidatePath(path: string): void
  export function revalidateTag(tag: string): void
}
