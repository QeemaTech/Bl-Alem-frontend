export interface ReviewItem {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: {
    id?: number;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  course?: {
    id?: number;
    titleAr?: string;
    slug?: string;
    instructor?: {
      id?: number;
      fullName?: string;
      email?: string;
    };
  };
}

export const fmtReviewDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function ratingVariant(rating: number) {
  if (rating >= 4) return 'success' as const;
  if (rating === 3) return 'warning' as const;
  return 'rejected' as const;
}
