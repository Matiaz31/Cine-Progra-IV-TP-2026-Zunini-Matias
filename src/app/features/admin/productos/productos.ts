
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../../core/supabase';

interface ProductCategory {
  id: string;
  name: string;
}

interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './productos.html',
  styleUrl: './productos.scss',
})
export class Productos implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  categories: ProductCategory[] = [];

  loading = false;
  saving = false;
  changingStatusId: string | null = null;

  error = '';
  success = '';

  mostrarFormulario = false;
  editando = false;
  productoEditandoId: string | null = null;

  nombre = '';
  descripcion = '';
  precio: number | null = null;
  imagenUrl = '';
  stock: number | null = 0;
  categoriaId = '';
  activo = true;

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.loading = true;

    try {
      const [productosResult, categoriasResult] = await Promise.all([
        supabase
          .from('products')
          .select(
            'id, category_id, name, description, price, image_url, stock, is_active, created_at, updated_at',
          )
          .order('name', { ascending: true }),

        supabase
          .from('product_categories')
          .select('id, name')
          .order('name', { ascending: true }),
      ]);

      if (productosResult.error) {
        throw productosResult.error;
      }

      if (categoriasResult.error) {
        throw categoriasResult.error;
      }

      this.products = (productosResult.data ?? []).map((product) => ({
        ...product,
        price: Number(product.price),
        stock: Number(product.stock),
        is_active: Boolean(product.is_active),
      })) as Product[];

      this.categories = (categoriasResult.data ?? []) as ProductCategory[];
    } catch (error) {
      console.error('Error al cargar productos y categorías:', error);
      this.error = 'No se pudieron cargar los productos o las categorías.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  abrirFormulario(): void {
    this.limpiarFormulario();
    this.error = '';
    this.success = '';
    this.mostrarFormulario = true;
  }

  editarProducto(product: Product): void {
    this.editando = true;
    this.productoEditandoId = product.id;

    this.nombre = product.name;
    this.descripcion = product.description ?? '';
    this.precio = Number(product.price);
    this.imagenUrl = product.image_url ?? '';
    this.stock = Number(product.stock);
    this.categoriaId = product.category_id ?? '';
    this.activo = product.is_active;

    this.error = '';
    this.success = '';
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    if (this.saving) {
      return;
    }

    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.error = '';
  }

  private limpiarFormulario(): void {
    this.editando = false;
    this.productoEditandoId = null;

    this.nombre = '';
    this.descripcion = '';
    this.precio = null;
    this.imagenUrl = '';
    this.stock = 0;
    this.categoriaId = '';
    this.activo = true;
  }

  nombreCategoria(categoryId: string | null): string {
    if (!categoryId) {
      return 'Sin categoría';
    }

    return (
      this.categories.find((category) => category.id === categoryId)?.name ??
      'Categoría no encontrada'
    );
  }

  async guardarProducto(): Promise<void> {
    if (this.saving) {
      return;
    }

    this.error = '';
    this.success = '';

    const nombreLimpio = this.nombre.trim();
    const descripcionLimpia = this.descripcion.trim();
    const imagenLimpia = this.imagenUrl.trim();

    const precioNumero = Number(this.precio);
    const stockNumero = Number(this.stock);

    if (!nombreLimpio) {
      this.error = 'El nombre del producto es obligatorio.';
      return;
    }

    if (
      this.precio === null ||
      !Number.isFinite(precioNumero) ||
      precioNumero < 0
    ) {
      this.error = 'Ingresá un precio válido, mayor o igual a cero.';
      return;
    }

    if (
      this.stock === null ||
      !Number.isInteger(stockNumero) ||
      stockNumero < 0
    ) {
      this.error = 'El stock debe ser un entero mayor o igual a cero.';
      return;
    }

    if (imagenLimpia && !/^https?:\/\/\S+$/i.test(imagenLimpia)) {
      this.error = 'La URL debe comenzar con http:// o https://.';
      return;
    }

    const duplicado = this.products.some(
      (product) =>
        product.name.trim().toLocaleLowerCase() ===
          nombreLimpio.toLocaleLowerCase() &&
        product.id !== this.productoEditandoId,
    );

    if (duplicado) {
      this.error = 'Ya existe un producto con ese nombre.';
      return;
    }

    const datos = {
      name: nombreLimpio,
      description: descripcionLimpia || null,
      price: precioNumero,
      image_url: imagenLimpia || null,
      stock: stockNumero,
      category_id: this.categoriaId || null,
      is_active: this.activo,
      updated_at: new Date().toISOString(),
    };

    this.saving = true;
    this.cdr.detectChanges();

    try {
      if (this.editando && this.productoEditandoId) {
        const { data, error } = await supabase
          .from('products')
          .update(datos)
          .eq('id', this.productoEditandoId)
          .select(
            'id, category_id, name, description, price, image_url, stock, is_active, created_at, updated_at',
          )
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            'No se actualizó ninguna fila. Revisá las políticas RLS de products.',
          );
        }

        this.success = 'Producto actualizado correctamente.';
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(datos)
          .select(
            'id, category_id, name, description, price, image_url, stock, is_active, created_at, updated_at',
          )
          .single();

        if (error) {
          throw error;
        }

        this.success = 'Producto creado correctamente.';
      }

      this.mostrarFormulario = false;
      this.limpiarFormulario();

      await this.cargarDatos();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      this.error =
        error instanceof Error
          ? `No se pudo guardar: ${error.message}`
          : 'No se pudo guardar el producto. Revisá los permisos de Supabase.';
      this.success = '';
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  async cambiarEstado(product: Product): Promise<void> {
    if (this.saving || this.changingStatusId) {
      return;
    }

    const nuevoEstado = !product.is_active;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    const confirmar = window.confirm(
      `¿Querés ${accion} el producto "${product.name}"?`,
    );

    if (!confirmar) {
      return;
    }

    this.error = '';
    this.success = '';
    this.changingStatusId = product.id;

    // Actualización optimista: la tabla responde inmediatamente.
    const estadoAnterior = product.is_active;
    product.is_active = nuevoEstado;
    this.cdr.detectChanges();

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          is_active: nuevoEstado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .select('id, is_active')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          'No se actualizó ninguna fila. Revisá las políticas RLS de products.',
        );
      }

      product.is_active = Boolean(data.is_active);
      this.success = product.is_active
        ? 'Producto activado correctamente.'
        : 'Producto desactivado correctamente.';
    } catch (error) {
      // Si falla Supabase, restauramos el estado visual anterior.
      product.is_active = estadoAnterior;

      console.error('Error al cambiar el estado:', error);
      this.error =
        error instanceof Error
          ? `No se pudo cambiar el estado: ${error.message}`
          : 'No se pudo cambiar el estado del producto.';
    } finally {
      this.changingStatusId = null;
      this.cdr.detectChanges();
    }
  }
}
