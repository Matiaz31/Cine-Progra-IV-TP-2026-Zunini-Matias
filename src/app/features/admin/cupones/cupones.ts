
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../../core/supabase';

type CouponDiscountType = 'percentage' | 'fixed';

interface Coupon {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_age: number | null;
  first_purchase: boolean;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

interface CouponForm {
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_age: number | null;
  first_purchase: boolean;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

@Component({
  selector: 'app-cupones',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './cupones.html',
  styleUrl: './cupones.scss',
})
export class Cupones {
  private cdr = inject(ChangeDetectorRef);

  cupones: Coupon[] = [];

  cargando = false;
  guardando = false;
  editandoId: string | null = null;

  mensaje = '';
  error = '';

  formulario: CouponForm = this.formularioVacio();

  private formularioVacio(): CouponForm {
    return {
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_age: null,
      first_purchase: false,
      valid_from: '',
      valid_until: '',
      is_active: true,
    };
  }

  async ngOnInit(): Promise<void> {
    await this.cargarCupones();
  }

  async cargarCupones(): Promise<void> {
    this.cargando = true;
    this.error = '';

    const { data, error } = await supabase
      .from('coupons')
      .select(
        'id, code, discount_type, discount_value, min_age, first_purchase, valid_from, valid_until, is_active',
      )
      .order('code', { ascending: true });

    if (error) {
      console.error('Error al cargar cupones:', error);
      this.error = 'No se pudieron cargar los cupones.';
    } else {
      this.cupones = (data ?? []) as Coupon[];
    }

    this.cargando = false;
    this.cdr.detectChanges();
  }

  async guardarCupon(): Promise<void> {
    if (this.guardando) {
      return;
    }

    this.mensaje = '';
    this.error = '';

    const code = this.formulario.code.trim().toUpperCase();
    const value = Number(this.formulario.discount_value);
    const minAge = this.formulario.min_age;

    if (!code) {
      this.error = 'Ingresá un código para el cupón.';
      return;
    }

    if (!Number.isFinite(value) || value < 0) {
      this.error = 'El descuento debe ser un número igual o mayor que cero.';
      return;
    }

    if (
      this.formulario.discount_type === 'percentage' &&
      value > 100
    ) {
      this.error = 'El descuento porcentual no puede superar el 100%.';
      return;
    }

    if (
      minAge !== null &&
      (!Number.isInteger(Number(minAge)) || Number(minAge) < 0)
    ) {
      this.error = 'La edad mínima debe ser un número entero no negativo.';
      return;
    }

    const validFrom = this.formulario.valid_from
      ? new Date(this.formulario.valid_from).toISOString()
      : null;

    const validUntil = this.formulario.valid_until
      ? new Date(this.formulario.valid_until).toISOString()
      : null;

    if (
      validFrom &&
      validUntil &&
      new Date(validUntil) <= new Date(validFrom)
    ) {
      this.error = 'La fecha final debe ser posterior a la fecha inicial.';
      return;
    }

    const values = {
      code,
      discount_type: this.formulario.discount_type,
      discount_value: value,
      min_age: minAge === null ? null : Number(minAge),
      first_purchase: this.formulario.first_purchase,
      valid_from: validFrom,
      valid_until: validUntil,
      is_active: this.formulario.is_active,
    };

    this.guardando = true;

    try {
      const result = this.editandoId
        ? await supabase
            .from('coupons')
            .update(values)
            .eq('id', this.editandoId)
            .select(
              'id, code, discount_type, discount_value, min_age, first_purchase, valid_from, valid_until, is_active',
            )
            .single()
        : await supabase
            .from('coupons')
            .insert(values)
            .select(
              'id, code, discount_type, discount_value, min_age, first_purchase, valid_from, valid_until, is_active',
            )
            .single();

      if (result.error) {
        console.error('Error al guardar cupón:', result.error);

        this.error =
          result.error.code === '23505'
            ? 'Ya existe un cupón con ese código.'
            : 'No se pudo guardar el cupón. Verificá los datos y tus permisos.';
        return;
      }

      if (result.data) {
        const saved = result.data as Coupon;

        this.cupones = this.editandoId
          ? this.cupones.map((coupon) =>
              coupon.id === saved.id ? saved : coupon,
            )
          : [...this.cupones, saved].sort((a, b) =>
              a.code.localeCompare(b.code),
            );

        this.mensaje = this.editandoId
          ? 'Cupón actualizado correctamente.'
          : 'Cupón creado correctamente.';

        this.limpiarFormulario();
      }
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  editarCupon(cupon: Coupon): void {
    this.editandoId = cupon.id;
    this.mensaje = '';
    this.error = '';

    this.formulario = {
      code: cupon.code,
      discount_type: cupon.discount_type,
      discount_value: Number(cupon.discount_value),
      min_age: cupon.min_age,
      first_purchase: cupon.first_purchase,
      valid_from: this.toDatetimeLocal(cupon.valid_from),
      valid_until: this.toDatetimeLocal(cupon.valid_until),
      is_active: cupon.is_active,
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async cambiarEstado(cupon: Coupon): Promise<void> {
    this.mensaje = '';
    this.error = '';

    const nuevoEstado = !cupon.is_active;

    const { data, error } = await supabase
      .from('coupons')
      .update({ is_active: nuevoEstado })
      .eq('id', cupon.id)
      .select(
        'id, code, discount_type, discount_value, min_age, first_purchase, valid_from, valid_until, is_active',
      )
      .single();

    if (error) {
      console.error('Error al cambiar estado del cupón:', error);
      this.error = 'No se pudo cambiar el estado del cupón.';
      this.cdr.detectChanges();
      return;
    }

    if (data) {
      const actualizado = data as Coupon;

      this.cupones = this.cupones.map((item) =>
        item.id === actualizado.id ? actualizado : item,
      );

      this.mensaje = actualizado.is_active
        ? 'Cupón activado correctamente.'
        : 'Cupón desactivado correctamente.';
    }

    this.cdr.detectChanges();
  }

  
    async eliminarCupon(cupon: Coupon): Promise<void> {
        const confirmar = window.confirm(
            `¿Estás seguro de que querés eliminar el cupón "${cupon.code}"?`,
        );

        if (!confirmar) {
            return;
        }

        this.mensaje = '';
        this.error = '';

        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', cupon.id);

        if (error) {
            console.error('Error al eliminar cupón:', error);
            this.error =
            'No se pudo eliminar el cupón. Puede estar asociado a otras operaciones o faltarte permisos.';
            this.cdr.detectChanges();
            return;
        }

        this.cupones = this.cupones.filter(
            (item) => item.id !== cupon.id,
        );

        if (this.editandoId === cupon.id) {
            this.limpiarFormulario();
        }

        this.mensaje = 'Cupón eliminado correctamente.';
        this.cdr.detectChanges();
    }


  limpiarFormulario(): void {
    this.formulario = this.formularioVacio();
    this.editandoId = null;
  }

  private toDatetimeLocal(value: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  get totalActivos(): number {
    return this.cupones.filter((coupon) => coupon.is_active).length;
  }
}
