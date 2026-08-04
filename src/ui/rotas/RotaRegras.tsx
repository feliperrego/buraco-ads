import { usePartidaEmCurso } from '../../estado/partida-em-curso.ts'
import TelaRegras from '../telas/TelaRegras.tsx'

/**
 * A rota `/regras`, e o único motivo de ela existir como componente próprio: o
 * rótulo do link de volta depende de haver partida em curso.
 *
 * A verificação no navegador achou isto. O link dizia *"Voltar ao início"* e
 * levava para `/partida`, porque a `RotaInicial` redireciona quando existe
 * partida. Não estava errado no destino — estava errado no **texto**, e é
 * exatamente o defeito que a `CA-S84-1` deixou passar na H7: o critério conferia
 * o dado e não a frase.
 *
 * A tela continua sem saber o que é uma partida (T6): ela recebe um booleano.
 */
export default function RotaRegras() {
  const { partida } = usePartidaEmCurso()

  return <TelaRegras emPartida={partida !== null} />
}
