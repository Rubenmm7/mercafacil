import { Component, computed, input, output, signal } from '@angular/core';
import { Store } from '../../models/models';

export type Floor = 'baja' | 'alta';

interface MallZone {
  storeId: number;
  floor: Floor;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MallZoneView extends MallZone {
  store: Store | null;
  cx: number;
  cy: number;
  labelLines: string[];
}

// SVG viewBox: "0 0 556 290"
// Edificio principal: x:0-372, separador vertical x:376-382, Decathlon: x:386-552
//
// Planta Baja ─ fila superior (y:4-130): Zara · Primark · Tiendanimal | Decathlon (altura total)
//              ─ pasillo (y:130-154)
//              ─ fila inferior (y:154-282): MediaMarkt · Game
//
// Planta Alta ─ fila superior (y:4-130): Popeyes · Vips · Foster's Hollywood
//             ─ pasillo (y:130-154)
//             ─ fila inferior (y:154-282): McDonald's · Terraza
const FLOOR_ZONES: MallZone[] = [
  // ── Planta Baja ──────────────────────────────────────────────
  { floor: 'baja', storeId: 5, x: 4, y: 4, w: 124, h: 126 }, // Zara
  { floor: 'baja', storeId: 6, x: 132, y: 4, w: 124, h: 126 }, // Primark
  { floor: 'baja', storeId: 10, x: 260, y: 4, w: 112, h: 126 }, // Tiendanimal
  { floor: 'baja', storeId: 9, x: 386, y: 4, w: 166, h: 282 }, // Decathlon (anchor)
  { floor: 'baja', storeId: 7, x: 4, y: 154, w: 182, h: 128 }, // MediaMarkt
  { floor: 'baja', storeId: 8, x: 190, y: 154, w: 182, h: 128 }, // Game

  // ── Planta Alta (zona de restauración) ───────────────────────
  { floor: 'alta', storeId: 2, x: 4, y: 4, w: 177, h: 126 }, // Popeyes
  { floor: 'alta', storeId: 3, x: 185, y: 4, w: 177, h: 126 }, // Vips
  { floor: 'alta', storeId: 4, x: 366, y: 4, w: 186, h: 126 }, // Foster's Hollywood
  { floor: 'alta', storeId: 1, x: 4, y: 154, w: 260, h: 128 }, // McDonald's
];

function splitLabel(name: string): string[] {
  if (name.length <= 10) return [name];
  const spaceIdx = name.indexOf(' ', 4);
  return spaceIdx > 0 ? [name.slice(0, spaceIdx), name.slice(spaceIdx + 1)] : [name];
}

@Component({
  selector: 'app-mall-map',
  standalone: true,
  templateUrl: './mall-map.component.html',
  styleUrl: './mall-map.component.css'
})
export class MallMapComponent {
  readonly stores = input.required<Store[]>();
  readonly selectedId = input<number | null>(null);
  readonly storeSelected = output<number>();

  readonly activeFloor = signal<Floor>('baja');

  readonly zones = computed<MallZoneView[]>(() => {
    const storeMap = new Map(this.stores().map(s => [s.id, s]));
    return FLOOR_ZONES
      .filter(z => z.floor === this.activeFloor())
      .map(z => {
        const store = storeMap.get(z.storeId) ?? null;
        return {
          ...z,
          store,
          cx: z.x + z.w / 2,
          cy: z.y + z.h / 2,
          labelLines: store ? splitLabel(store.name) : [],
        };
      });
  });

  setFloor(floor: Floor): void {
    this.activeFloor.set(floor);
  }

  select(storeId: number): void {
    this.storeSelected.emit(storeId);
  }

  onKeydown(event: KeyboardEvent, storeId: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select(storeId);
    }
  }
}
