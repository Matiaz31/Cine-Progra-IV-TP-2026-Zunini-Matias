import { Seat } from './seat';

describe('Seat model', () => {
  it('should represent a seat with the expected fields', () => {
    const seat: Seat = {
      id: 'seat-1',
      room_id: 'room-1',
      row_label: 'A',
      seat_number: 1,
      seat_type: 'normal',
      price_modifier: 0,
      is_active: true,
    };

    expect(seat.id).toBe('seat-1');
    expect(seat.row_label).toBe('A');
    expect(seat.seat_number).toBe(1);
  });
});
