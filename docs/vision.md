# Visão

> Status: **rascunho para revisão**
> Última atualização: 2026-07-28

## 1. Propósito

Construir um jogo de **Buraco (Canastra)** jogável no navegador, com regras completas e corretas, interface moderna e um oponente controlado por IA.

O projeto tem um segundo propósito, igualmente importante: servir como **estudo prático de Spec-Driven Development (SDD)**. Cada linha de código deve ser rastreável até uma especificação escrita antes dela.

Quando os dois propósitos entrarem em conflito, **o aprendizado vence**. Preferimos um jogo menor e bem especificado a um jogo maior construído às pressas.

## 2. Para quem

**Usuário primário:** uma pessoa que conhece Buraco e quer jogar uma partida rápida contra o computador, sozinha, sem cadastro e sem conexão com servidor.

**Usuário secundário:** nós — o projeto precisa ser legível, testável e evoluível por quem chegar depois.

## 3. O que é

- Um jogo de Buraco **Aberto**, no formato **1 contra 1** (ver [ADR-0001](decisions/0001-variante-buraco-aberto.md) e [ADR-0002](decisions/0002-formato-individual-1v1.md))
- Executado inteiramente no navegador, sem backend
- Com uma **engine de regras independente de framework**, reutilizável no futuro por mobile, multiplayer ou servidor
- Com um oponente de IA que joga de forma competente e explicável

## 4. O que NÃO é (escopo negativo)

Esta seção é tão importante quanto a anterior. Ela nos protege de crescer sem decidir.

A v1 **não terá**:

- Multiplayer online ou jogo entre humanos
- Contas de usuário, login ou perfil
- Backend, banco de dados ou API
- Partidas em duplas (2 contra 2)
- Outras variantes de Buraco (Fechado, STBL, Canastra)
- Ranking, conquistas, moedas, monetização
- Chat, emotes ou qualquer recurso social
- Aplicativo mobile nativo

Nenhum destes itens está descartado para sempre. Todos estão **fora da v1**, e a arquitetura deve tornar cada um possível sem reescrita — sem, no entanto, construí-los antecipadamente.

## 5. Critérios de sucesso

O projeto é bem-sucedido quando:

1. Uma partida completa de Buraco Aberto pode ser jogada do início ao fim, com pontuação correta, contra a IA
2. Todas as regras implementadas estão escritas em `rules.md` **antes** de existirem em código
3. A engine é testada de forma independente e cada teste referencia a regra que valida
4. A engine não importa nada de React, do DOM ou de qualquer biblioteca de UI
5. Conseguimos explicar, para cada decisão relevante, por que ela foi tomada — porque está registrada em `decisions/`

## 6. Princípios que nos guiam

- **Especificação antes de código.** Sem exceção.
- **Simplicidade antes de flexibilidade.** Abstração só depois de existir um caso concreto funcionando.
- **Escopo negativo explícito.** Recusar é uma decisão de projeto, e decisões se registram.
- **Nenhuma regra do jogo é assumida.** Se não está em `rules.md`, não existe.

## 7. Questões resolvidas

Decidido em 2026-07-28. Estes pontos entram em `requirements.md` como requisitos.

- **Offline / PWA:** não é necessário. O jogo roda com a página carregada; não haverá
  service worker nem instalação.
- **Persistência da partida:** não haverá. Um refresh perde o progresso. A interface deve
  **avisar antes de fechar ou recarregar** a janela com partida em andamento.
- **Dificuldade da IA:** um único nível na v1. Sem seletor de dificuldade.

Consequência arquitetural: sem persistência e sem backend, a v1 não tem camada de
infraestrutura. O estado vive em memória durante a sessão. A engine deve, ainda assim,
manter o estado da partida **serializável**, para que persistência e multiplayer sejam
adições futuras e não reescritas.
