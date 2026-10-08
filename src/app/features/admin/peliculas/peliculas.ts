import {
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { AdminMovieService } from './admin-movie.service';
import { Movie } from '../../movies/movie';

@Component({
  selector: 'app-peliculas',
  imports: [FormsModule],
  templateUrl: './peliculas.html',
  styleUrl: './peliculas.scss',
})
export class Peliculas {

  private movieService = inject(AdminMovieService);
  private changeDetector = inject(ChangeDetectorRef);

  movies: Movie[] = [];

  loading = true;
  error = '';

  mostrarFormulario = false;
  guardando = false;

  editando = false;
  peliculaEditandoId: string | null = null;

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

  async ngOnInit() {
    await this.cargarPeliculas();
  }

  async cargarPeliculas() {

    this.loading = true;
    this.error = '';

    try {

      const movies =
        await this.movieService.getMovies();

      this.movies = movies;

    } catch (error) {

      console.error(
        'ERROR EN COMPONENTE PELÍCULAS:',
        error
      );

      this.error =
        'No se pudieron cargar las películas.';

      this.movies = [];

    } finally {

      this.loading = false;

      this.changeDetector.detectChanges();
    }
  }

  /* =========================
     ABRIR NUEVA PELÍCULA
     ========================= */

  abrirFormulario() {

    this.editando = false;
    this.peliculaEditandoId = null;

    this.limpiarFormulario();

    this.error = '';
    this.mostrarFormulario = true;

    this.changeDetector.detectChanges();
  }

  /* =========================
     EDITAR PELÍCULA
     ========================= */

  editarPelicula(movie: Movie) {

    this.editando = true;
    this.peliculaEditandoId = movie.id;

    this.nuevaPelicula = {
      title: movie.title,
      synopsis: movie.synopsis ?? '',
      duration_minutes:
        movie.duration_minutes,
      poster_url:
        movie.poster_url ?? '',
      release_date:
        movie.release_date ?? '',
      age_rating:
        movie.age_rating ?? null,
      pre_sale_enabled:
        movie.pre_sale_enabled,
      pre_sale_price:
        movie.pre_sale_price ?? null,
    };

    this.error = '';
    this.mostrarFormulario = true;

    this.changeDetector.detectChanges();
  }

  /* =========================
     CERRAR FORMULARIO
     ========================= */

  cerrarFormulario() {

    this.mostrarFormulario = false;
    this.editando = false;
    this.peliculaEditandoId = null;
    this.guardando = false;

    this.limpiarFormulario();

    this.error = '';

    this.changeDetector.detectChanges();
  }

  /* =========================
     LIMPIAR FORMULARIO
     ========================= */

  private limpiarFormulario() {

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

  /* =========================
     GUARDAR
     ========================= */

  async guardarPelicula() {

    if (this.guardando) {
      return;
    }

    this.error = '';

    if (
      !this.nuevaPelicula.title.trim() ||
      this.nuevaPelicula.duration_minutes <= 0
    ) {

      this.error =
        'El título y la duración son obligatorios.';

      this.changeDetector.detectChanges();

      return;
    }

    this.guardando = true;

    try {

      /* =========================
         EDITAR
         ========================= */

      if (
        this.editando &&
        this.peliculaEditandoId
      ) {

        const pelicula =
          await this.movieService.updateMovie(
            this.peliculaEditandoId,
            {
              title:
                this.nuevaPelicula.title.trim(),

              synopsis:
                this.nuevaPelicula.synopsis.trim()
                  || null,

              duration_minutes:
                this.nuevaPelicula.duration_minutes,

              poster_url:
                this.nuevaPelicula.poster_url.trim()
                  || null,

              release_date:
                this.nuevaPelicula.release_date
                  || null,

              age_rating:
                this.nuevaPelicula.age_rating,

              pre_sale_enabled:
                this.nuevaPelicula.pre_sale_enabled,

              pre_sale_price:
                this.nuevaPelicula.pre_sale_price,
            }
          );

        if (!pelicula) {

          this.error =
            'No se pudo actualizar la película.';

          return;
        }

      }

      /* =========================
         CREAR
         ========================= */

      else {

        const pelicula =
          await this.movieService.createMovie({
            title:
              this.nuevaPelicula.title.trim(),

            synopsis:
              this.nuevaPelicula.synopsis.trim()
                || null,

            duration_minutes:
              this.nuevaPelicula.duration_minutes,

            poster_url:
              this.nuevaPelicula.poster_url.trim()
                || null,

            release_date:
              this.nuevaPelicula.release_date
                || null,

            age_rating:
              this.nuevaPelicula.age_rating,

            pre_sale_enabled:
              this.nuevaPelicula.pre_sale_enabled,

            pre_sale_price:
              this.nuevaPelicula.pre_sale_price,
          });

        if (!pelicula) {

          this.error =
            'No se pudo crear la película.';

          return;
        }
      }

      this.cerrarFormulario();

      await this.cargarPeliculas();

    } catch (error) {

      console.error(
        'ERROR AL GUARDAR PELÍCULA:',
        error
      );

      this.error =
        'Ocurrió un error al guardar la película.';

    } finally {

      this.guardando = false;

      this.changeDetector.detectChanges();
    }
  }

  /* =========================
     ACTIVAR / DESACTIVAR
     ========================= */

  async cambiarEstado(movie: Movie) {

    const nuevoEstado =
      !movie.is_active;

    const pelicula =
      await this.movieService.updateMovie(
        movie.id,
        {
          is_active: nuevoEstado,
        }
      );

    if (!pelicula) {

      this.error =
        'No se pudo cambiar el estado de la película.';

      this.changeDetector.detectChanges();

      return;
    }

    await this.cargarPeliculas();
  }

  async eliminarPelicula(movie: Movie) {
    const confirmar = window.confirm(
      `¿Seguro que querés eliminar la película "${movie.title}"?`
    );

    if (!confirmar) {
      return;
    }

    const eliminado = await this.movieService.permanentlyDeleteMovie(movie.id);

    if (!eliminado) {
      this.error = 'No se pudo eliminar la película.';
      return;
    }

    await this.cargarPeliculas();
  }
}