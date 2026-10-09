import {
ChangeDetectorRef,
Component,
inject,
OnInit,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AdminGenreService, Genre } from './admin-genre.service';

@Component({
selector: 'app-generos',
standalone: true,
imports: [FormsModule],
templateUrl: './generos.html',
styleUrl: './generos.scss',
})
export class Generos implements OnInit {
private genreService = inject(AdminGenreService);
private cdr = inject(ChangeDetectorRef);

genres: Genre[] = [];

loading = true;
saving = false;
error = '';
success = '';

mostrarFormulario = false;
editando = false;
generoEditandoId: string | null = null;
nombreGenero = '';

async ngOnInit(): Promise<void> {
await this.cargarGeneros();
}

async cargarGeneros(): Promise<void> {
this.loading = true;
this.error = '';

```
try {
  this.genres = await this.genreService.getGenres();
} catch (error) {
  console.error('ERROR AL CARGAR GÉNEROS:', error);
  this.error = 'No se pudieron cargar los géneros.';
  this.genres = [];
} finally {
  this.loading = false;
  this.cdr.detectChanges();
}
```

}

abrirFormulario(): void {
this.editando = false;
this.generoEditandoId = null;
this.nombreGenero = '';
this.error = '';
this.success = '';
this.mostrarFormulario = true;
}

editarGenero(genre: Genre): void {
this.editando = true;
this.generoEditandoId = genre.id;
this.nombreGenero = genre.name;
this.error = '';
this.success = '';
this.mostrarFormulario = true;
}

cerrarFormulario(): void {
this.mostrarFormulario = false;
this.editando = false;
this.generoEditandoId = null;
this.nombreGenero = '';
this.error = '';
}

async guardarGenero(): Promise<void> {
const nombre = this.nombreGenero.trim();

if (this.saving) return;

this.error = '';
this.success = '';

if (!nombre) {
  this.error = 'El nombre del género es obligatorio.';
  return;
}

const nombreDuplicado = this.genres.some(
  genre =>
    genre.name.toLocaleLowerCase() === nombre.toLocaleLowerCase() &&
    genre.id !== this.generoEditandoId
);

if (nombreDuplicado) {
  this.error = 'Ya existe un género con ese nombre.';
  return;
}

this.saving = true;

try {
  if (this.editando && this.generoEditandoId) {
    const actualizado = await this.genreService.updateGenre(
      this.generoEditandoId,
      nombre
    );

    if (!actualizado) {
      this.error = 'No se pudo actualizar el género.';
      return;
    }

    this.success = 'Género actualizado correctamente.';
  } else {
    const creado = await this.genreService.createGenre(nombre);

    if (!creado) {
      this.error = 'No se pudo crear el género.';
      return;
    }

    this.success = 'Género creado correctamente.';
  }

  this.cerrarFormulario();
  await this.cargarGeneros();
} catch (error) {
  console.error('ERROR AL GUARDAR GÉNERO:', error);
  this.error = 'Ocurrió un error al guardar el género.';
} finally {
  this.saving = false;
  this.cdr.detectChanges();
}

}

async eliminarGenero(genre: Genre): Promise<void> {
const confirmar = window.confirm(
`¿Seguro que querés eliminar el género "${genre.name}"?`
);


if (!confirmar) return;

this.error = '';
this.success = '';

try {
  const eliminado = await this.genreService.deleteGenre(genre.id);

  if (!eliminado) {
    this.error =
      'No se pudo eliminar el género. Puede estar asociado a películas.';
    return;
  }

  this.success = 'Género eliminado correctamente.';
  await this.cargarGeneros();
} catch (error) {
  console.error('ERROR AL ELIMINAR GÉNERO:', error);
  this.error =
    'No se pudo eliminar el género. Puede estar asociado a películas.';
} finally {
  this.cdr.detectChanges();
}


}
}
