import { Injectable } from '@angular/core';

import { supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    birthDate: string,
    bloodType: string,
    eyeColor: string,
    vacationDays: number,
  ) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          birth_date: birthDate,
          blood_type: bloodType,
          eye_color: eyeColor,
          vacation_days: vacationDays,
        },
      },
    });
  }

  async login(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async loginWithGoogle() {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/completar-perfil`,
      },
    });
  }

  async loginWithGitHub() {
    return await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/completar-perfil`,
      },
    });
  }

  async getRole(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error al obtener el rol:', error);
      return null;
    }

    return data?.role ?? null;
  }

  async logout() {
    return await supabase.auth.signOut();
  }

  async getSession() {
    return await supabase.auth.getSession();
  }

  async getUser() {
    return await supabase.auth.getUser();
  }
}