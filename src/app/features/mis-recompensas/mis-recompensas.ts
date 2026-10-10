
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { supabase } from '../../core/supabase';

interface Reward {
  id: string;
  name: string;
  type: string;
  product_id: string | null;
  points_cost: number;
  is_active: boolean;
  product_name: string | null;
}

interface PointTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

@Component({
  selector: 'app-mis-recompensas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-recompensas.html',
  styleUrl: './mis-recompensas.scss',
})
export class MisRecompensas implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  cargando = true;
  error = '';
  usuarioId = '';

  puntosDisponibles = 0;
  recompensas: Reward[] = [];
  movimientos: PointTransaction[] = [];

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.error = '';

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error('Iniciá sesión para consultar tus recompensas.');
      }

      this.usuarioId = user.id;

      const [rewardsResult, transactionsResult] =
        await Promise.all([
          supabase
            .from('rewards')
            .select(
              'id, name, type, product_id, points_cost, is_active, products(name)'
            )
            .eq('is_active', true)
            .order('points_cost', { ascending: true }),

          // Traemos todos los movimientos para calcular
          // el saldo completo, no solamente los últimos 50.
          supabase
            .from('points_transactions')
            .select('id, type, amount, description, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        ]);

      if (rewardsResult.error) throw rewardsResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      this.recompensas = (rewardsResult.data ?? []).map(
        (item: any) => {
          const producto = Array.isArray(item.products)
            ? item.products[0]
            : item.products;

          return {
            id: item.id,
            name: item.name,
            type: item.type,
            product_id: item.product_id,
            points_cost: Number(item.points_cost),
            is_active: item.is_active,
            product_name: producto?.name ?? null,
          };
        }
      );

      const todosLosMovimientos =
        (transactionsResult.data ?? []) as PointTransaction[];

      this.puntosDisponibles = todosLosMovimientos.reduce(
        (saldo, movimiento) => {
          const cantidad = Number(movimiento.amount) || 0;

          if (movimiento.type === 'earned') {
            return saldo + Math.abs(cantidad);
          }

          if (movimiento.type === 'redeemed') {
            return saldo - Math.abs(cantidad);
          }

          if (movimiento.type === 'adjustment') {
            return saldo + cantidad;
          }

          return saldo;
        },
        0
      );

      this.movimientos = todosLosMovimientos.slice(0, 50);
    } catch (error: any) {
      console.error('Error cargando recompensas:', error);
      this.error =
        error?.message ??
        'No se pudieron cargar tus puntos y recompensas.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  puntosMovimiento(movimiento: PointTransaction): number {
    const cantidad = Number(movimiento.amount) || 0;

    if (movimiento.type === 'earned') {
      return Math.abs(cantidad);
    }

    if (movimiento.type === 'redeemed') {
      return -Math.abs(cantidad);
    }

    return cantidad;
  }

  etiquetaMovimiento(tipo: string): string {
    switch (tipo) {
      case 'earned':
        return 'Puntos ganados';
      case 'redeemed':
        return 'Canje';
      case 'adjustment':
        return 'Ajuste';
      default:
        return tipo;
    }
  }

  formatDate(fecha: string): string {
    return new Date(fecha).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }
}
