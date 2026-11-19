import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { supabase } from '../../../core/supabase';

interface PaidOrder {
  id: string;
  total: number | string;
  created_at: string;
}

interface Ticket {
  id: string;
  order_id: string;
  screening_id: string;
  status: string;
}

interface TicketSeat {
  id: string;
  ticket_id: string;
  screening_id: string;
}

interface Screening {
  id: string;
  movie_id: string;
  start_time: string;
}

interface Movie {
  id: string;
  title: string;
}

interface OrderItem {
  id: string;
  item_type: 'ticket' | 'product' | 'combo';
  product_id: string | null;
  combo_id: string | null;
  quantity: number;
}

interface ComboItem {
  combo_id: string;
  product_id: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
}

interface RevenueDay {
  date: string;
  label: string;
  orders: number;
  tickets: number;
  revenue: number;
}

interface RankingItem {
  id: string;
  name: string;
  quantity: number;
  percentage: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  cargando = true;
  error = '';

  totalRecaudado = 0;
  entradasVendidas = 0;
  comprasPagadas = 0;
  productoMasVendido = 'Sin ventas registradas';

  facturacionDiaria: RevenueDay[] = [];
  peliculasSemana: RankingItem[] = [];
  peliculasMes: RankingItem[] = [];
  productosMasVendidos: RankingItem[] = [];

  async ngOnInit(): Promise<void> {
    await this.cargarReportes();
  }

  async cargarReportes(): Promise<void> {
    this.cargando = true;
    this.error = '';

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, created_at')
        .eq('status', 'paid')
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      const orders = (ordersData ?? []) as PaidOrder[];
      const orderIds = orders.map(order => order.id);

      this.comprasPagadas = orders.length;
      this.totalRecaudado = orders.reduce(
        (total, order) => total + Number(order.total || 0),
        0,
      );

      if (orderIds.length === 0) {
        this.limpiarDatosDeVentas();
        return;
      }

      const [{ data: ticketsData, error: ticketsError }, { data: itemsData, error: itemsError }] =
        await Promise.all([
          supabase
            .from('tickets')
            .select('id, order_id, screening_id, status')
            .in('order_id', orderIds)
            .neq('status', 'cancelled'),
          supabase
            .from('order_items')
            .select('id, item_type, product_id, combo_id, quantity')
            .in('order_id', orderIds),
        ]);

      if (ticketsError) throw ticketsError;
      if (itemsError) throw itemsError;

      const tickets = (ticketsData ?? []) as Ticket[];
      const orderItems = (itemsData ?? []) as OrderItem[];
      const ticketIds = tickets.map(ticket => ticket.id);

      let ticketSeats: TicketSeat[] = [];
      if (ticketIds.length > 0) {
        const { data, error } = await supabase
          .from('ticket_seats')
          .select('id, ticket_id, screening_id')
          .in('ticket_id', ticketIds);

        if (error) throw error;
        ticketSeats = (data ?? []) as TicketSeat[];
      }

      this.entradasVendidas = ticketSeats.length;
      this.construirFacturacionDiaria(orders, ticketSeats, tickets);

      await this.cargarRankingPeliculas(ticketSeats);
      await this.cargarRankingProductos(orderItems);
    } catch (err: unknown) {
      console.error('Error al cargar reportes:', err);
      this.error = err instanceof Error
        ? err.message
        : 'No se pudieron cargar los reportes. Verificá tu conexión e intentá nuevamente.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  private limpiarDatosDeVentas(): void {
    this.totalRecaudado = 0;
    this.entradasVendidas = 0;
    this.productoMasVendido = 'Sin ventas registradas';
    this.facturacionDiaria = [];
    this.peliculasSemana = [];
    this.peliculasMes = [];
    this.productosMasVendidos = [];
  }

