
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { supabase } from '../../../core/supabase';

interface Reward {
  id: string;
  name: string;
  type: string;
  product_id: string | null;
  points_cost: number;
  is_active: boolean;
  created_at: string;
  seat_type: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

@Component({
  selector: 'app-recompensas',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './recompensas.html',
  styleUrl: './recompensas.scss',
})
export class Recompensas implements OnInit {
  private supabase = supabase;
  private cdr = inject(ChangeDetectorRef);

  productos: Product[] = [];
  recompensas: Reward[] = [];

  cargandoProductos = false;
  cargando = false;
  creando = false;

  error = '';
  errorProductos = '';
  mensaje = '';

  nuevaRecompensa = {
    name: '',
    type: 'product',
    product_id: null as string | null,
    seat_type: 'normal',
    points_cost: 0,
    is_active: true,
    };

    async ngOnInit(): Promise<void> {
        await Promise.all([
            this.cargarRecompensas(),
            this.cargarProductos(),
        ]);
    }
  
    esTicket(recompensa: Reward): boolean {
        return recompensa.type.trim().toLowerCase() === 'ticket';
    }

    nombreProducto(productId: string | null): string {
        if (!productId) return 'Sin producto asociado';

        return (
            this.productos.find((producto) => producto.id === productId)?.name ??
            'Producto no encontrado'
        );
    }

    async cargarRecompensas(): Promise<void> {
        this.cargando = true;
        this.error = '';

        try {
        const { data, error } = await this.supabase
            .from('rewards')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        this.recompensas = (data ?? []) as Reward[];
        } catch (err: any) {
        console.error('Error al cargar recompensas:', err);
        this.error =
            'No se pudieron cargar las recompensas: ' +
            (err?.message ?? 'Error desconocido');
        } finally {
            this.cargando = false;
            this.cdr.detectChanges();
        }
    }

    async crearRecompensa(): Promise<void> {
        if (this.creando) return;

        this.error = '';
        this.mensaje = '';

        const name = this.nuevaRecompensa.name.trim();
        const type = this.nuevaRecompensa.type;
        const pointsCost = Number(this.nuevaRecompensa.points_cost);
        const productId = this.nuevaRecompensa.product_id;

        if (
            !name ||
            !['product', 'ticket'].includes(type) ||
            !Number.isInteger(pointsCost) ||
            pointsCost <= 0 ||
            (type === 'product' && !productId) ||
            (type === 'ticket' && this.nuevaRecompensa.seat_type !== 'normal')
        ) {
            this.error = 'Completá los datos del canje y elegí un costo válido en puntos.';
            return;
        }

        this.creando = true;
        this.cdr.detectChanges();

        try {
        const { error } = await this.supabase
            .from('rewards')
            .insert({
            name,
            type: type === 'ticket' ? 'ticket' : 'Producto',
            product_id: type === 'product' ? productId : null,
            seat_type: type === 'ticket' ? 'normal' : null,
            points_cost: pointsCost,
            is_active: this.nuevaRecompensa.is_active,
            });

        if (error) {
            throw error;
        }

        this.nuevaRecompensa = {
            name: '',
            type: 'product',
            product_id: null,
            seat_type: 'normal',
            points_cost: 0,
            is_active: true,
        };

        await this.cargarRecompensas();

        if (!this.error) {
            this.mensaje = 'Recompensa creada correctamente.';
        }
        } catch (err: any) {
        console.error('Error al crear recompensa:', err);
        this.error =
            'No se pudo crear la recompensa: ' +
            (err?.message ?? 'Error desconocido');
        } finally {
            this.creando = false;
            this.cdr.detectChanges();
        }
    }

    async cambiarEstado(recompensa: Reward): Promise<void> {
        this.error = '';
        this.mensaje = '';

        try {
        const { error } = await this.supabase
            .from('rewards')
            .update({ is_active: !recompensa.is_active })
            .eq('id', recompensa.id);

        if (error) {
            throw error;
        }

        await this.cargarRecompensas();

        if (!this.error) {
            this.mensaje = 'Estado de la recompensa actualizado.';
        }
        } catch (err: any) {
        console.error('Error al cambiar estado:', err);
        this.error =
            'No se pudo actualizar la recompensa: ' +
            (err?.message ?? 'Error desconocido');
        }
    }

    async cargarProductos(): Promise<void> {
        this.cargandoProductos = true;
        this.errorProductos = '';

        try {
        const { data, error } = await this.supabase
            .from('products')
            .select('id, name, price, stock')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) {
            throw error;
        }

        this.productos = (data ?? []) as Product[];
        } catch (err: any) {
        console.error('Error al cargar productos:', err);
        this.errorProductos =
            'No se pudieron cargar los productos: ' +
            (err?.message ?? 'Error desconocido');
        } finally {
        this.cargandoProductos = false;
        this.cdr.detectChanges();
        }
    }
}
