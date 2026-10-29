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
  vacationDays: number | null = null;

  readonly today = this.getLocalDate();
  readonly bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  loading = true;
  saving = false;
  error = '';
  private userId = '';

  private getLocalDate(): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
  }

  async ngOnInit(): Promise<void> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (!user) {
        await this.router.navigate(['/login']);
        return;
      }

      this.userId = user.id;
      this.email = user.email ?? '';

      const metadata = user.user_metadata ?? {};
      const fullName = String(
        metadata['full_name'] ?? metadata['name'] ?? ''
      ).trim();

      const nameParts = fullName.split(/\s+/).filter(Boolean);

      this.firstName = String(
        metadata['first_name'] ?? nameParts[0] ?? ''
      );

      this.lastName = String(
        metadata['last_name'] ?? nameParts.slice(1).join(' ')
      );

      this.birthDate = String(metadata['birth_date'] ?? '');
      this.bloodType = String(metadata['blood_type'] ?? '');
      this.eyeColor = String(metadata['eye_color'] ?? '');
      this.vacationDays =
        metadata['vacation_days'] == null
          ? null
          : Number(metadata['vacation_days']);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(
          'email, first_name, last_name, birth_date, blood_type, eye_color, vacation_days'
        )
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        this.email = profile.email ?? this.email;
        this.firstName = profile.first_name ?? this.firstName;
        this.lastName = profile.last_name ?? this.lastName;
        this.birthDate = profile.birth_date ?? this.birthDate;
        this.bloodType = profile.blood_type ?? this.bloodType;
        this.eyeColor = profile.eye_color ?? this.eyeColor;
        this.vacationDays =
          profile.vacation_days ?? this.vacationDays;
      }

      // No redirigir automáticamente: el usuario debe confirmar el formulario.
    } catch (e) {
      console.error('No se pudo preparar el perfil OAuth:', e);
      this.error =
        'No se pudieron cargar los datos de tu cuenta. Volvé a iniciar sesión e intentá nuevamente.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async saveProfile(): Promise<void> {
    this.error = '';

    if (this.saving) return;

    if (!this.userId || !this.email.trim()) {
      this.error =
        'No se encontró el correo o la sesión. Volvé a iniciar sesión.';
      return;
    }

    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.error = 'Completá nombre y apellido.';
      return;
    }

    if (
      !this.birthDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(this.birthDate) ||
      this.birthDate > this.today
    ) {
      this.error =
        'Ingresá una fecha de nacimiento válida que no sea futura.';
      return;
    }

    const parsedDate = new Date(`${this.birthDate}T00:00:00`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== this.birthDate
    ) {
      this.error = 'La fecha de nacimiento no es válida.';
      return;
    }

    if (!this.bloodTypes.includes(this.bloodType)) {
      this.error = 'Seleccioná un tipo de sangre.';
      return;
    }

    if (!this.eyeColor.trim()) {
      this.error = 'Completá el color de ojos.';
      return;
    }

    if (
      this.vacationDays === null ||
      this.vacationDays === undefined ||
      !Number.isInteger(this.vacationDays) ||
      this.vacationDays < 0
    ) {
      this.error =
        'Ingresá una cantidad entera de días de vacaciones igual o mayor que cero.';
      return;
    }

    this.saving = true;

    try {
      const { error } = await supabase.from('profiles').upsert(
        {
          id: this.userId,
          email: this.email.trim(),
          first_name: this.firstName.trim(),
          last_name: this.lastName.trim(),
          birth_date: this.birthDate,
          blood_type: this.bloodType,
          eye_color: this.eyeColor.trim(),
          vacation_days: Number(this.vacationDays),
        },
        { onConflict: 'id' }
      );

      if (error) throw error;

      await this.router.navigate(['/home']);
    } catch (e) {
      console.error('Error guardando el perfil OAuth:', e);
      this.error =
        'No se pudieron guardar los datos. Revisá los campos e intentá nuevamente.';
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }
}