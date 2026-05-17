import { Role } from '../models/models';

export interface NavLink {
  path: string;
  label: string;
  exact?: boolean;
  unreadBadge?: boolean;
}

export const MAIN_NAV_LINKS: NavLink[] = [
  { path: '/', label: 'Inicio', exact: true },
  { path: '/tiendas', label: 'Tiendas' },
  { path: '/buscar', label: 'Productos' },
  { path: '/envio', label: 'Envío' }
];

export const FOOTER_NAV_LINKS: NavLink[] = [
  { path: '/', label: 'Inicio', exact: true },
  { path: '/tiendas', label: 'Tiendas' },
  { path: '/buscar', label: 'Buscar productos' },
  { path: '/politicas-envio', label: 'Políticas de envío' }
];

export const FOOTER_SUPPORT_LINKS: NavLink[] = [
  { path: '/ayuda', label: 'Ayuda y FAQ' },
  { path: '/politicas-envio', label: 'Políticas de envío' },
  { path: '/devoluciones', label: 'Devoluciones' },
  { path: '/contacto', label: 'Contacto' },
  { path: '/terminos', label: 'Términos de uso' },
  { path: '/privacidad', label: 'Privacidad' }
];

export function getRoleNavLinks(role: Role | undefined): NavLink[] {
  switch (role) {
    case 'CLIENTE':
      return [
        { path: '/pedidos', label: 'Mis pedidos' },
        { path: '/chats', label: 'Chats', unreadBadge: true }
      ];
    case 'VENDEDOR':
      return [{ path: '/vendedor', label: 'Mi panel' }];
    case 'REPARTIDOR':
      return [
        { path: '/repartidor', label: 'Mi panel' },
        { path: '/repartidor/chats', label: 'Chats', unreadBadge: true }
      ];
    case 'PROVEEDOR':
      return [
        { path: '/proveedor', label: 'Mi panel' },
        { path: '/proveedor/chats', label: 'Chats', unreadBadge: true }
      ];
    case 'ADMIN':
      return [{ path: '/admin', label: 'Panel Admin' }];
    default:
      return [];
  }
}
