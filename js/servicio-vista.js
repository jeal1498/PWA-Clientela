// Tarjeta editable de un servicio frecuente de cliente.
export function createServiceCard({ placeInput, wirePlace, fillRoute, stopsField, placeBar, $, esc, suggestPrice, svcCtx, autoName, mapSvg, money, priceMath, directionsLink }) {
  function serviceCard(sv, onRemove, getClient) {
    const el = document.createElement('section');
    el.className = 'svc';
    el.innerHTML = `<div class="svc-head"><b data-title>${esc(sv.name || 'Servicio nuevo')}</b><button type="button" data-rm>Quitar</button></div>
      <div class="route">${placeInput(sv.a, 'a', 'Punto A · ¿de dónde sale?')}${placeInput(sv.b, 'b', 'Punto B · ¿a dónde va?')}</div>
      <div data-route></div>
      <div class="price-row"><label><span>Tu precio $</span><input data-price type="number" inputmode="numeric" min="0" step="10" value="${sv.price ?? ''}" placeholder="${sv.km ? suggestPrice(sv.km, sv.min, svcCtx(sv)) : ''}"></label><small class="muted">vacío = sugerido</small></div>`;
    sv.stops ||= [];
    const titleEl = $('[data-title]', el);
    let auto = sv.name && sv.name === autoName(sv) ? sv.name : '';
    const priceIn = $('[data-price]', el);
    const routeEl = $('[data-route]', el);
    const st = stopsField($('.route', el), { clientId: () => getClient()?.id, initial: sv.stops, onChange: () => { sv.stops = st.get(); update(); } });
    const update = async () => {
      const r = st.bad() ? await fillRoute(routeEl, null, null) : await fillRoute(routeEl, sv.a, sv.b, sv.stops);
      Object.assign(sv, r ? { km: r.km, min: r.min, path: r.path } : { km: '', min: '', path: null });
      priceIn.placeholder = r ? suggestPrice(r.km, r.min, svcCtx(sv)) : '';
      if (sv.a && sv.b && (!sv.name || sv.name === auto)) { sv.name = auto = autoName(sv); titleEl.textContent = sv.name; }
    };
    for (const which of ['a', 'b']) {
      wirePlace($(`[data-pt=${which}]`, el), () => getClient()?.id, (p, typing) => {
        sv[which] = p;
        if (!typing || !p) update();
      }, sv[which]);
    }
    placeBar($('.route', el), () => getClient()?.id);
    priceIn.oninput = () => { sv.price = priceIn.value === '' ? null : +priceIn.value; };
    $('[data-rm]', el).onclick = onRemove;
    if (sv.a && sv.b) {
      // Ya calculada: dibuja sin volver a pedir la ruta.
      if (sv.path) routeEl.innerHTML = `${mapSvg(sv.path, 'Ruta', sv.stops)}<div class="stats"><div><small>Distancia</small><b>${sv.km} km</b></div><div><small>Tiempo</small><b>${sv.min} min</b></div><div class="price"><small>Sugerido</small><b>${money(suggestPrice(sv.km, sv.min, svcCtx(sv)))}</b></div></div><div class="how">${priceMath(sv.km, sv.min, svcCtx(sv))} · <a href="${directionsLink(sv.a, sv.b, sv.stops)}" target="_blank" rel="noopener">Ver en Google Maps</a></div>`;
      else update();
    } else fillRoute(routeEl, sv.a, sv.b);
    return el;
  }
  return serviceCard;
}