  private construirFacturacionDiaria(
    orders: PaidOrder[],
    seats: TicketSeat[],
    tickets: Ticket[],
  ): void {
    const seatsByOrder = new Map<string, number>();
    const ticketById = new Map<string, Ticket>(tickets.map(ticket => [ticket.id, ticket] as const));

    for (const seat of seats) {
      const ticket = ticketById.get(seat.ticket_id);
      if (!ticket) continue;
      seatsByOrder.set(ticket.order_id, (seatsByOrder.get(ticket.order_id) ?? 0) + 1);
    }

    const grouped = new Map<string, RevenueDay>();

    for (const order of orders) {
      const date = new Date(order.created_at);
      const key = this.fechaClave(date);
      const current = grouped.get(key) ?? {
        date: key,
        label: date.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        orders: 0,
        tickets: 0,
        revenue: 0,
      };

      current.orders += 1;
      current.tickets += seatsByOrder.get(order.id) ?? 0;
      current.revenue += Number(order.total || 0);
      grouped.set(key, current);
    }

    this.facturacionDiaria = [...grouped.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  private async cargarRankingPeliculas(seats: TicketSeat[]): Promise<void> {
    this.peliculasSemana = [];
    this.peliculasMes = [];
    if (seats.length === 0) return;

    const screeningIds = [...new Set(seats.map(seat => seat.screening_id))];
    const { data: screeningsData, error: screeningsError } = await supabase
      .from('screenings')
      .select('id, movie_id, start_time')
      .in('id', screeningIds);

    if (screeningsError) throw screeningsError;

    const screenings = (screeningsData ?? []) as Screening[];
    const movieIds = [...new Set(screenings.map(screening => screening.movie_id))];
    if (movieIds.length === 0) return;

    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('id, title')
      .in('id', movieIds);

    if (moviesError) throw moviesError;

    const movies = (moviesData ?? []) as Movie[];
    const movieById = new Map<string, string>(movies.map(movie => [movie.id, movie.title] as const));
    const screeningById = new Map<string, Screening>(screenings.map(screening => [screening.id, screening] as const));
    const weeklyStart = this.inicioDeSemana(new Date());
    const weeklyEnd = new Date(weeklyStart);
    weeklyEnd.setDate(weeklyEnd.getDate() + 7);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const weekCounts = new Map<string, number>();
    const monthCounts = new Map<string, number>();

    for (const seat of seats) {
      const screening = screeningById.get(seat.screening_id);
      if (!screening) continue;

      const date = new Date(screening.start_time);
      const title = movieById.get(screening.movie_id);
      if (!title) continue;

      if (date >= weeklyStart && date < weeklyEnd) {
        weekCounts.set(screening.movie_id, (weekCounts.get(screening.movie_id) ?? 0) + 1);
      }
      if (date >= monthStart && date < monthEnd) {
        monthCounts.set(screening.movie_id, (monthCounts.get(screening.movie_id) ?? 0) + 1);
      }
    }

    this.peliculasSemana = this.armarRanking(weekCounts, movieById);
    this.peliculasMes = this.armarRanking(monthCounts, movieById);
  }

  private async cargarRankingProductos(items: OrderItem[]): Promise<void> {
    this.productosMasVendidos = [];
    const cantidades = new Map<string, number>();
    const comboIds = [...new Set(
      items
        .filter(item => item.item_type === 'combo' && item.combo_id)
        .map(item => item.combo_id as string),
    )];

    for (const item of items) {
      if (item.item_type === 'product' && item.product_id) {
        cantidades.set(
          item.product_id,
          (cantidades.get(item.product_id) ?? 0) + Number(item.quantity || 0),
        );
      }
    }

    if (comboIds.length > 0) {
      const { data: comboItemsData, error: comboItemsError } = await supabase
        .from('combo_items')
        .select('combo_id, product_id, quantity')
        .in('combo_id', comboIds);

      if (comboItemsError) throw comboItemsError;

      const comboItems = (comboItemsData ?? []) as ComboItem[];
      const comboQuantity = new Map<string, number>();

      for (const item of items) {
        if (item.item_type === 'combo' && item.combo_id) {
          comboQuantity.set(
            item.combo_id,
            (comboQuantity.get(item.combo_id) ?? 0) + Number(item.quantity || 0),
          );
        }
      }

      for (const component of comboItems) {
        const soldCombos = comboQuantity.get(component.combo_id) ?? 0;
        cantidades.set(
          component.product_id,
          (cantidades.get(component.product_id) ?? 0) +
            soldCombos * Number(component.quantity || 0),
        );
      }
    }

    const productIds = [...cantidades.keys()];
    if (productIds.length === 0) {
      this.productoMasVendido = 'Sin ventas registradas';
      return;
    }

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);

    if (productsError) throw productsError;

    const products = (productsData ?? []) as Product[];
    const names = new Map<string, string>(products.map(product => [product.id, product.name] as const));
    const sorted = [...cantidades.entries()]
      .map(([id, quantity]) => ({
        id,
        name: names.get(id) ?? 'Producto no disponible',
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity);

    const max = sorted[0]?.quantity ?? 0;
    this.productosMasVendidos = sorted.slice(0, 5).map(item => ({
      ...item,
      percentage: max > 0 ? (item.quantity / max) * 100 : 0,
    }));
    this.productoMasVendido = sorted[0]?.name ?? 'Sin ventas registradas';
  }

  private armarRanking(
    counts: Map<string, number>,
    names: Map<string, string>,
  ): RankingItem[] {
    const sorted = [...counts.entries()]
      .map(([id, quantity]) => ({
        id,
        name: names.get(id) ?? 'Película no disponible',
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const max = sorted[0]?.quantity ?? 0;
    return sorted.map(item => ({
      ...item,
      percentage: max > 0 ? (item.quantity / max) * 100 : 0,
    }));
  }

  private inicioDeSemana(date: Date): Date {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    return start;
  }

  private fechaClave(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  exportarExcel(): void {
    const rows = [
      ['Fecha', 'Compras pagadas', 'Entradas vendidas', 'Recaudación (ARS)'],
      ...this.facturacionDiaria.map(day => [
        day.label,
        String(day.orders),
        String(day.tickets),
        day.revenue.toFixed(2),
      ]),
    ];

    const xmlRows = rows.map(row =>
      `<Row>${row.map(value => `<Cell><Data ss:Type="String">${this.escaparXml(value)}</Data></Cell>`).join('')}</Row>`,
    ).join('');

    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Facturacion"><Table>${xmlRows}</Table></Worksheet>
</Workbook>`;

    this.descargarArchivo(
      new Blob(['\ufeff', workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }),
      `facturacion-${this.fechaClave(new Date())}.xls`,
    );
  }

  exportarPdf(): void {
    window.print();
  }

  private descargarArchivo(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  private escaparXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
