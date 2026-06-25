import { useEffect, useState } from 'react'

const useLoadScript = (url: string) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const existingScript = document.querySelector(`script[src="${url}"]`)

    if (existingScript) {
      setLoaded(true)
    } else {
      const script = document.createElement('script')
      script.src = url
      script.async = true
      script.defer = true

      script.onload = () => setLoaded(true)
      script.onerror = () => console.error(`Failed to load script ${url}`)

      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
      }
    }
  }, [url])

  return loaded
}

export default useLoadScript
