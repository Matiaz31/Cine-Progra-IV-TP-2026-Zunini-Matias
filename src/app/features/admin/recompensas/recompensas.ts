import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../../core/supabase';
import { DecimalPipe } from '@angular/common';

interface Reward {
  id: string;
  name: string;
  type: string;
  product_id: string | null;
  points_cost: number;
  is_active: boolean;
  created_at: string;
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
    cargandoProductos = false;

    recompensas: Reward[] = [];
    cargando = false;
    error = '';
    mensaje = '';

    nuevaRecompensa = {
        name: '',
        type: '',
        product_id: null as string | null,
        points_cost: 0,
        is_active: true,
    };

    async ngOnInit(): Promise<void> {
        await Promise.all([
            this.cargarRecompensas(),
            this.cargarProductos(),
        ]);
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
            this.error = 'No se pudieron cargar las recompensas: ' + error.message;
            return;
            }

            this.recompensas = (data ?? []) as Reward[];
            console.log('RECOMPENSAS CARGADAS:', this.recompensas.length);
        } catch (err) {
            console.error('Error al cargar recompensas:', err);
            this.error = 'Ocurrió un error al consultar las recompensas.';
        } finally {
            this.cargando = false;
            this.cdr.detectChanges();
        }
    }

    async crearRecompensa(): Promise<void> {
        this.error = '';
        this.mensaje = '';

        const name = this.nuevaRecompensa.name.trim();
        const type = this.nuevaRecompensa.type.trim();
        const pointsCost = Number(this.nuevaRecompensa.points_cost);

        if (!name || !type || !Number.isInteger(pointsCost) || pointsCost <= 0) {
            this.error = 'Completá el nombre, el tipo y un costo en puntos mayor que cero.';
            return;
        }

        const { error } = await this.supabase.from('rewards').insert({
            name,
            type,
            product_id: this.nuevaRecompensa.product_id || null,
            points_cost: pointsCost,
            is_active: this.nuevaRecompensa.is_active,
        });

        if (error) {
            this.error = 'No se pudo crear la recompensa: ' + error.message;
            return;
        }

        this.mensaje = 'Recompensa creada correctamente.';
        this.nuevaRecompensa = {
            name: '',
            type: '',
            product_id: null,
            points_cost: 0,
            is_active: true,
        };

        await this.cargarRecompensas();
    }

  async cambiarEstado(recompensa: Reward): Promise<void> {
    this.error = '';
    this.mensaje = '';

    const { error } = await this.supabase
      .from('rewards')
      .update({ is_active: !recompensa.is_active })
      .eq('id', recompensa.id);

    if (error) {
      this.error = 'No se pudo actualizar la recompensa: ' + error.message;
      return;
    }

    this.mensaje = 'Estado de la recompensa actualizado.';
    await this.cargarRecompensas();
  }
  
  async cargarProductos(): Promise<void> {
    this.cargandoProductos = true;

    try {
        const { data, error } = await this.supabase
        .from('products')
        .select('id, name, price, stock')
        .eq('is_active', true)
        .order('name', { ascending: true });

        if (error) {
        this.error = 'No se pudieron cargar los productos: ' + error.message;
        return;
        }

        this.productos = (data ?? []) as Product[];
    } catch (err) {
        console.error('Error al cargar productos:', err);
        this.error = 'Ocurrió un error al consultar los productos.';
    } finally {
        this.cargandoProductos = false;
        this.cdr.detectChanges();
    }
    }

}
