// Google Analytics 4 + Pixel da Meta, carregados só depois do consentimento (LGPD).
const GA = import.meta.env.VITE_GA_ID || ''            // ex.: G-XXXXXXX
const PIXEL = import.meta.env.VITE_META_PIXEL_ID || ''  // ex.: 1234567890
export const temMedicao = !!(GA || PIXEL)
const KEY = 'pdc:cookies'
let carregado = false

export function consentimento() { try { return localStorage.getItem(KEY) } catch (e) { return null } }
export function salvarConsentimento(v) { try { localStorage.setItem(KEY, v) } catch (e) { /* ok */ } if (v === 'sim') carregar() }

export function carregar() {
  if (carregado || !temMedicao || consentimento() !== 'sim') return
  carregado = true
  if (GA) {
    const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${GA}`; document.head.appendChild(s)
    window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments) }
    window.gtag('js', new Date()); window.gtag('config', GA, { send_page_view: false })
  }
  if (PIXEL) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    window.fbq('init', PIXEL)
  }
}

// nomes padrão de cada plataforma
const MAPA = {
  pagina: ['page_view', 'PageView'],
  lead: ['generate_lead', 'Lead'],
  cadastro: ['sign_up', 'CompleteRegistration'],
  teste: ['start_trial', 'StartTrial'],
  checkout: ['begin_checkout', 'InitiateCheckout'],
}
export function track(ev, params = {}) {
  if (!carregado) return
  const [g, m] = MAPA[ev] || [ev, ev]
  try { if (GA && window.gtag) window.gtag('event', g, { page_path: location.pathname + location.hash, ...params }) } catch (e) { /* ok */ }
  try { if (PIXEL && window.fbq) window.fbq('track', m, params) } catch (e) { /* ok */ }
}
