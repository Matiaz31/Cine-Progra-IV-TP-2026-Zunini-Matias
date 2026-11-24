import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../core/supabase';
import { Router } from '@angular/router';
import { WaitlistService, WaitlistEntry } from '../seats/waitlist.service';

interface CancellationCreditBalance {
  movie_id: string;
  movie_title: string;
  amount: number;
}

interface ProfileNotification {
  id: string;
  type: string;
  message: string;
  proposal_id: string | null;
  waitlist_id?: string | null;
  created_at: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private waitlistService = inject(WaitlistService);

  firstName = '';
  lastName = '';
  birthDate = '';
  bloodType = '';
  eyeColor = '';
  email = '';
  vacationDays = 0;
  notifications: ProfileNotification[] = [];
  cancellationCreditsLoading = false;
  cancellationCreditsMessage = '';
  cancellationCreditsError = '';
  cancellationCreditBalances: CancellationCreditBalance[] = [];
  notificationsLoading = false;
  notificationsError = '';
  waitlistEntries: WaitlistEntry[] = [];
  waitlistLoading = false;
  waitlistError = '';
  waitlistActionId = '';

  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  private userId = '';

  editModes = {
    firstName: false,
    lastName: false,
    birthDate: false,
    bloodType: false,
    eyeColor: false,
  };

  get isEditing(): boolean {
    return Object.values(this.editModes).some(Boolean);
  }

  async ngOnInit(): Promise<void> {
    await this.loadProfile();

  }

  async loadProfile(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        this.errorMessage = 'No hay una sesión iniciada.';
        return;
      }

      this.userId = user.id;

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'email, first_name, last_name, birth_date, blood_type, eye_color, vacation_days',
        )
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      this.email = data.email ?? '';
      this.firstName = data.first_name ?? '';
      this.lastName = data.last_name ?? '';
      this.birthDate = data.birth_date ?? '';
      this.bloodType = data.blood_type ?? '';
      this.eyeColor = data.eye_color ?? '';
      this.vacationDays = data.vacation_days ?? 0;
      await Promise.all([
        this.loadNotifications(),
        this.loadWaitlist(),
        this.loadCancellationCreditBalances(),
      ]);
    } catch (error) {
      console.error('Error cargando el perfil:', error);
      this.errorMessage =
        'No se pudo cargar el perfil. Revisá la consola para ver el error.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async claimCancellationCredits(): Promise<void> {
    if (this.cancellationCreditsLoading) return;

    this.cancellationCreditsLoading = true;
    this.cancellationCreditsMessage = '';
    this.cancellationCreditsError = '';

    try {
      const { data, error } = await supabase.rpc(
        'claim_screening_cancellation_credits',
      );

      if (error) throw error;

      const result = data as {
        claimed_count?: number;
        total_amount?: number;
      };

      const count = Number(result?.claimed_count ?? 0);
      const amount = Number(result?.total_amount ?? 0);
      const formattedAmount = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2,
      }).format(amount);

      this.cancellationCreditsMessage =
        count > 0
          ? `Se reclamaron ${count} crédito(s) por un total de ${formattedAmount}.`
          : 'No se encontraron créditos pendientes para reclamar.';

      await this.loadCancellationCreditBalances();
    } catch (error: any) {
      console.error('Error reclamando créditos por cancelación:', error);
      this.cancellationCreditsError =
        error?.message ?? 'No se pudieron reclamar los créditos.';
    } finally {
      this.cancellationCreditsLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadCancellationCreditBalances(): Promise<void> {
    try {
      const { data, error } = await supabase.rpc(
        'get_my_cancellation_credit_balances',
      );

      if (error) throw error;
      this.cancellationCreditBalances = Array.isArray(data)
        ? data as CancellationCreditBalance[]
        : [];
    } catch (error) {
      console.error('Error cargando créditos por cancelación:', error);
      this.cancellationCreditsError =
        'No se pudo consultar el saldo de créditos.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  formatCreditAmount(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private async loadNotifications(): Promise<void> {
    this.notificationsLoading = true;
    this.notificationsError = '';

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, message, proposal_id, created_at')
        .eq('user_id', this.userId)
        .in('type', [
          'movie_proposal_accepted',
          'movie_proposal_rejected',
          'waitlist_offer',
          'waitlist_offer_expired',
        ])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      this.notifications = (data ?? []) as ProfileNotification[];
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      this.notificationsError =
        'No se pudieron cargar las notificaciones.';
    } finally {
      this.notificationsLoading = false;
      this.cdr.detectChanges();
    }
  }


  private async loadWaitlist(): Promise<void> {
    this.waitlistLoading = true;
    this.waitlistError = '';

    try {
      this.waitlistEntries = await this.waitlistService.getMine();
    } catch (error) {
      console.error('Error cargando lista de espera:', error);
      this.waitlistError = 'No se pudo cargar tu lista de espera.';
    } finally {
      this.waitlistLoading = false;
      this.cdr.detectChanges();
    }
  }

  async leaveWaitlist(entry: WaitlistEntry): Promise<void> {
    if (this.waitlistActionId) return;
    this.waitlistActionId = entry.waitlist_id;
    this.waitlistError = '';

    try {
      await this.waitlistService.leave(entry.waitlist_id);
      await this.loadWaitlist();
      await this.loadNotifications();
    } catch (error: any) {
      console.error('Error saliendo de la lista de espera:', error);
      this.waitlistError = error?.message ?? 'No se pudo cancelar la inscripción.';
    } finally {
      this.waitlistActionId = '';
      this.cdr.detectChanges();
    }
  }

  buyOfferedSeats(entry: WaitlistEntry): void {
    this.router.navigate(['/seleccion-butacas', entry.screening_id]);
  }

  async saveProfile(): Promise<void> {
    if (!this.userId || this.saving) return;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: this.firstName.trim(),
        last_name: this.lastName.trim(),
        birth_date: this.birthDate,
        blood_type: this.bloodType || null,
        eye_color: this.eyeColor || null,
      })
      .eq('id', this.userId);

    if (error) {
      this.errorMessage = 'No se pudieron guardar los cambios.';
      console.error('Error al guardar el perfil:', error);
    } else {
      this.successMessage = 'Perfil actualizado correctamente.';

      this.editModes = {
        firstName: false,
        lastName: false,
        birthDate: false,
        bloodType: false,
        eyeColor: false,
      };
    }

    this.saving = false;
  }
}