// Lógica pura de la nube de Clientela 2.0 (sin red): huellas, mezcla con lo que trae la nube y qué subir.
// `k` (conocidos) guarda la huella de lo último que ya está igual en la nube: {'trips/<id>': huella}.
export const COLECCIONES = ['history', 'clients', 'trips', 'expenses', 'places'];
export const llave = (c, id) => `${c}/${id}`;
export const CFG = 'config/config';

// JSON con llaves ordenadas: la nube (jsonb) reordena las llaves y no debe contar como cambio.
function estable(v) {
  if (Array.isArray(v)) return `[${v.map((x) => estable(x === undefined ? null : x)).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${estable(v[k])}`).join(',')}}`;
  return JSON.stringify(v) ?? 'null';
}
export function hash(o) {
  const s = estable(o);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h);
}

/** Mezcla las filas nuevas de una colección. No toca `lista`: devuelve qué poner y qué quitar. Actualiza `k`. */
export function mezclarColeccion(coll, lista, filas, k) {
  const upsert = [], remove = [];
  const porId = new Map(lista.map((x) => [x.id, x]));
  for (const f of filas) {
    const key = llave(coll, f.id), local = porId.get(f.id);
    if (f.borrado) { if (local) remove.push(f.id); delete k[key]; continue; }
    if (!local) {
      if (key in k) continue; // lo borré aquí después de subirlo: se avisa a la nube al subir
      upsert.push(f.datos); k[key] = hash(f.datos);
      continue;
    }
    const sinCambios = k[key] === hash(local);
    if (sinCambios || (f.datos.updatedAt || 0) >= (local.updatedAt || 0)) {
      if (hash(local) !== hash(f.datos)) upsert.push(f.datos);
      k[key] = hash(f.datos);
    }
  }
  return { upsert, remove };
}

export function aplicarOps(lista, ops) {
  if (!ops || (!ops.upsert.length && !ops.remove.length)) return lista;
  const rm = new Set(ops.remove), up = new Map(ops.upsert.map((x) => [x.id, x]));
  const tenia = new Set(lista.map((x) => x.id));
  const out = lista.filter((x) => !rm.has(x.id)).map((x) => (up.has(x.id) ? up.get(x.id) : x));
  return [...ops.upsert.filter((x) => !tenia.has(x.id)), ...out]; // lo más nuevo va primero
}

/** La configuración es un solo documento. Devuelve la de la nube si debe reemplazar la de aquí; si no, null. */
export function mezclarConfig(local, fila, k, vacio) {
  if (!fila || fila.borrado) return null;
  const hr = hash(fila.datos), hl = hash(local);
  if (!(CFG in k)) { // primera vez en este teléfono: si no había nada, manda la nube; si había datos, mandan los de aquí
    if (!vacio) return null;
    k[CFG] = hr;
    return hr !== hl ? fila.datos : null;
  }
  if (k[CFG] === hl) { k[CFG] = hr; return hr !== hl ? fila.datos : null; } // no la cambié aquí
  return null; // la cambié aquí: se sube
}

/** Qué subir de una colección: lo que cambió y los borrados. */
export function planSubida(coll, lista, k) {
  const filas = [], marcas = {}, borrar = [];
  for (const x of lista) {
    if (!x || !x.id) continue;
    const key = llave(coll, x.id), h = hash(x);
    if (k[key] !== h) { filas.push({ coleccion: coll, id: String(x.id), datos: x, borrado: false }); marcas[key] = h; }
  }
  const vivos = new Set(lista.map((x) => x?.id)), pre = `${coll}/`;
  for (const key of Object.keys(k)) {
    if (key.startsWith(pre) && !vivos.has(key.slice(pre.length))) borrar.push({ coleccion: coll, id: key.slice(pre.length), datos: {}, borrado: true });
  }
  return { filas, marcas, borrar };
}
