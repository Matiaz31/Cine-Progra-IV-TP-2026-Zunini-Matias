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

  abrirFormulario() {
    if (this.guardando) return;

    this.editando = false;
    this.peliculaEditandoId = null;
    this.limpiarFormulario();
    this.error = '';
    this.mostrarFormulario = true;

    this.changeDetector.detectChanges();
  }

  editarPelicula(movie: Movie) {
    if (this.guardando) return;

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

  cerrarFormulario() {
    if (this.guardando) return;

    this.mostrarFormulario = false;
    this.editando = false;
    this.peliculaEditandoId = null;
    this.limpiarFormulario();
    this.error = '';

    this.changeDetector.detectChanges();
  }

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

  async guardarPelicula() {
    if (this.guardando) return;

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
      }

      this.mostrarFormulario = false;
      this.editando = false;
      this.peliculaEditandoId = null;
      this.limpiarFormulario();

      await this.cargarPeliculas();
    } catch (error) {
      console.error('ERROR AL GUARDAR PELÍCULA:', error);

      this.error = this.editando
        ? 'No se pudieron guardar los cambios. Revisá la consola para conocer el error.'
        : 'No se pudo crear la película. Revisá la consola para conocer el error.';
    } finally {
      this.guardando = false;
      this.changeDetector.detectChanges();
    }
  }

  async cambiarEstado(movie: Movie) {
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

  async eliminarPelicula(movie: Movie) {
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