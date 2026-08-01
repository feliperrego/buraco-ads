import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import './ui/index.css'
import { criarRoteador } from './ui/rotas/roteador.tsx'

const raiz = document.getElementById('root')

if (!raiz) {
  throw new Error('Elemento #root não encontrado em index.html')
}

const roteador = criarRoteador()

createRoot(raiz).render(
  <StrictMode>
    <RouterProvider router={roteador} />
  </StrictMode>,
)
