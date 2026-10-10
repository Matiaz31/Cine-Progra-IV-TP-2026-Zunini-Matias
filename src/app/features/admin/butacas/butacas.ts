import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../../core/supabase';

type SeatType = 'normal' | 'accessible' | 'vip';

interface Room {
  id: string;
  name: string;
  is_active: boolean;
}

interface Seat {
  id: string;
  room_id: string;
  row_label: string;
  seat_number: number;
  seat_type: SeatType;
  price_modifier: number;
  is_active: boolean;
}

interface SeatRow {
  label: string;
  seats: Seat[];
}

@Component({
  selector: 'app-butacas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './butacas.html',
  styleUrl: './butacas.scss',
})
export class Butacas implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  rooms: Room[] = [];
  seats: Seat[] = [];

  selectedRoomId = '';

  loading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  showForm = false;
  editingSeatId: string | null = null;

  form = {
    row_label: '',
    seat_number: 1,
    seat_type: 'normal' as SeatType,
    price_modifier: 0,
    is_active: true,
  };

  ngOnInit(): void {
    void this.loadRooms();
  }

  async loadRooms(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, is_active')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      this.rooms = (data ?? []) as Room[];

      if (
        this.selectedRoomId &&
        !this.rooms.some((room) => room.id === this.selectedRoomId)
      ) {
        this.selectedRoomId = '';
      }

      if (!this.selectedRoomId && this.rooms.length > 0) {
        this.selectedRoomId = this.rooms[0].id;
      }

      if (this.selectedRoomId) {
        await this.loadSeats();
      } else {
        this.seats = [];
      }
    } catch (error) {
      console.error('Error al cargar las salas:', error);
      this.errorMessage = 'No se pudieron cargar las salas.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async onRoomChange(): Promise<void> {
    this.closeForm();
    this.successMessage = '';
    this.errorMessage = '';

    await this.loadSeats();
  }

  async loadSeats(): Promise<void> {
    if (!this.selectedRoomId) {
      this.seats = [];
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const { data, error } = await supabase
        .from('seats')
        .select(
          'id, room_id, row_label, seat_number, seat_type, price_modifier, is_active',
        )
        .eq('room_id', this.selectedRoomId)
        .order('row_label', { ascending: true })
        .order('seat_number', { ascending: true });

      if (error) {
        throw error;
      }

      this.seats = (data ?? []) as Seat[];
    } catch (error) {
      console.error('Error al cargar las butacas:', error);
      this.errorMessage = 'No se pudieron cargar las butacas de la sala.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  get seatRows(): SeatRow[] {
    const rows = new Map<string, Seat[]>();

    for (const seat of this.seats) {
      if (!rows.has(seat.row_label)) {
        rows.set(seat.row_label, []);
      }

      rows.get(seat.row_label)!.push(seat);
    }

    return Array.from(rows.entries())
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([label, seats]) => ({
        label,
        seats: [...seats].sort((a, b) => a.seat_number - b.seat_number),
      }));
  }

  openCreateForm(): void {
    if (!this.selectedRoomId) {
      this.errorMessage = 'Primero seleccioná una sala.';
      return;
    }

    this.resetForm();
    this.editingSeatId = null;
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openEditForm(seat: Seat): void {
    this.editingSeatId = seat.id;
    console.log('Butaca seleccionada:', seat);
    console.log('Modificador recibido:', seat.price_modifier);

    this.form = {
      row_label: seat.row_label,
      seat_number: seat.seat_number,
      seat_type: seat.seat_type,
      price_modifier: Number(seat.price_modifier),
      is_active: seat.is_active,
    };

    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeForm(): void {
    this.showForm = false;
    this.editingSeatId = null;
    this.resetForm();
  }

  resetForm(): void {
    this.form = {
      row_label: '',
      seat_number: 1,
      seat_type: 'normal',
      price_modifier: 0,
      is_active: true,
    };
  }

  async saveSeat(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    const rowLabel = this.form.row_label.trim().toUpperCase();
    const seatNumber = Number(this.form.seat_number);
    const priceModifier = Number(this.form.price_modifier);

    if (!this.selectedRoomId) {
      this.errorMessage = 'Seleccioná una sala.';
      return;
    }

    if (!rowLabel) {
      this.errorMessage = 'Ingresá la fila de la butaca.';
      return;
    }

    if (!Number.isInteger(seatNumber) || seatNumber < 1) {
      this.errorMessage =
        'El número de butaca debe ser un entero mayor que cero.';
      return;
    }

    if (!Number.isFinite(priceModifier) || priceModifier < 0) {
      this.errorMessage = 'El modificador de precio no puede ser negativo.';
      return;
    }

    this.saving = true;

    const seatData = {
      room_id: this.selectedRoomId,
      row_label: rowLabel,
      seat_number: seatNumber,
      seat_type: this.form.seat_type,
      price_modifier: priceModifier,
      is_active: this.form.is_active,
    };

    try {
      if (this.editingSeatId) {
        const { error } = await supabase
          .from('seats')
          .update(seatData)
          .eq('id', this.editingSeatId);

        if (error) {
          throw error;
        }

        this.successMessage = 'Butaca actualizada correctamente.';
      } else {
        const { error } = await supabase
          .from('seats')
          .insert(seatData);

        if (error) {
          throw error;
        }

        this.successMessage = 'Butaca creada correctamente.';
      }

      this.closeForm();
      await this.loadSeats();
    } catch (error) {
      console.error('Error al guardar la butaca:', error);
      this.errorMessage =
        'No se pudo guardar la butaca. Verificá que no exista otra con la misma fila y número en esa sala.';
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  async deleteSeat(): Promise<void> {
    if (!this.editingSeatId || this.saving) {
      return;
    }

    const confirmed = confirm(
      '¿Seguro que querés eliminar esta butaca? Si tiene entradas asociadas, Supabase podría impedirlo.',
    );

    if (!confirmed) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const { error } = await supabase
        .from('seats')
        .delete()
        .eq('id', this.editingSeatId);

      if (error) {
        throw error;
      }

      this.closeForm();
      this.successMessage = 'Butaca eliminada correctamente.';
      await this.loadSeats();
    } catch (error) {
      console.error('Error al eliminar la butaca:', error);
      this.errorMessage =
        'No se pudo eliminar la butaca. Puede tener entradas asociadas; cerrá el formulario y desactivala en su lugar.';
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  async toggleSeatStatus(seat: Seat): Promise<void> {
    if (this.saving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.saving = true;

    try {
      const { error } = await supabase
        .from('seats')
        .update({ is_active: !seat.is_active })
        .eq('id', seat.id);

      if (error) {
        throw error;
      }

      this.successMessage = seat.is_active
        ? 'Butaca desactivada correctamente.'
        : 'Butaca activada correctamente.';

      await this.loadSeats();
    } catch (error) {
      console.error('Error al cambiar el estado de la butaca:', error);
      this.errorMessage = 'No se pudo cambiar el estado de la butaca.';
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  get activeSeatsCount(): number {
    return this.seats.filter((seat) => seat.is_active).length;
  }

  get inactiveSeatsCount(): number {
    return this.seats.filter((seat) => !seat.is_active).length;
  }

  get normalSeatsCount(): number {
    return this.seats.filter((seat) => seat.seat_type === 'normal').length;
  }

  get accessibleSeatsCount(): number {
    return this.seats.filter((seat) => seat.seat_type === 'accessible').length;
  }

  get vipSeatsCount(): number {
    return this.seats.filter((seat) => seat.seat_type === 'vip').length;
  }

  get selectedRoomName(): string {
    return (
      this.rooms.find((room) => room.id === this.selectedRoomId)?.name ?? ''
    );
  }
}