import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase';

export interface CandyBarProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  category: string | null;
}

export interface CandyBarCombo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CandyBarService {

  async getProducts(): Promise<CandyBarProduct[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        stock,
        is_active,
        product_categories (
          name
        )
      `)
      .eq('is_active', true)
      .gt('stock', 0)
      .order('name');

    if (error) {
      console.error('ERROR CARGANDO PRODUCTOS:', error);
      throw error;
    }

    return (data ?? []).map((product: any) => {
      const category = Array.isArray(product.product_categories)
        ? product.product_categories[0]
        : product.product_categories;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price ?? 0),
        image_url: product.image_url,
        stock: Number(product.stock ?? 0),
        is_active: product.is_active,
        category: category?.name ?? null,
      };
    });
  }

  async getCombos(): Promise<CandyBarCombo[]> {
    const { data, error } = await supabase
      .from('combos')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        is_active
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('ERROR CARGANDO COMBOS:', error);
      throw error;
    }

    return (data ?? []).map((combo: any) => ({
      id: combo.id,
      name: combo.name,
      description: combo.description,
      price: Number(combo.price ?? 0),
      image_url: combo.image_url,
      is_active: combo.is_active,
    }));
  }

  async getComboItems(comboId: string) {
    const { data, error } = await supabase
      .from('combo_items')
      .select(`
        id,
        quantity,
        product_id,
        products (
          id,
          name,
          description,
          price,
          image_url
        )
      `)
      .eq('combo_id', comboId);

    if (error) {
      console.error('ERROR CARGANDO ITEMS DEL COMBO:', error);
      throw error;
    }

    return data ?? [];
  }
}