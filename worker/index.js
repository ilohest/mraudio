/**
 * Un seul rôle : répondre aux plages d'octets sur /audio/*.
 *
 * Les assets statiques de Cloudflare ignorent l'en-tête `Range` — ils renvoient 200 avec le
 * fichier entier, sans `Accept-Ranges` ni `Content-Range`. Le navigateur en conclut que le flux
 * n'est pas déplaçable (`seekable` vaut [0, 0]) et refuse toute écriture de `currentTime` : le
 * curseur de lecture reste collé au début. En local, le serveur de Vite répond 206, d'où un
 * défaut qui n'existe qu'en ligne.
 *
 * Le Worker ne voit que /audio/* (`run_worker_first` dans wrangler.jsonc) : tout le reste du site
 * est servi directement par la couche d'assets, sans invocation.
 */

/** Une seule plage, sous la forme `bytes=N-M`, `bytes=N-` ou `bytes=-N`. Plusieurs plages
 *  (séparées par des virgules) ne correspondent pas, et reçoivent alors le fichier entier :
 *  c'est permis, et aucun navigateur n'en demande pour de l'audio. */
const ONE_RANGE = /^bytes=(\d*)-(\d*)$/

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD' } })
    }

    // La couche d'assets ne connaît que GET ; le corps est écarté plus bas pour un HEAD.
    const asset = await env.ASSETS.fetch(new Request(request.url, { method: 'GET' }))
    if (!asset.ok) return asset

    const headers = new Headers(asset.headers)
    headers.set('accept-ranges', 'bytes')

    const range = request.headers.get('range')
    const asked = range ? ONE_RANGE.exec(range.trim()) : null

    if (!asked) {
      // Sans plage demandée, le fichier entier — mais en annonçant qu'on sait les servir.
      if (request.method === 'HEAD') {
        asset.body?.cancel()
        return new Response(null, { status: asset.status, headers })
      }
      return new Response(asset.body, { status: asset.status, headers })
    }

    // Il faut la taille du fichier pour borner la plage. L'en-tête est là en production, mais
    // pas sous `wrangler dev` : dans ce cas on lit le corps, qui donne la taille et servira
    // ensuite à découper. Les pistes font de 60 Ko à 7 Mo, elles tiennent en mémoire.
    let total = Number(headers.get('content-length'))
    let bytes = null
    if (!Number.isFinite(total) || total <= 0) {
      bytes = await asset.arrayBuffer()
      total = bytes.byteLength
    }

    const [, from, to] = asked
    let start
    let end
    if (from === '') {
      // `bytes=-N` : les N derniers octets. `bytes=-` ne veut rien dire.
      if (to === '') return unsatisfiable(total, headers)
      start = Math.max(0, total - Number(to))
      end = total - 1
    } else {
      start = Number(from)
      end = to === '' ? total - 1 : Math.min(Number(to), total - 1)
    }
    if (start > end || start >= total) return unsatisfiable(total, headers)

    headers.set('content-range', `bytes ${start}-${end}/${total}`)
    headers.set('content-length', String(end - start + 1))

    if (request.method === 'HEAD') {
      if (!bytes) asset.body?.cancel()
      return new Response(null, { status: 206, headers })
    }

    if (!bytes) bytes = await asset.arrayBuffer()
    return new Response(bytes.slice(start, end + 1), { status: 206, headers })
  },
}

function unsatisfiable(total, headers) {
  const h = new Headers(headers)
  h.set('content-range', `bytes */${total}`)
  h.delete('content-length')
  return new Response(null, { status: 416, headers: h })
}
