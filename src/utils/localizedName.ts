export function localizedName(
  item: { nameEn?: string; nameAr?: string; name?: string } | null | undefined,
  lang: string,
): string {
  if (!item) return "";
  if (lang === "ar") return item.nameAr ?? item.nameEn ?? item.name ?? "";
  return item.nameEn ?? item.nameAr ?? item.name ?? "";
}
