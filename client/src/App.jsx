import { useState } from 'react'
import './App.css'

const URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

function App() {
  const [result, setResult] = useState('')
  const [campaña, setCampaña] = useState('') // Estado para campaña

  // Función para manejar el envío de mensajes
  const enviarMensajes = async () => {
    try {
      const response = await fetch(`${URL}/enviar-mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaña }), // Enviar el nombre de la campaña
      })
      const data = await response.json()
      setResult(data.message) // Guardar la respuesta en el estado
      console.log(data)
    } catch (error) {
      console.error("Error al enviar mensajes:", error)
      setResult("Error al enviar mensajes.")
    }
  }

  return (
    <div className="App">
      <h1>MERN RENDER</h1>

      {/* Botón para consultar el estado del backend */}
      <button onClick={async() => {
        const res = await fetch(`${URL}/ping`)
        const data = await res.json()
        console.log(data)
        setResult(data.pong)
      }}>
        Test Backend
      </button>

      {/* Input para que el usuario ingrese la campaña */}
      <div>
        <input 
          type="text" 
          placeholder="Ingresa la campaña" 
          value={campaña} 
          onChange={(e) => setCampaña(e.target.value)} 
        />
      </div>

      {/* Botón para enviar los mensajes */}
      <button onClick={enviarMensajes}>
        Enviar Mensajes
      </button>

      <pre>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
}

export default App
