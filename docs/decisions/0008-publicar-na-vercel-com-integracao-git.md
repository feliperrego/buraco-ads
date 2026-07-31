# ADR-0008 — Publicar na Vercel com integração Git

- **Status:** Aceita
- **Data:** 2026-07-31
- **Relacionada a:** [roadmap.md](../roadmap.md) §1 tarefas 0.8a e 0.8 · [requirements.md](../requirements.md) RNF4.1, RNF4.2 · [ADR-0005](0005-manter-tanstack-router.md)

## Contexto

O jogo é inteiramente estático. A RNF4.1 estabelece que não há backend, banco nem contas, e o
build produz apenas HTML, JS e CSS num diretório. Qualquer servidor de arquivos serviria.

Três fatos tornam a decisão necessária agora, antes da tarefa 0.7:

**O roteador cria o problema do deep link.** O ADR-0005 manteve o TanStack Router para as
quatro telas. Roteamento de cliente sem *fallback* no servidor significa que abrir uma URL
direto — ou simplesmente recarregar a página — devolve 404, porque o arquivo daquele caminho
não existe no disco do servidor.

**Não havia remoto.** Até 2026-07-31 este repositório era local. `git remote -v` voltava
vazio. Isso significa que o workflow do GitHub Actions da tarefa 0.6 **nunca foi executado**,
nem uma vez — não por descuido na verificação, mas por não existir destino para o push.

**O preview local não prova a hospedagem.** Medido nesta máquina em 2026-07-31, com o `dist/`
já construído:

```
$ curl -s -i http://localhost:4399/uma-rota-que-nao-existe | head -3
HTTP/1.1 200 OK
Vary: Origin
Content-Type: text/html
```

O `vite preview` faz *fallback* de SPA por conta própria. Ele devolve 200 com ou sem
configuração de hospedagem, e portanto **não consegue distinguir a configuração correta da
configuração ausente**. Qualquer verificação de deep link feita localmente é um falso
positivo.

## Decisão

Publicar na **Vercel**, por **integração Git** a partir de um repositório no GitHub. O deep
linking é habilitado por um *rewrite* em `vercel.json`, e verificado contra a URL publicada —
nunca localmente.

## Consequências

**Positivas**

- **Um push faz as duas coisas:** roda o CI da tarefa 0.6 e publica. Criar o remoto destrava
  uma tarefa que estava concluída no disco e inexistente na prática.
- **Preview por PR.** Cada pull request ganha URL própria, o que dá onde rodar a verificação
  do *rewrite* sem tocar em produção.
- **Preset de Vite auto-detectado.** Nenhum comando de build configurado à mão: a Vercel
  encontra o `npm run build` que já existe.
- **O sistema de arquivos tem precedência sobre os *rewrites*.** Um *rewrite* de `/(.*)` não
  quebra `/assets/*`, porque arquivos existentes são servidos antes de a regra ser aplicada.
- **Uma URL de verdade destrava a RNF3.1.** Testar em celular exige endereço acessível; não
  dá para provar toque e telas pequenas em `localhost`.

**Negativas**

- **Plataforma proprietária para servir HTML estático.** Não há nada aqui que exija Vercel.
  A escolha é de conveniência, não de necessidade, e vale reconhecer isso.
- **O *rewrite* é configuração que só existe em produção.** Nenhum verificador local o cobre,
  e o `vite preview` mente sobre ele (medido acima). É a única parte do projeto cuja prova
  não cabe em `npm run verificar`.
- **O código passa a estar num terceiro.** Repositório no GitHub, build na Vercel.
- **A RNF4.2 passa a depender de disciplina, não de ferramenta.** Vercel Analytics e Speed
  Insights são um clique no painel e enviariam dados de uso para fora do navegador. Ficam
  desligados, mas nada no repositório impede que sejam ligados — ao contrário da regra de
  dependência, que é imposta por lint.

**Neutras**

- Trocar de plataforma custa apagar o `vercel.json` e escrever o equivalente do concorrente.
  A decisão é barata de reverter.
- A Vercel roda apenas `npm run build`. O `npm run verificar`, com os dois verificadores
  Python, continua exclusivo do CI. São papéis distintos e não devem ser duplicados.

## Alternativas consideradas

- **Netlify** — equivalente em tudo que importa aqui; o *fallback* seria `_redirects` ou
  `netlify.toml` em vez de `vercel.json`. Rejeitada por não oferecer nada que justifique
  divergir do que já havia sido acordado.
- **Cloudflare Pages** — tem *fallback* de SPA nativo, sem arquivo de configuração. É uma
  vantagem real, porém pequena, e ela tem um lado ruim: uma configuração a menos é também
  uma configuração a menos para verificar explicitamente.
- **GitHub Pages** — não exigiria conta nova, já que o repositório vai para o GitHub de
  qualquer forma. Rejeitada por contaminar a tarefa 0.7: páginas de projeto são servidas em
  subcaminho (`/buraco-ads/`), o que obriga a configurar `base` no Vite **e** `basepath` no
  roteador. Além disso, o *fallback* de SPA no Pages é o truque de copiar o `index.html` para
  `404.html`, que responde com status 404 e corpo de página — errado para navegador e para
  robô.
- **`vercel deploy` pela CLI, sem Git** — publicaria o jogo sem exigir remoto. Rejeitada
  justamente por isso: deixaria a tarefa 0.6 sem prova, e abriria mão do preview por PR, que
  é o mecanismo de verificação do *rewrite*.
- **Não publicar ainda** — rejeitada. A RNF3.1 exige funcionar em celular, e isso não se
  verifica sem endereço acessível. Adiar significaria descobrir problemas de hospedagem
  junto com problemas de roteamento, no Marco VI, com as duas causas misturadas.

## Nota de verificação

O *rewrite* é verificado **forçando a falha primeiro**, conforme a invariante 5 do
`CLAUDE.md`: o primeiro deploy vai ao ar **sem** `vercel.json`, e uma rota qualquer deve
devolver 404. Só então o arquivo entra, e a mesma rota deve devolver 200 com `text/html`.

Sem o passo do 404, não saberíamos se o 200 vem do *rewrite* ou de um comportamento padrão da
plataforma — e o arquivo poderia ser cerimônia. Este ADR só se sustenta se o 404 aparecer.

## Nota para o futuro

Se este ADR estiver sendo lido porque passou a existir servidor: o motivo da decisão foi o
build ser **estático e sem estado de servidor** (RNF4.1), não qualquer objeção às
alternativas. Caindo essa premissa, reabrir é o caminho correto.

A mesma premissa sustenta o [ADR-0004](0004-remover-tanstack-query.md). Os dois caem juntos,
e quem reabrir um deve reabrir o outro.
