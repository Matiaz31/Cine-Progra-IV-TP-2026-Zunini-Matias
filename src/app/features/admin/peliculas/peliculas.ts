import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MovieProposalService } from '../../movie-proposal/movie-proposal.service';
import { AdminMovieService } from './admin-movie.service';
import { Movie } from '../../movies/movie';
import { supabase } from '../../../core/supabase';

type MoviePermission = 'view' | 'create' | 'update' | 'delete';

@Component({
  selector: 'app-peliculas',
  imports: [FormsModule],
  templateUrl: './peliculas.html',
  styleUrl: './peliculas.scss',
})
export class Peliculas implements OnInit {
  private movieService = inject(AdminMovieService);
  private changeDetector = inject(ChangeDetectorRef);
  private proposalService = inject(MovieProposalService);

  private propuestaPendienteId: string | null = null;

  private propuestaAplicada = false;

  movies: Movie[] = [];

  loading = true;
  error = '';

  mostrarFormulario = false;
  guardando = false;
  editando = false;
  peliculaEditandoId: string | null = null;

  permisos: Record<MoviePermission, boolean> = {
    view: false,
    create: false,
    update: false,
    delete: false,
  };

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

  nuevaPelicula = {
    title: '',
    synopsis: '',
    duration_minutes: 0,
    poster_url: '',
    release_date: '',
    age_rating: null as number | null,
    pre_sale_enabled: false,
    pre_sale_price: null as number | null,
  };

  async ngOnInit(): Promise<void> {
    await this.cargarPermisos();

    if (!this.puedeConsultar) {
      this.loading = false;
      this.error = 'No tenés permiso para consultar películas.';
      this.changeDetector.detectChanges();
      return;
    }

    const state = history.state as {
      propuesta?: {
        id: string;
        title: string;
        description: string;
      };
    };

    await this.cargarPeliculas();

    if (state.propuesta) {

      if (!this.puedeCrear) {
        this.error =
          'No tenés permiso para crear películas. La propuesta no fue aceptada.';

        this.changeDetector.detectChanges();
        return;
      }

      this.propuestaPendienteId = state.propuesta.id;

      this.editando = false;
      this.peliculaEditandoId = null;
      this.limpiarFormulario();

      this.nuevaPelicula.title = state.propuesta.title;
      this.nuevaPelicula.synopsis = state.propuesta.description;

      this.error = '';
      this.mostrarFormulario = true;

      this.changeDetector.detectChanges();
    }
  }

  private async cargarPermisos(): Promise<void> {
    const acciones: MoviePermission[] = [
      'view',
      'create',
      'update',
      'delete',
    ];

    try {
      const resultados = await Promise.all(
        acciones.map(async action => {
          const { data, error } = await supabase.rpc(
            'has_admin_permission',
            {
              p_section: 'movies',
              p_action: action,
            }
          );

          if (error) {
            console.error(
              `Error verificando permiso movies.${action}:`,
              error
            );

            return [action, false] as const;
          }

          return [action, data === true] as const;
        })
      );

      this.permisos = Object.fromEntries(
        resultados
      ) as Record<MoviePermission, boolean>;

    } catch (error) {
      console.error('ERROR AL CARGAR PERMISOS DE PELÍCULAS:', error);

      this.permisos = {
        view: false,
        create: false,
        update: false,
        delete: false,
      };
    }

    this.changeDetector.detectChanges();
  }

  async cargarPeliculas(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      this.movies = await this.movieService.getMovies();

    } catch (error) {
      console.error('ERROR AL CARGAR PELÍCULAS:', error);

      this.error = 'No se pudieron cargar las películas.';
      this.movies = [];

    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }

  abrirFormulario(): void {
    if (this.guardando || !this.puedeCrear) return;

    this.editando = false;
    this.peliculaEditandoId = null;
    this.limpiarFormulario();

    this.error = '';
    this.mostrarFormulario = true;

    this.changeDetector.detectChanges();
  }

  editarPelicula(movie: Movie): void {
    if (this.guardando || !this.puedeModificar) return;

    this.editando = true;
    this.peliculaEditandoId = movie.id;

    this.nuevaPelicula = {
      title: movie.title,
      synopsis: movie.synopsis ?? '',
      duration_minutes: movie.duration_minutes,
      poster_url: movie.poster_url ?? '',
      release_date: movie.release_date ?? '',
      age_rating: movie.age_rating ?? null,
      pre_sale_enabled: movie.pre_sale_enabled,
      pre_sale_price: movie.pre_sale_price ?? null,
    };

    this.error = '';
    this.mostrarFormulario = true;

    this.changeDetector.detectChanges();
  }

  cerrarFormulario(): void {
    if (this.guardando) return;

    this.mostrarFormulario = false;
    this.editando = false;
    this.peliculaEditandoId = null;

    this.limpiarFormulario();

    this.error = '';

    this.changeDetector.detectChanges();
  }

  private limpiarFormulario(): void {
    this.nuevaPelicula = {
      title: '',
      synopsis: '',
      duration_minutes: 0,
      poster_url: '',
      release_date: '',
      age_rating: null,
      pre_sale_enabled: false,
      pre_sale_price: null,
    };
  }

