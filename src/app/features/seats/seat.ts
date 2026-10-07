export interface Seat {
  id: string;
  room_id: string;
  row_label: string;
  seat_number: number;
  seat_type: string;
  price_modifier: number;
  is_active: boolean;
}