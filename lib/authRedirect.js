export function rememberDestination(){
  if(typeof window==='undefined') return
  const destination=window.location.pathname+window.location.search
  if(destination.startsWith('/app')) sessionStorage.setItem('leve_pending_destination',destination)
}

export function consumeDestination(fallback='/app'){
  if(typeof window==='undefined') return fallback
  const destination=sessionStorage.getItem('leve_pending_destination')
  sessionStorage.removeItem('leve_pending_destination')
  return destination?.startsWith('/app')?destination:fallback
}
