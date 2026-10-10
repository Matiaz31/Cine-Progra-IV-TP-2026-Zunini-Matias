import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { supabase } from '../../../core/supabase';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './complete-profile.html',
  styleUrl: './complete-profile.scss',
})
export class CompleteProfile implements OnInit {
  private router = inject(Router);
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
  error = '';
  private userId = '';

  async ngOnInit(): Promise<void> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) {
        await this.router.navigate(['/login']);
        return;
      }

      this.userId = user.id;
      this.email = user.email ?? '';
      const metadata = user.user_metadata ?? {};
      const fullName = String(metadata['full_name'] ?? metadata['name'] ?? '').trim();
      const nameParts = fullName.split(/\s+/).filter(Boolean);
      this.firstName = String(metadata['first_name'] ?? nameParts[0] ?? '');
      this.lastName = String(metadata['last_name'] ?? nameParts.slice(1).join(' '));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, birth_date, blood_type, eye_color, vacation_days')
        .eq('id', user.id)
        .maybeSingle();

      // A missing profile is expected for some OAuth sign-ins; collect the required fields here.
      if (profileError) throw profileError;
      if (profile) {
        this.email = profile.email ?? this.email;
        this.firstName = profile.first_name ?? this.firstName;
        this.lastName = profile.last_name ?? this.lastName;
        this.birthDate = profile.birth_date ?? '';
        this.bloodType = profile.blood_type ?? '';
        this.eyeColor = profile.eye_color ?? '';
        this.vacationDays = profile.vacation_days ?? 0;

        if (this.firstName.trim() && this.lastName.trim() && this.birthDate) {
          await this.router.navigate(['/home']);
          return;
        }
      }
    } catch (e) {
      console.error('No se pudo preparar el perfil OAuth:', e);
      this.error = 'No se pudieron cargar los datos de tu cuenta. Volvé a iniciar sesión e intentá nuevamente.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async saveProfile(): Promise<void> {
    this.error = '';
    if (this.saving) return;
    if (!this.userId) {
      this.error = 'No hay una sesión activa. Volvé a iniciar sesión con Google o GitHub.';
      return;
    }
    if (!this.firstName.trim() || !this.lastName.trim() || !this.birthDate) {
      this.error = 'Completá nombre, apellido y fecha de nacimiento.';
      return;
    }

    this.saving = true;
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: this.userId,
        email: this.email,
        first_name: this.firstName.trim(),
        last_name: this.lastName.trim(),
        birth_date: this.birthDate,
        blood_type: this.bloodType || null,
        eye_color: this.eyeColor.trim() || null,
        vacation_days: Math.max(0, Number(this.vacationDays) || 0),
      }, { onConflict: 'id' });

      if (error) throw error;
      await this.router.navigate(['/home']);
    } catch (e) {
      console.error('Error guardando el perfil OAuth:', e);
      this.error = 'No se pudieron guardar los datos. Revisá que la fecha y los campos sean válidos e intentá nuevamente.';
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }
}