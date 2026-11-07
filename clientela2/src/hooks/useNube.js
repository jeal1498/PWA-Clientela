// Estado de la cuenta y la nube para las pantallas.
import { useSyncExternalStore } from 'react';
import { suscribir, haySesion, instantanea } from '../lib/nube.js';

/** ¿Hay sesión de Google en este teléfono? */
export const useSesion = () => useSyncExternalStore(suscribir, haySesion);
/** Estado completo de la nube (cambia en cada sincronización). */
export const useNube = () => useSyncExternalStore(suscribir, instantanea);
