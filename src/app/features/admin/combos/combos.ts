import { CommonModule } from '@angular/common';
import {
	ChangeDetectorRef,
	Component,
	OnInit,
	inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../../core/supabase';

interface Producto {
	id: string;
	name: string;
	price: number;
	stock: number;
	is_active: boolean;
}

interface ItemCombo {
	product_id: string;
	quantity: number;
}

interface Combo {
	id: string;
	name: string;
	description: string | null;
	price: number;
	image_url: string | null;
	is_active: boolean;
	created_at: string;
}

@Component({
	selector: 'app-combos',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './combos.html',
	styleUrl: './combos.scss',
})
export class Combos implements OnInit {
	private cdr = inject(ChangeDetectorRef);

	combos: Combo[] = [];
	productos: Producto[] = [];

	cargando = false;
	guardando = false;
	borrandoId: string | null = null;

	error = '';
	mensaje = '';

	editandoId: string | null = null;

	formulario = this.formularioVacio();

	ngOnInit(): void {
		void this.cargarDatos();
	}

	private formularioVacio() {
		return {
			name: '',
			description: '',
			price: 0,
			image_url: '',
			items: [{ product_id: '', quantity: 1 }] as ItemCombo[],
		};
	}

	async cargarDatos(): Promise<void> {
		this.cargando = true;
		this.cdr.detectChanges();

		try {
			const [combosRes, productosRes] = await Promise.all([
				supabase
					.from('combos')
					.select(
						'id, name, description, price, image_url, is_active, created_at'
					)
					.order('created_at', { ascending: false }),

				supabase
					.from('products')
					.select('id, name, price, stock, is_active')
					.eq('is_active', true)
					.order('name'),
			]);

			if (combosRes.error) {
				throw combosRes.error;
			}

			if (productosRes.error) {
				throw productosRes.error;
			}

			this.combos = (combosRes.data ?? []).map((combo) => ({
				...combo,
				price: Number(combo.price),
			}));

			this.productos = (productosRes.data ?? []).map((producto) => ({
				...producto,
				price: Number(producto.price),
				stock: Number(producto.stock),
			}));
		} catch (e) {
			console.error('Error cargando combos:', e);

			this.error = e instanceof Error
				? `No se pudieron cargar los combos o productos: ${e.message}`
				: 'No se pudieron cargar los combos o productos.';
		} finally {
			this.cargando = false;
			this.cdr.detectChanges();
		}
	}

	agregarProducto(): void {
		this.formulario.items.push({
			product_id: '',
			quantity: 1,
		});
	}

	quitarProducto(index: number): void {
		if (this.formulario.items.length === 1) {
			this.formulario.items[0] = {
				product_id: '',
				quantity: 1,
			};
			return;
		}

		this.formulario.items.splice(index, 1);
	}

	obtenerProducto(productId: string): Producto | undefined {
		return this.productos.find((producto) => producto.id === productId);
	}

	precioProductos(): number {
		return this.formulario.items.reduce((total, item) => {
			const producto = this.obtenerProducto(item.product_id);

			return total +
				(producto?.price ?? 0) * Number(item.quantity || 0);
		}, 0);
	}

	nuevoCombo(): void {
		this.editandoId = null;
		this.formulario = this.formularioVacio();
		this.error = '';
		this.mensaje = '';
		this.cdr.detectChanges();
	}

	async editarCombo(combo: Combo): Promise<void> {
		this.error = '';
		this.mensaje = '';

		try {
			const { data, error } = await supabase
				.from('combo_items')
				.select('product_id, quantity')
				.eq('combo_id', combo.id);

			if (error) {
				throw error;
			}

			this.editandoId = combo.id;

			this.formulario = {
				name: combo.name,
				description: combo.description ?? '',
				price: Number(combo.price),
				image_url: combo.image_url ?? '',
				items: (data ?? []).map((item) => ({
					product_id: item.product_id,
					quantity: Number(item.quantity),
				})),
			};

			if (this.formulario.items.length === 0) {
				this.formulario.items = [
					{ product_id: '', quantity: 1 },
				];
			}

			this.cdr.detectChanges();
		} catch (e) {
			console.error('Error cargando detalle del combo:', e);

			this.error = e instanceof Error
				? `No se pudieron cargar los productos: ${e.message}`
				: 'No se pudieron cargar los productos de este combo.';

			this.cdr.detectChanges();
		}
	}

	cancelarEdicion(): void {
		this.nuevoCombo();
	}

	private validarFormulario(): string | null {
		if (!this.formulario.name.trim()) {
			return 'Ingresá el nombre del combo.';
		}

		if (
			!Number.isFinite(Number(this.formulario.price)) ||
			Number(this.formulario.price) <= 0
		) {
			return 'El precio del combo debe ser mayor que cero.';
		}

		if (this.formulario.items.length === 0) {
			return 'Agregá al menos un producto al combo.';
		}

		const itemsValidos = this.formulario.items.filter(
			(item) => item.product_id
		);

		if (itemsValidos.length === 0) {
			return 'Seleccioná al menos un producto.';
		}

		if (
			itemsValidos.some(
				(item) =>
					!Number.isInteger(Number(item.quantity)) ||
					Number(item.quantity) < 1
			)
		) {
			return 'La cantidad debe ser un entero mayor que cero.';
		}

		const ids = itemsValidos.map((item) => item.product_id);

		if (new Set(ids).size !== ids.length) {
			return 'No repitas un producto. Modificá su cantidad.';
		}

		return null;
	}

	async guardarCombo(): Promise<void> {
		if (this.guardando) {
			return;
		}

		this.error = '';
		this.mensaje = '';

		const errorValidacion = this.validarFormulario();

		if (errorValidacion) {
			this.error = errorValidacion;
			return;
		}

		const items = this.formulario.items
			.filter((item) => item.product_id)
			.map((item) => ({
				product_id: item.product_id,
				quantity: Number(item.quantity),
			}));

		this.guardando = true;
		this.cdr.detectChanges();

		try {
			const datosCombo = {
				name: this.formulario.name.trim(),
				description: this.formulario.description.trim() || null,
				price: Number(this.formulario.price),
				image_url: this.formulario.image_url.trim() || null,
			};

			const estabaEditando = this.editandoId !== null;
			let comboId = this.editandoId;

			if (comboId) {
				const { error } = await supabase
					.from('combos')
					.update(datosCombo)
					.eq('id', comboId);

				if (error) {
					throw error;
				}
			} else {
				const { data, error } = await supabase
					.from('combos')
					.insert({
						...datosCombo,
						is_active: true,
					})
					.select('id')
					.single();

				if (error) {
					throw error;
				}

				comboId = data.id;
			}

			if (!comboId) {
				throw new Error('No se pudo identificar el combo guardado.');
			}

			const { error: borrarError } = await supabase
				.from('combo_items')
				.delete()
				.eq('combo_id', comboId);

			if (borrarError) {
				throw new Error(
					'El combo se guardó, pero no se pudieron actualizar sus productos.'
				);
			}

			const filas = items.map((item) => ({
				combo_id: comboId!,
				product_id: item.product_id,
				quantity: item.quantity,
			}));

			const { error: insertarError } = await supabase
				.from('combo_items')
				.insert(filas);

			if (insertarError) {
				console.error(
					'Error guardando productos del combo:',
					insertarError
				);

				throw new Error(
					'El combo se guardó, pero falló la carga de sus productos.'
				);
			}

			// Reinicia el formulario sin borrar el mensaje de éxito.
			this.editandoId = null;
			this.formulario = this.formularioVacio();

			this.mensaje = estabaEditando
				? 'Combo actualizado correctamente.'
				: 'Combo creado correctamente.';

			// La recarga ya no se bloquea si había otra carga en curso.
			await this.cargarDatos();
		} catch (e) {
			console.error('Error guardando combo:', e);

			this.error = e instanceof Error
				? e.message
				: 'No se pudo guardar el combo.';
		} finally {
			this.guardando = false;
			this.cdr.detectChanges();
		}
	}

	async cambiarEstado(combo: Combo): Promise<void> {
		if (this.guardando || this.borrandoId) {
			return;
		}

		this.error = '';
		this.mensaje = '';

		const estadoAnterior = combo.is_active;
		const nuevoEstado = !estadoAnterior;

		// Actualización visual inmediata.
		this.combos = this.combos.map((item) =>
			item.id === combo.id
				? { ...item, is_active: nuevoEstado }
				: item
		);

		this.cdr.detectChanges();

		try {
			const { data, error } = await supabase
				.from('combos')
				.update({ is_active: nuevoEstado })
				.eq('id', combo.id)
				.select('id, is_active')
				.single();

			if (error) {
				throw error;
			}

			this.combos = this.combos.map((item) =>
				item.id === combo.id
					? { ...item, is_active: data.is_active }
					: item
			);

			this.mensaje = data.is_active
				? 'Combo activado correctamente.'
				: 'Combo desactivado correctamente.';
		} catch (e) {
			console.error('Error cambiando estado:', e);

			this.combos = this.combos.map((item) =>
				item.id === combo.id
					? { ...item, is_active: estadoAnterior }
					: item
			);

			this.error = e instanceof Error
				? `No se pudo cambiar el estado: ${e.message}`
				: 'No se pudo cambiar el estado del combo.';
		} finally {
			this.cdr.detectChanges();
		}
	}

	async borrarCombo(combo: Combo): Promise<void> {
		if (this.guardando || this.borrandoId) {
			return;
		}

		const confirmado = window.confirm(
			`¿Seguro que querés borrar el combo "${combo.name}"? Esta acción no se puede deshacer.`
		);

		if (!confirmado) {
			return;
		}

		this.error = '';
		this.mensaje = '';
		this.borrandoId = combo.id;
		this.cdr.detectChanges();

		try {
			// No permitir borrar combos que ya estén incluidos en pedidos.
			const { data: pedidos, error: pedidosError } = await supabase
				.from('order_items')
				.select('id')
				.eq('combo_id', combo.id)
				.limit(1);

			if (pedidosError) {
				throw pedidosError;
			}

			if (pedidos && pedidos.length > 0) {
				throw new Error(
					'No se puede borrar este combo porque está asociado a un pedido. Podés desactivarlo.'
				);
			}

			// Eliminar primero los productos asociados al combo.
			const { error: itemsError } = await supabase
				.from('combo_items')
				.delete()
				.eq('combo_id', combo.id);

			if (itemsError) {
				throw itemsError;
			}

			// Eliminar el combo.
			const { error: comboError } = await supabase
				.from('combos')
				.delete()
				.eq('id', combo.id);

			if (comboError) {
				throw comboError;
			}

			// Quitar de la pantalla inmediatamente.
			this.combos = this.combos.filter(
				(item) => item.id !== combo.id
			);

			this.mensaje = 'Combo eliminado correctamente.';

			this.cdr.detectChanges();

			// Sincronizar la lista con Supabase.
			await this.cargarDatos();
		} catch (e) {
			console.error('Error borrando combo:', e);

			this.error = e instanceof Error
				? e.message
				: 'No se pudo borrar el combo.';
		} finally {
			this.borrandoId = null;
			this.cdr.detectChanges();
		}
	}
}