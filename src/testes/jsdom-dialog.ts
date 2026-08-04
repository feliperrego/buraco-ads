/**
 * O `<dialog>` do jsdom não tem `showModal` nem `close`, e a S154 escolheu o
 * elemento nativo justamente pelo que o **navegador** faz com ele: foco preso e
 * `Esc`. Sem este arquivo, o código de produção precisaria de um `if (typeof
 * dialogo.showModal === 'function')` — uma checagem que existe só por causa do
 * ambiente de teste, escrita dentro do que vai para o ar.
 *
 * O remendo mora aqui, na infraestrutura, e cobre o mínimo: abrir e fechar
 * refletindo o atributo `open`, que é o que dá ao elemento o papel `dialog` e o
 * torna visível para as consultas por papel.
 *
 * **O que ele não prova.** Foco preso e `Esc` continuam sendo comportamento de
 * plataforma, e nenhum teste em jsdom os alcança. Quem os verifica é rodar o app
 * — que é o passo 6 do ciclo, e a rede que já achou defeito em cinco fatias.
 */

type DialogoRemendado = HTMLDialogElement & { _aberto?: boolean }

// A checagem é em tempo de execução de propósito: o `lib.dom` **declara**
// `showModal`, e o jsdom não a implementa. O `tsc` acha que ela sempre existe.
const prototipo = HTMLDialogElement.prototype as Partial<HTMLDialogElement>

if (prototipo.showModal === undefined) {
  HTMLDialogElement.prototype.showModal = function abrir(this: DialogoRemendado) {
    this.setAttribute('open', '')
  }

  HTMLDialogElement.prototype.show = function abrirSemModal(this: DialogoRemendado) {
    this.setAttribute('open', '')
  }

  HTMLDialogElement.prototype.close = function fechar(this: DialogoRemendado, retorno?: string) {
    this.removeAttribute('open')

    if (retorno !== undefined) {
      this.returnValue = retorno
    }

    this.dispatchEvent(new Event('close'))
  }
}
