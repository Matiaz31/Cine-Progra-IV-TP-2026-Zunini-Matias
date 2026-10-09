import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../core/supabase';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
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
    console.log('PERFIL: componente iniciado');

    await this.loadProfile();

    console.log('PERFIL: carga finalizada', {
      loading: this.loading,
      error: this.errorMessage,
    });
  }

  async loadProfile(): Promise<void> {
    console.log('PERFIL: entrando a loadProfile');
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
    } catch (error) {
      console.error('Error cargando el perfil:', error);
      this.errorMessage =
        'No se pudo cargar el perfil. Revisá la consola para ver el error.';
    } finally {
      this.loading = false;
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