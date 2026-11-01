/** بنری که در سایت نمایش داده می‌شود (فقط فیلدهای لازم برای UI). */
export type BannerSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  linkUrl: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  imageAlt: string | null;
};
