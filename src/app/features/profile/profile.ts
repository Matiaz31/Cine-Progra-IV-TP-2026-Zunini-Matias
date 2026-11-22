import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../core/supabase';

interface ProfileNotification {
  id: string;
  type: string;
  message: string;
  proposal_id: string | null;
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

  firstName = '';
  lastName = '';
  birthDate = '';
  bloodType = '';
  eyeColor = '';
  email = '';
  vacationDays = 0;
  notifications: ProfileNotification[] = [];
  notificationsLoading = false;
  notificationsError = '';

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
      await this.loadNotifications();
    } catch (error) {
      console.error('Error cargando el perfil:', error);
      this.errorMessage =
        'No se pudo cargar el perfil. Revisá la consola para ver el error.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
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