import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../../core/supabase';
import { DatePipe } from '@angular/common';
import { AdminPermissionSet, AdminPermissionsService } from '../../../core/admin-permissions.service';

interface ProductCategory {
  id: string;
  name: string;
  created_at: string;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss',
})
export class Categorias implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private permissionsService = inject(AdminPermissionsService);
  permisos: AdminPermissionSet = { view: false, create: false, update: false, delete: false };
  get puedeCrear(): boolean { return this.permisos.create; }
  get puedeModificar(): boolean { return this.permisos.update; }
  get puedeEliminar(): boolean { return this.permisos.delete; }

  categories: ProductCategory[] = [];

  loading = false;
  saving = false;
  error = '';
  success = '';

  mostrarFormulario = false;
  editando = false;
  categoriaEditandoId: string | null = null;
  nombreCategoria = '';

  async ngOnInit(): Promise<void> {
    this.permisos = await this.permissionsService.obtenerPermisos('product_categories');
    if (!this.permisos.view) { this.error = 'No tenés permisos para consultar las categorías.'; return; }
    await this.cargarCategorias();
  }

  async cargarCategorias(): Promise<void> {
    if (!this.permisos.view) return;
    this.loading = true;
    this.error = '';

    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name, created_at')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      this.categories = data ?? [];
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      this.error = 'No se pudieron cargar las categorías.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  abrirFormulario(): void {
    if (!this.puedeCrear) return;
    this.editando = false;
    this.categoriaEditandoId = null;
    this.nombreCategoria = '';
    this.error = '';
    this.success = '';
    this.mostrarFormulario = true;
  }

  editarCategoria(category: ProductCategory): void {
    if (!this.puedeModificar) return;
    this.editando = true;
    this.categoriaEditandoId = category.id;
    this.nombreCategoria = category.name;
    this.error = '';
    this.success = '';
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    if (this.saving) {
      return;
    }

    this.mostrarFormulario = false;
    this.editando = false;
    this.categoriaEditandoId = null;
    this.nombreCategoria = '';
    this.error = '';
  }

  async guardarCategoria(): Promise<void> {
    if (this.saving) {
      return;
    }

    if (this.editando ? !this.puedeModificar : !this.puedeCrear) { this.error = 'No tenés permisos para realizar esta operación.'; return; }
    const nombre = this.nombreCategoria.trim();

    this.error = '';
    this.success = '';

    if (!nombre) {
      this.error = 'El nombre de la categoría es obligatorio.';
      return;
    }

    const duplicada = this.categories.some(
      (category) =>
        category.name.trim().toLocaleLowerCase() ===
          nombre.toLocaleLowerCase() &&
        category.id !== this.categoriaEditandoId,
    );

    if (duplicada) {
      this.error = 'Ya existe una categoría con ese nombre.';
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

    try {
      if (this.editando && this.categoriaEditandoId) {
        const { error } = await supabase
          .from('product_categories')
          .update({ name: nombre })
          .eq('id', this.categoriaEditandoId);

        if (error) {
          throw error;
        }

        this.success = 'Categoría actualizada correctamente.';
      } else {
        const { error } = await supabase
          .from('product_categories')
          .insert({ name: nombre });

        if (error) {
          throw error;
        }

        this.success = 'Categoría creada correctamente.';
      }

      this.mostrarFormulario = false;
      this.editando = false;
      this.categoriaEditandoId = null;
      this.nombreCategoria = '';

      await this.cargarCategorias();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      this.error =
        'No se pudo guardar la categoría. Revisá los permisos de Supabase.';
      this.success = '';
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  async eliminarCategoria(category: ProductCategory): Promise<void> {
    if (!this.puedeEliminar) { this.error = 'No tenés permisos para eliminar categorías.'; return; }
    const confirmar = window.confirm(
      `¿Querés eliminar la categoría "${category.name}"?`,
    );

    if (!confirmar) {
      return;
    }

    this.error = '';
    this.success = '';

    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', category.id);

      if (error) {
        throw error;
      }

      this.success = 'Categoría eliminada correctamente.';
      await this.cargarCategorias();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      this.error =
        'No se pudo eliminar. Puede haber productos asociados a esta categoría.';
      this.success = '';
    } finally {
      this.cdr.detectChanges();
    }
  }
}