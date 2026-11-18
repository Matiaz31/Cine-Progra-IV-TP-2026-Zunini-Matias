import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminGenreService, Genre } from './admin-genre.service';
import {
  AdminPermissionSet,
  AdminPermissionsService,
} from '../../../core/admin-permissions.service';

@Component({
  selector: 'app-generos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './generos.html',
  styleUrl: './generos.scss',
})
export class Generos implements OnInit {
  private genreService = inject(AdminGenreService);
  private permissionsService = inject(AdminPermissionsService);
  private cdr = inject(ChangeDetectorRef);

  genres: Genre[] = [];
  permisos: AdminPermissionSet = {
    view: false,
    create: false,
    update: false,
    delete: false,
  };

  loading = false;
  saving = false;

  error = '';
  success = '';

  mostrarFormulario = false;
  editando = false;
  generoEditandoId: string | null = null;
  nombreGenero = '';

  get puedeConsultar(): boolean {
    return this.permisos.view;
  }

  get puedeCrear(): boolean {
    return this.permisos.create;
  }

  get puedeModificar(): boolean {
    return this.permisos.update;
  }

  get puedeEliminar(): boolean {
    return this.permisos.delete;
  }

  async ngOnInit(): Promise<void> {
    this.permisos = await this.permissionsService.obtenerPermisos('genres');

    if (!this.puedeConsultar) {
      this.error = 'No tenés permisos para consultar los géneros.';
      this.cdr.detectChanges();
      return;
    }

    await this.cargarGeneros();
  }

  async cargarGeneros(): Promise<void> {
    if (!this.puedeConsultar) {
      this.error = 'No tenés permisos para consultar los géneros.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      this.genres = await this.genreService.getGenres();
    } catch (error) {
      console.error('Error al cargar los géneros:', error);
      this.error = 'No se pudieron cargar los géneros.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  abrirFormulario(): void {
    if (!this.puedeCrear || this.saving) return;

    this.editando = false;
    this.generoEditandoId = null;
    this.nombreGenero = '';
    this.error = '';
    this.success = '';
    this.mostrarFormulario = true;
  }

  editarGenero(genre: Genre): void {
    if (!this.puedeModificar || this.saving) return;

    this.editando = true;
    this.generoEditandoId = genre.id;
    this.nombreGenero = genre.name;
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
    this.generoEditandoId = null;
    this.nombreGenero = '';
    this.error = '';
    this.success = '';
  }

  async guardarGenero(): Promise<void> {
    if (this.saving) return;

    const permitido = this.editando ? this.puedeModificar : this.puedeCrear;
    if (!permitido) {
      this.error = this.editando
        ? 'No tenés permisos para modificar géneros.'
        : 'No tenés permisos para crear géneros.';
      return;
    }

    const nombre = this.nombreGenero.trim();

    this.error = '';
    this.success = '';

    if (!nombre) {
      this.error = 'El nombre del género es obligatorio.';
      return;
    }

    const duplicado = this.genres.some(
      (genre) =>
        genre.name.trim().toLocaleLowerCase() ===
          nombre.toLocaleLowerCase() &&
        genre.id !== this.generoEditandoId
    );

    if (duplicado) {
      this.error = 'Ya existe un género con ese nombre.';
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

    try {
      if (this.editando && this.generoEditandoId) {
        await this.genreService.updateGenre(
          this.generoEditandoId,
          nombre
        );
      } else {
        await this.genreService.createGenre(nombre);
      }

      this.mostrarFormulario = false;
      this.editando = false;
      this.generoEditandoId = null;
      this.nombreGenero = '';

      this.success = 'Género guardado correctamente.';
      await this.cargarGeneros();
    } catch (error) {
      console.error('GÉNEROS: error al guardar', error);
      this.error = 'No se pudo guardar el género. Verificá tus permisos.';
      this.success = '';
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  async eliminarGenero(genre: Genre): Promise<void> {
    if (!this.puedeEliminar || this.saving) {
      this.error = 'No tenés permisos para eliminar géneros.';
      return;
    }

    const confirmar = window.confirm(
      `¿Querés eliminar el género "${genre.name}"?`
    );

    if (!confirmar) return;

    this.error = '';
    this.success = '';

    try {
      await this.genreService.deleteGenre(genre.id);
      this.success = 'Género eliminado correctamente.';
      await this.cargarGeneros();
    } catch (error) {
      console.error('Error al eliminar el género:', error);
      this.error =
        'No se pudo eliminar el género. Puede estar asociado a películas.';
    } finally {
      this.cdr.detectChanges();
    }
  }
}
