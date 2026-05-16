import { Component, computed, effect, input, output, signal } from '@angular/core';
import { Store } from '../../models/models';

export type Floor = 'baja' | 'alta';
type ZoneFloor = Floor | 'all';

interface MallLabel {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface MallZone {
  storeId: number;
  floor: ZoneFloor;
  points: string;
  label: MallLabel;
}

export interface MallZoneView extends MallZone {
  store: Store | null;
}

const FLOOR_ZONES: MallZone[] = [
  // Franja superior de tiendas (visibles desde exterior).
  {
    floor: 'all',
    storeId: 8,
    points: '104,16 170,16 170,70 104,70',
    label: { x: 114, y: 26, w: 46, h: 34 },
  },
  {
    floor: 'all',
    storeId: 6,
    points: '172,16 295,16 295,82 172,82',
    label: { x: 198, y: 34, w: 72, h: 30 },
  },
  {
    floor: 'all',
    storeId: 10,
    points: '366,12 408,12 408,112 366,112',
    label: { x: 372, y: 35, w: 30, h: 54 },
  },
  {
    floor: 'all',
    storeId: 7,
    points: '482,26 542,26 542,116 482,116',
    label: { x: 489, y: 57, w: 46, h: 28 },
  },
  // Zona de restaurantes (aparcamiento central).
  {
    floor: 'all',
    storeId: 4,
    points: '404,188 464,188 464,264 404,264',
    label: { x: 412, y: 212, w: 44, h: 28 },
  },
  //mcdonalds
  {
    floor: 'all',
    storeId: 1,
    points: '500,202 567,202 567,274 500,274',
    label: { x: 507, y: 224, w: 52, h: 28 },
  },
  // Edificio independiente derecho (Decathlon).
  {
    floor: 'all',
    storeId: 9,
    points: '800,170 943,170 943,264 800,264',
    label: { x: 831, y: 199, w: 80, h: 36 },
  },

  // Edificio central izquierdo — cambia según planta.
  {
    floor: 'alta',
    storeId: 2,
    points: '130,178 254,178 254,248 130,248',
    label: { x: 158, y: 196, w: 68, h: 34 },
  },
  {
    floor: 'alta',
    storeId: 3,
    points: '130,102 254,102 254,162 130,162',
    label: { x: 164, y: 115, w: 56, h: 34 },
  },
  {
    floor: 'baja',
    storeId: 5,
    points: '56,164 230,164 230,262 56,262',
    label: { x: 106, y: 198, w: 74, h: 30 },
  },
];

function toRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return `rgba(239, 68, 68, ${alpha})`;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
    const storeMap = new Map(this.stores().map(s => [s.id, s] as const));
    return FLOOR_ZONES
      .filter(zone => zone.floor === 'all' || zone.floor === this.activeFloor())
      .map(zone => {
        const store = storeMap.get(zone.storeId) ?? null;
        return {
          ...zone,
          store,
        };
      });
  });

  constructor() {
    effect(() => {
      const selectedId = this.selectedId();
      if (selectedId == null) return;

      const selectedZone = FLOOR_ZONES.find(zone => zone.storeId === selectedId && zone.floor !== 'all');
      if (selectedZone) {
        const targetFloor = selectedZone.floor;
        if (targetFloor !== 'all' && this.activeFloor() !== targetFloor) {
          this.activeFloor.set(targetFloor);
        }
      }
    });
  }

  setFloor(floor: Floor): void {
    this.activeFloor.set(floor);
  }

  zoneFill(store: Store | null): string {
    return store?.color ? toRgba(store.color, 0.12) : 'rgba(239, 68, 68, 0.10)';
  }

  zoneStroke(store: Store | null): string {
    return store?.color ?? '#ef4444';
  }

  labelFill(store: Store | null): string {
    return store?.logoUrl ? 'rgba(255, 255, 255, 0.98)' : (store?.color ? toRgba(store.color, 0.18) : 'rgba(255, 255, 255, 0.98)');
  }

  logoUrl(store: Store | null): string | null {
    return store?.logoUrl ?? null;
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
