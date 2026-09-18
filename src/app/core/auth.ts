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
  ) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          birth_date: birthDate,
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