  async guardarPelicula(): Promise<void> {
    if (this.guardando) return;

    if (this.editando ? !this.puedeModificar : !this.puedeCrear) {
      this.error = this.editando
        ? 'No tenés permiso para modificar películas.'
        : 'No tenés permiso para crear películas.';

      this.changeDetector.detectChanges();
      return;
    }

    this.error = '';

    const titulo = this.nuevaPelicula.title.trim();
    const duracion = Number(this.nuevaPelicula.duration_minutes);
    const precioPreventa = this.nuevaPelicula.pre_sale_price;

    if (!titulo) {
      this.error = 'El título es obligatorio.';
      this.changeDetector.detectChanges();
      return;
    }

    if (!Number.isFinite(duracion) || duracion <= 0) {
      this.error = 'La duración debe ser mayor que cero.';
      this.changeDetector.detectChanges();
      return;
    }

    if (
      this.nuevaPelicula.pre_sale_enabled &&
      (
        precioPreventa === null ||
        !Number.isFinite(Number(precioPreventa)) ||
        Number(precioPreventa) < 0
      )
    ) {
      this.error = 'Ingresá un precio de preventa válido.';
      this.changeDetector.detectChanges();
      return;
    }

    if (this.editando && !this.peliculaEditandoId) {
      this.error = 'No se pudo identificar la película que querés editar.';
      this.changeDetector.detectChanges();
      return;
    }

    this.guardando = true;
    this.changeDetector.detectChanges();

    const datosPelicula = {
      title: titulo,
      synopsis: this.nuevaPelicula.synopsis.trim() || null,
      duration_minutes: duracion,
      poster_url: this.nuevaPelicula.poster_url.trim() || null,
      release_date: this.nuevaPelicula.release_date || null,
      age_rating: this.nuevaPelicula.age_rating,
      pre_sale_enabled: this.nuevaPelicula.pre_sale_enabled,
      pre_sale_price: this.nuevaPelicula.pre_sale_enabled
        ? Number(precioPreventa)
        : null,
    };

    try {
      let pelicula: Movie;

      if (this.editando && this.peliculaEditandoId) {
        pelicula = await this.movieService.updateMovie(
          this.peliculaEditandoId,
          datosPelicula
        );

      } else {
        pelicula = await this.movieService.createMovie(datosPelicula);

        if (this.propuestaPendienteId) {
          try {
            await this.proposalService.reviewProposal(
              this.propuestaPendienteId,
              'accepted'
            );

            this.propuestaPendienteId = null;

          } catch (error) {
            console.error(
              'La película se creó, pero no se pudo actualizar la propuesta:',
              error
            );

            this.error =
              'La película se creó, pero la propuesta sigue pendiente porque no se pudo actualizar su estado. No vuelvas a crearla.';
          }
        }
      }

      this.mostrarFormulario = false;
      this.editando = false;
      this.peliculaEditandoId = null;

      this.limpiarFormulario();

      await this.cargarPeliculas();

    } catch (error: any) {
      console.error('ERROR AL GUARDAR PELÍCULA:', error);

      const mensajeTecnico = error?.message ?? '';

      if (mensajeTecnico.includes('release_date')) {
        this.error = 'La fecha de estreno es obligatoria. Por favor, completá ese campo.';

      } else if (mensajeTecnico.includes('duplicate key')) {
        this.error = 'Ya existe una película con esos datos. Revisá la información ingresada.';

      } else if (mensajeTecnico.includes('row-level security')) {
        this.error = 'No tenés permisos para realizar esta operación.';

      } else if (mensajeTecnico.includes('23502')) {
        this.error = 'Faltan completar algunos datos obligatorios. Revisá el formulario.';

      } else if (mensajeTecnico.includes('23503')) {
        this.error = 'No se puede realizar esta operación porque existen otros registros relacionados.';

      } else {
        this.error = this.editando
          ? 'No se pudieron guardar los cambios. Intentá nuevamente.'
          : 'No se pudo crear la película. Intentá nuevamente.';
      }
    } finally {
      this.guardando = false;
      this.changeDetector.detectChanges();
    }
  }

  async cambiarEstado(movie: Movie): Promise<void> {
    if (!this.puedeModificar) return;

    this.error = '';

    try {
      const pelicula = await this.movieService.updateMovie(
        movie.id,
        { is_active: !movie.is_active }
      );

      if (!pelicula) {
        this.error = 'No se pudo cambiar el estado de la película.';
        return;
      }

      await this.cargarPeliculas();

    } catch (error) {
      console.error('ERROR AL CAMBIAR ESTADO:', error);

      this.error = 'Ocurrió un error al cambiar el estado de la película.';

    } finally {
      this.changeDetector.detectChanges();
    }
  }

  async eliminarPelicula(movie: Movie): Promise<void> {
    if (!this.puedeEliminar) return;

    const confirmar = window.confirm(
      `¿Seguro que querés eliminar definitivamente la película "${movie.title}"?`
    );

    if (!confirmar) return;

    this.error = '';

    try {
      const eliminado = await this.movieService.permanentlyDeleteMovie(
        movie.id
      );

      if (!eliminado) {
        this.error =
          'No se pudo eliminar la película. Puede tener funciones u otros registros asociados.';
        return;
      }

      await this.cargarPeliculas();

    } catch (error) {
      console.error('ERROR AL ELIMINAR PELÍCULA:', error);

      this.error =
        'Ocurrió un error al eliminar la película. Revisá si tiene registros asociados.';

    } finally {
      this.changeDetector.detectChanges();
    }
  }
}