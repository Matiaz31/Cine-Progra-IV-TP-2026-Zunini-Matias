export interface Movie {
  id: string;
  title: string;
  synopsis: string | null;
  duration_minutes: number;
  poster_url: string | null;
  release_date: string | null;
  age_rating: number | null;
  is_active: boolean;
  pre_sale_enabled: boolean;
  pre_sale_price: number | null;
}