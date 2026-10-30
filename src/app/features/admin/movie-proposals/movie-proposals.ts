
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  MovieProposal,
  MovieProposalService,
} from '../../movie-proposal/movie-proposal.service';

@Component({
  selector: 'app-movie-proposals-admin',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './movie-proposals.html',
  styleUrl: './movie-proposals.scss',
})
export class MovieProposalsAdmin {
  private proposalService = inject(MovieProposalService);
  private cdr = inject(ChangeDetectorRef);

  propuestas: MovieProposal[] = [];
  cargando = true;
  procesandoId: string | null = null;
  error = '';
  mensaje = '';

  async ngOnInit(): Promise<void> {
    await this.cargarPropuestas();
  }

  async cargarPropuestas(): Promise<void> {
    this.cargando = true;
    this.error = '';

    try {
      this.propuestas =
        await this.proposalService.getPendingProposals();
    } catch (err) {
      console.error('Error al cargar propuestas:', err);
      this.error = 'No se pudieron cargar las propuestas. Verificá los permisos de administrador.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  async rechazarPropuesta(propuesta: MovieProposal): Promise<void> {
    if (this.procesandoId) return;

    this.error = '';
    this.mensaje = '';
    this.procesandoId = propuesta.id;

    try {
      await this.proposalService.reviewProposal(
        propuesta.id,
        'rejected'
      );

      this.mensaje = `La propuesta "${propuesta.title}" fue rechazada.`;
      await this.cargarPropuestas();
    } catch (err) {
      console.error('Error al rechazar propuesta:', err);
      this.error = 'No se pudo rechazar la propuesta.';
    } finally {
      this.procesandoId = null;
      this.cdr.detectChanges();
    }
  }
}
