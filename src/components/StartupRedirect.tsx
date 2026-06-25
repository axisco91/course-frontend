import { useEffect } from 'react'
import { useRouter } from 'next/router'

const SESSION_KEY = 'sessionStarted'
const TAB_ID_KEY = 'tabId'

const HEARTBEAT_KEY = 'appHeartbeat' // { tabId, ts }
const HEARTBEAT_EVERY_MS = 5000
const HEARTBEAT_STALE_MS = 15000

function getOrCreateTabId() {
  let id = sessionStorage.getItem(TAB_ID_KEY)
  if (!id) {
    id = (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString()
    sessionStorage.setItem(TAB_ID_KEY, id)
  }

  return id
}

export default function StartupRedirect() {
  const router = useRouter()

  // 1️⃣ Heartbeat por pestaña
  useEffect(() => {
    if (typeof window === 'undefined') return

    const tabId = getOrCreateTabId()

    const beat = () => {
      localStorage.setItem(HEARTBEAT_KEY, JSON.stringify({ tabId, ts: Date.now() }))
    }

    beat()
    const id = setInterval(beat, HEARTBEAT_EVERY_MS)

    return () => clearInterval(id)
  }, [])

  // 2️⃣ Redirección SOLO al reabrir navegador
  useEffect(() => {
    if (!router.isReady) return
    if (typeof window === 'undefined') return

    const path = router.asPath.split('?')[0]

    // 🔒 SOLO decidir en la entrada de la app
    const isEntry = path === '/' || path === '/home'
    if (!isEntry) return

    const isLogged = !!localStorage.getItem('accessToken')
    const defaultRoute = localStorage.getItem('defaultRoute')

    if (!isLogged || !defaultRoute) return
    if (defaultRoute === path) return

    const sessionStarted = sessionStorage.getItem(SESSION_KEY)
    const tabId = getOrCreateTabId()

    // ¿Hay otra pestaña viva?
    let anotherTabLikelyOpen = false
    try {
      const raw = localStorage.getItem(HEARTBEAT_KEY)
      if (raw) {
        const hb = JSON.parse(raw)
        if (hb?.ts && hb?.tabId) {
          const fresh = Date.now() - hb.ts < HEARTBEAT_STALE_MS
          const otherTab = hb.tabId !== tabId
          anotherTabLikelyOpen = fresh && otherTab
        }
      }
    } catch {}

    // Marca sesión para que refresh NO redirija
    if (!sessionStarted) sessionStorage.setItem(SESSION_KEY, '1')

    // ✅ Solo primera carga REAL (reabrir navegador)
    if (!sessionStarted && !anotherTabLikelyOpen) {
      router.replace(defaultRoute)
    }
  }, [router.isReady, router.asPath])

  return null
}
