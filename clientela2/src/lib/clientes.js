// Cliente nuevo sin ir a Clientes: si escribes nombre (y teléfono) al agendar o registrar, se guarda solo.
/** Devuelve { clientId, clientName }; crea el cliente si el nombre no existe todavía. */
export function ensureClient(clients, add, { clientId, clientName, clientPhone }) {
  const name = (clientName || '').trim();
  if (clientId || !name) return { clientId: clientId || '', clientName: name };
  const hit = clients.find((c) => c.name.trim().toLowerCase() === name.toLowerCase());
  if (hit) return { clientId: hit.id, clientName: hit.name };
  const c = add('clients', { name, phone: (clientPhone || '').trim(), notes: '', discount: '', routes: [] });
  return { clientId: c?.id || '', clientName: name };
}
