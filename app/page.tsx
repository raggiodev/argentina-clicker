"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { argentineContent } from "@/lib/content"
import { upgrades } from "@/lib/upgrades"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { MouseIcon as Mate, Plus, Volume2, VolumeX, Trash2, Heart, ExternalLink } from "lucide-react"
import { Progress } from "@/components/ui/progress"

// Definimos un sonido simple usando la API Web Audio
const createClickSound = (audioContext: AudioContext, frequency = 400) => {
  // Crear un oscilador para generar un tono
  const oscillator = audioContext.createOscillator()
  oscillator.type = "sine"
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)

  // Crear un nodo de ganancia para controlar el volumen
  const gainNode = audioContext.createGain()
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

  // Conectar los nodos
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // Iniciar y detener el oscilador
  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.2)
}

// Constante para el límite de clicks para terminar el juego
const GAME_COMPLETION_CLICKS = 5000

export default function Home() {
  const [clicks, setClicks] = useState(0)
  const [autoClicksPerSecond, setAutoClicksPerSecond] = useState(0)
  const [clickMultiplier, setClickMultiplier] = useState(1)
  const [items, setItems] = useState<
    Array<{
      id: number
      content: string
      type: string
      x: number
      y: number
      rotation: number
      scale: number
    }>
  >([])
  const [unlockedUpgrades, setUnlockedUpgrades] = useState<string[]>([])
  const [insanityLevel, setInsanityLevel] = useState(1)
  const [muted, setMuted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [lastSoundTime, setLastSoundTime] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({})
  const { toast } = useToast()

  // Inicializar el contexto de audio
  useEffect(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      try {
        // La API AudioContext está disponible en la mayoría de los navegadores modernos
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          audioContextRef.current = new AudioContext()
        }
      } catch (error) {
        console.error("Error al crear el contexto de audio:", error)
      }
    }

    return () => {
      // Limpiar el contexto de audio al desmontar
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
      }
    }
  }, [])

  // Inicializar elementos de audio para frases específicas
  useEffect(() => {
    if (typeof window === "undefined") return

    // Crear elementos de audio para frases específicas
    const audioElements: { [key: string]: HTMLAudioElement } = {}

    // Aquí puedes añadir más frases con sus respectivos audios
    const phrasesWithAudio = [
      { phrase: "Qué mirá bobo! Andá pa' allá!", audioUrl: "/sounds/que-mira-bobo.mp3" },
      { phrase: "Vamos Messi!", audioUrl: "/sounds/vamos-messi.mp3" },
      { phrase: "La mano de Dios!", audioUrl: "/sounds/mano-de-dios.mp3" },
      { phrase: "Sos inimputable, hermano!", audioUrl: "/sounds/inimputable.mp3" },
      { phrase: "Andate a la B!", audioUrl: "/sounds/andate-a-la-b.mp3" },
    ]

    phrasesWithAudio.forEach((item) => {
      const audio = new Audio()
      audio.src = item.audioUrl
      audio.preload = "auto"
      audioElements[item.phrase] = audio
    })

    audioElementsRef.current = audioElements

    return () => {
      // Limpiar los elementos de audio
      Object.values(audioElements).forEach((audio) => {
        audio.pause()
        audio.src = ""
      })
    }
  }, [])

  // Reproducir sonido con limitación de frecuencia
  const playSound = (content?: string) => {
    if (muted) return

    const now = Date.now()
    // Solo reproducir sonido si han pasado al menos 100ms desde el último sonido
    if (now - lastSoundTime > 100) {
      try {
        // Si hay un contenido específico y tiene un audio asociado, reproducirlo
        if (content && audioElementsRef.current[content]) {
          const audio = audioElementsRef.current[content]
          // Reiniciar el audio si ya estaba reproduciéndose
          audio.currentTime = 0
          audio.play().catch((err) => {
            console.error("Error al reproducir audio específico:", err)
            // Si falla, reproducir el sonido genérico
            playGenericSound()
          })
        } else {
          // Si no hay audio específico, reproducir el sonido genérico
          playGenericSound()
        }

        setLastSoundTime(now)
      } catch (error) {
        console.error("Error al reproducir sonido:", error)
      }
    }
  }

  // Reproducir sonido genérico
  const playGenericSound = () => {
    if (!audioContextRef.current) return

    // Crear un sonido simple con frecuencia basada en insanityLevel
    const baseFrequency = 300 + insanityLevel * 20
    const randomFrequency = baseFrequency + Math.random() * 200
    createClickSound(audioContextRef.current, randomFrequency)
  }

  // Auto-clicker effect
  useEffect(() => {
    if (autoClicksPerSecond <= 0 || gameCompleted) return

    const interval = setInterval(() => {
      addItem()
      const newClicks = clicks + clickMultiplier
      setClicks(newClicks)

      // Verificar si se ha completado el juego
      if (newClicks >= GAME_COMPLETION_CLICKS && !gameCompleted) {
        completeGame()
      }
    }, 1000 / autoClicksPerSecond)

    return () => clearInterval(interval)
  }, [autoClicksPerSecond, clickMultiplier, clicks, gameCompleted])

  const addItem = () => {
    if (!containerRef.current || gameCompleted) return

    const containerWidth = containerRef.current.offsetWidth
    const containerHeight = containerRef.current.offsetHeight

    // Get random position within the container
    const x = Math.random() * (containerWidth - 150)
    const y = Math.random() * (containerHeight - 150)

    // Get random content
    const contentIndex = Math.floor(Math.random() * argentineContent.length)
    const content = argentineContent[contentIndex]

    // Scale based on insanity level
    const baseScale = 0.5 + Math.random() * 0.5
    const insanityScale = 1 + (insanityLevel - 1) * 0.1

    // Add new item with random position and rotation
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        content: content.content,
        type: content.type,
        x,
        y,
        rotation: Math.random() * 30 - 15,
        scale: baseScale * insanityScale,
      },
    ])

    // Reproducir sonido específico si existe
    playSound(content.content)
  }

  const handleClick = () => {
    if (gameCompleted) return

    // Add visual item
    addItem()

    // Increment click counter with multiplier
    const newClicks = clicks + clickMultiplier
    setClicks(newClicks)

    // Check for insanity level increase
    const newLevel = Math.floor(newClicks / 10) + 1
    if (newLevel > insanityLevel) {
      setInsanityLevel(newLevel)
      toast({
        title: "Nivel de locura " + newLevel + "!",
        description: "Las cosas se están poniendo más intensas, che!",
      })
    }

    // Check for unlockable upgrades
    upgrades.forEach((upgrade) => {
      if (!unlockedUpgrades.includes(upgrade.id) && newClicks >= upgrade.unlockAt) {
        setUnlockedUpgrades((prev) => [...prev, upgrade.id])
        toast({
          title: "Nuevo potenciador desbloqueado!",
          description: upgrade.name,
        })
      }
    })

    // Check if game is completed
    if (newClicks >= GAME_COMPLETION_CLICKS && !gameCompleted) {
      completeGame()
    }
  }

  const completeGame = () => {
    setGameCompleted(true)
    // Limpiar los elementos visuales para la pantalla final
    setItems([])
    // Reproducir un sonido de victoria
    if (audioContextRef.current && !muted) {
      // Secuencia de sonidos para victoria
      const now = audioContextRef.current.currentTime
      createClickSound(audioContextRef.current, 523.25) // Do
      setTimeout(() => createClickSound(audioContextRef.current, 659.25), 200) // Mi
      setTimeout(() => createClickSound(audioContextRef.current, 783.99), 400) // Sol
      setTimeout(() => createClickSound(audioContextRef.current, 1046.5), 600) // Do (octava superior)
    }
  }

  const purchaseUpgrade = (upgradeId: string) => {
    if (gameCompleted) return

    const upgrade = upgrades.find((u) => u.id === upgradeId)
    if (!upgrade) return

    if (clicks >= upgrade.cost) {
      setClicks((prev) => prev - upgrade.cost)

      // Apply upgrade effect
      if (upgrade.type === "multiplier") {
        setClickMultiplier((prev) => prev + upgrade.value)
      } else if (upgrade.type === "autoclick") {
        setAutoClicksPerSecond((prev) => prev + upgrade.value)
      }

      // Remove from available upgrades
      setUnlockedUpgrades((prev) => prev.filter((id) => id !== upgradeId))

      toast({
        title: "Potenciador comprado!",
        description: upgrade.name,
      })
    } else {
      toast({
        title: "No tenés suficientes clicks!",
        description: "Necesitás " + upgrade.cost + " clicks para comprar este potenciador.",
        variant: "destructive",
      })
    }
  }

  const toggleMute = () => {
    setMuted((prev) => !prev)
  }

  // Limitar la cantidad de elementos en pantalla para mejorar el rendimiento
  useEffect(() => {
    if (items.length > 200) {
      setItems((prev) => prev.slice(-200))
    }
  }, [items])

  // Función para limpiar la pantalla
  const clearScreen = () => {
    setItems([])
    toast({
      title: "Pantalla limpiada!",
      description: "Ahora podés seguir haciendo click con más espacio.",
    })
  }

  // Reiniciar el juego
  const restartGame = () => {
    setClicks(0)
    setAutoClicksPerSecond(0)
    setClickMultiplier(1)
    setItems([])
    setUnlockedUpgrades([])
    setInsanityLevel(1)
    setGameCompleted(false)
    toast({
      title: "Juego reiniciado!",
      description: "Empezá de nuevo y divertite!",
    })
  }

  if (gameCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 text-white">
        {/* Pantalla de victoria - Todo en una misma página sin superposiciones */}
        <div className="text-center max-w-2xl mx-auto px-4 py-12 animate-fade-in">
          {/* Bandera Argentina con corazón */}
          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-40">
              <div className="absolute inset-0 bg-sky-200 w-full h-1/3"></div>
              <div className="absolute inset-0 top-1/3 bg-white w-full h-1/3"></div>
              <div className="absolute inset-0 top-2/3 bg-sky-200 w-full h-1/3"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="text-red-500 w-16 h-16 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Mensaje de victoria */}
          <h1 className="text-4xl font-bold mb-2">¡Lo lograste!</h1>
          <p className="text-xl mb-6">Completaste el Argentina Clicker con {clicks} clicks</p>
          <p className="text-lg mb-8">Gracias por jugar a este juego absurdo y divertido</p>

          {/* Botón para reiniciar */}
          <Button onClick={restartGame} className="bg-white text-blue-600 hover:bg-blue-100 mb-12">
            Jugar de nuevo
          </Button>

          {/* Créditos - Ahora en la misma página, no superpuestos */}
          <div className="mt-8 py-8 bg-purple-900 rounded-lg">
            <h2 className="text-5xl font-bold mb-6 text-white">raggiodev</h2>
            <a
              href="https://raggiodev-portfolio.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-white hover:text-blue-300 transition-colors"
            >
              <span className="text-xl">Portfolio</span>
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-sky-400 to-sky-600">
      {/* Background with subtle Argentine flag pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-1/3 bg-sky-200"></div>
        <div className="w-full h-1/3 bg-white"></div>
        <div className="w-full h-1/3 bg-sky-200"></div>
      </div>

      {/* Items that appear on click - LOWER Z-INDEX */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute transition-all duration-300 ease-out"
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
              transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
              zIndex: 10, // Bajo z-index para que no tape los controles
            }}
          >
            {item.type === "text" ? (
              <div className="p-2 bg-white/80 rounded shadow-lg text-lg font-bold text-blue-900">{item.content}</div>
            ) : item.type === "image" ? (
              <div className="w-32 h-32 relative rounded-md overflow-hidden shadow-lg">
                <Image
                  src={item.content || "/placeholder.svg?height=100&width=100"}
                  alt="Contenido argentino"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="p-3 bg-blue-500 text-white rounded-full shadow-lg text-2xl">{item.content}</div>
            )}
          </div>
        ))}
      </div>

      {/* UI CONTROLS - HIGHER Z-INDEX */}
      <div className="relative z-50 w-full h-full" ref={containerRef}>
        {/* Sound toggle and clear screen buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button onClick={clearScreen} variant="outline" size="icon" className="bg-white/80">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button onClick={toggleMute} variant="outline" size="icon" className="bg-white/80">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Upgrades panel - Z-INDEX AUMENTADO */}
        <div className="absolute top-4 left-4 bg-white/90 p-4 rounded-lg shadow-lg max-w-xs max-h-[80vh] overflow-auto z-[100]">
          <h2 className="text-xl font-bold mb-2 text-blue-900">Potenciadores</h2>

          {unlockedUpgrades.length === 0 ? (
            <p className="text-sm text-gray-500">Seguí haciendo clicks para desbloquear potenciadores!</p>
          ) : (
            <div className="space-y-2">
              {unlockedUpgrades.map((id) => {
                const upgrade = upgrades.find((u) => u.id === id)
                if (!upgrade) return null

                return (
                  <div key={id} className="border p-2 rounded">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{upgrade.name}</h3>
                      <Button size="sm" onClick={() => purchaseUpgrade(id)} disabled={clicks < upgrade.cost}>
                        {upgrade.cost} <Plus className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">{upgrade.description}</p>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Multiplicador: x{clickMultiplier}</span>
              <span>Auto-clicks: {autoClicksPerSecond}/s</span>
            </div>
            <div className="text-sm mb-1">
              <span>Nivel de locura: {insanityLevel}</span>
            </div>
            <Progress value={(clicks % 10) * 10} className="h-2" />
            <div className="mt-2 text-xs text-gray-600 text-center">
              Meta: {clicks}/{GAME_COMPLETION_CLICKS} clicks
            </div>
          </div>
        </div>

        {/* Click button */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-[90]">
          <div className="bg-white/80 px-4 py-2 rounded-full font-bold text-blue-900">{clicks} clicks</div>
          <Button
            onClick={handleClick}
            className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-6 text-xl rounded-full shadow-lg flex items-center gap-2"
            style={{
              transform: `scale(${1 + (insanityLevel - 1) * 0.05})`,
              transition: "transform 0.3s ease",
            }}
          >
            <Mate className="w-6 h-6" />
            <span>Hacé click, che!</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
