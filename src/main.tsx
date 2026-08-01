import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/index.css'
import Aplicacao from './ui/Aplicacao.tsx'

const raiz = document.getElementById('root')

if (!raiz) {
  throw new Error('Elemento #root não encontrado em index.html')
}

createRoot(raiz).render(
  <StrictMode>
    <Aplicacao />
  </StrictMode>,
)
