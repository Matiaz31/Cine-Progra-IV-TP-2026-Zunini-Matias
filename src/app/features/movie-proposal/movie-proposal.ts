
import {
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MovieProposal,
  MovieProposalService,
} from './movie-proposal.service';

@Component({
  selector: 'app-movie-proposals',
  imports: [FormsModule],
  templateUrl: './movie-proposal.html',
  styleUrl: './movie-proposal.scss',
})
export class MovieProposals {
  private proposalService = inject(MovieProposalService);
  private cdr = inject(ChangeDetectorRef);

  propuestas: MovieProposal[] = [];

  cargando = true;
  enviando = false;
  error = '';
  mensaje = '';

  formulario = {
    title: '',
    description: '',
    reason: '',
  };

  async ngOnInit() {
    await this.cargarPropuestas();
  }

  async cargarPropuestas() {
    this.cargando = true;
    this.error = '';

    try {
      this.propuestas =
        await this.proposalService.getMyProposals();
    } catch (error) {
      console.error('Error al cargar propuestas:', error);
      this.error =
        'No se pudieron cargar tus propuestas. Verificá que hayas iniciado sesión.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  async enviarPropuesta() {
    if (this.enviando) return;

    this.error = '';
    this.mensaje = '';

    const title = this.formulario.title.trim();
    const description = this.formulario.description.trim();
    const reason = this.formulario.reason.trim();

    if (!title || !description || !reason) {
      this.error = 'Completá todos los campos.';
      return;
    }

    const tienePendiente = this.propuestas.some(
      (propuesta) => propuesta.status === 'pending'
    );

    if (tienePendiente) {
      this.error =
        'Ya tenés una propuesta pendiente. Esperá a que sea revisada antes de enviar otra.';
      return;
    }

    this.enviando = true;
    this.cdr.detectChanges();

    try {
      await this.proposalService.createProposal({
        title,
        description,
        reason,
      });

      this.formulario = {
        title: '',
        description: '',
        reason: '',
      };

      this.mensaje = 'Tu propuesta se envió correctamente.';
      await this.cargarPropuestas();
    } catch (error: any) {
      console.error('Error al enviar propuesta:', error);

      if (error?.code === '23505') {
        this.error =
          'Ya tenés una propuesta pendiente. Esperá a que sea revisada.';
      } else {
        this.error =
          'No se pudo enviar la propuesta. Revisá los datos e intentá nuevamente.';
      }
    } finally {
      this.enviando = false;
      this.cdr.detectChanges();
    }
  }
}
