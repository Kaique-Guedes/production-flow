# Production Flow

IMPLEMENTAÇÃO DO PROJETO — NÃO REINTERPRETAR A REGRA DE NEGÓCIO

Vou fornecer abaixo o projeto/arquitetura/código desenvolvido pelo Claude.

Sua função é transformar esse projeto em uma aplicação SaaS funcional dentro do Lovable.

REGRA PRINCIPAL

Não quero que você simplesmente crie um protótipo visual.

Quero uma aplicação funcional, com:

banco de dados persistente;

autenticação;

usuários;

permissões;

CRUD;

regras de negócio;

controle de produção;

histórico;

cálculos automáticos;

Supabase;

estrutura preparada para produção;

publicação;

domínio próprio posteriormente.

O resultado deve ser um sistema realmente utilizável.

1. PROJETO FORNECIDO PELO CLAUDE

Cole abaixo toda a resposta/arquitetura/código produzido pelo Claude:

[COLE AQUI A RESPOSTA DO CLAUDE]

2. REGRA DE OURO

Antes de implementar, leia todo o conteúdo fornecido pelo Claude.

Não altere a regra de negócio principal.

A estrutura fundamental do sistema é:

CLIENTE
↓
O.S.
↓
DESENHO
↓
ITENS
↓
LOTE DE PRODUÇÃO
↓
ETAPA

O lote é a unidade física de movimentação dentro da fábrica.

3. DIFERENÇA ENTRE OS SETORES

Essa regra é obrigatória.

PREPARATIVO

Trabalha:

ITEM POR ITEM

O preparativo precisa visualizar os itens que compõem o lote e apontar individualmente:

início;

pausa;

conclusão;

responsável;

data/hora;

observações.

MONTAGEM

Trabalha:

LOTE POR LOTE

Não exigir apontamento individual dos itens.

SOLDA

Trabalha:

LOTE POR LOTE

ACABAMENTO

Trabalha:

LOTE POR LOTE

4. FLUXO

O fluxo padrão é:

PREPARATIVO
↓
MONTAGEM
↓
SOLDA
↓
ACABAMENTO
↓
CONCLUÍDO

Um lote possui apenas uma etapa atual.

5. MOVIMENTAÇÃO

O usuário não poderá simplesmente escolher qualquer etapa.

As transições devem respeitar:

PREPARATIVO → MONTAGEM

MONTAGEM → SOLDA

SOLDA → ACABAMENTO

ACABAMENTO → CONCLUÍDO

Qualquer retorno deverá ser uma ação específica e exigir justificativa.

6. PESO

O peso deve ser calculado automaticamente.

Nunca criar campos independentes para o usuário digitar:

"peso em montagem"

"peso em solda"

"peso em acabamento"

Esses valores devem ser calculados pelos lotes que estão atualmente em cada etapa.

Exemplo:

Lote 001 = 1.200 kg

Se estiver em solda:

Solda = 1.200 kg

As outras etapas não recebem esse peso.

7. SUPABASE

Utilizar Supabase como banco de dados principal.

Não utilizar:

localStorage como banco;

dados fictícios permanentes;

arrays estáticos;

mock data como substituição do banco.

Criar tabelas reais no PostgreSQL.

Criar os relacionamentos corretamente.

Criar as políticas de segurança necessárias.

8. AUTENTICAÇÃO

Utilizar:

Supabase Auth

Criar login real.

Criar perfis de usuário.

Perfis:

Administrador

Planejamento

Preparativo

Montagem

Solda

Acabamento

Implementar permissões conforme a função.

9. RLS

Implementar Row Level Security no Supabase quando necessário.

Não deixar tabelas de produção abertas sem proteção.

Usuários devem acessar somente as operações permitidas para seu perfil.

10. INTERFACE

Criar interface profissional de sistema industrial.

Priorizar:

desktop;

tablet;

responsividade;

leitura rápida;

poucos cliques;

cards;

tabelas;

filtros;

busca;

indicadores;

barra de progresso.

Para operadores de fábrica:

botões grandes e ações simples.

Exemplo:

LOTE 001

O.S. 1025

DES-001

1.200 kg

[ INICIAR ]

Depois:

[ CONCLUIR ]

11. DASHBOARD

Criar dashboard real conectado ao Supabase.

Mostrar:

O.S.

total;

abertas;

em produção;

atrasadas;

concluídas.

PESO

peso total;

peso em produção;

peso concluído.

POR ÁREA

Preparativo;

Montagem;

Solda;

Acabamento;

Concluído.

Os valores devem ser calculados a partir dos lotes reais.

12. CONTROLE DE PRODUÇÃO

Criar uma tela Kanban:

PREPARATIVO | MONTAGEM | SOLDA | ACABAMENTO | CONCLUÍDO

Cada card representa um lote.

Mostrar:

lote;

O.S.;

cliente;

desenho;

quantidade;

peso;

responsável;

tempo na etapa.

Não permitir movimentação livre por drag-and-drop.

A movimentação deve ocorrer pelas ações de produção e pelas regras de negócio.

13. HISTÓRICO

Registrar todas as movimentações.

Exemplo:

Lote 001

15/08/2026 08:00

Criado.

15/08/2026 08:30

Preparativo iniciado.

15/08/2026 15:20

Preparativo concluído.

15/08/2026 15:21

Enviado para montagem.

Registrar:

usuário;

data;

hora;

etapa anterior;

nova etapa;

ação;

observação.

14. TEMPO

Registrar:

início da etapa;

fim da etapa;

duração.

Calcular automaticamente o tempo de:

Preparativo;

Montagem;

Solda;

Acabamento.

15. O.S.

A O.S. deve apresentar:

número;

cliente;

pedido;

prazo;

peso total;

peso produzido;

percentual;

status.

Também mostrar todos os desenhos e lotes relacionados.

16. DESENHO

Cada desenho deve mostrar:

número;

revisão;

descrição;

quantidade;

peso;

itens;

lotes;

etapa atual dos lotes.

Um desenho pode possuir vários lotes.

17. LOTE

Cada lote deve possuir:

número;

O.S.;

desenho;

quantidade;

peso;

etapa atual;

status;

responsável;

histórico.

Um mesmo desenho pode possuir vários lotes.

Cada lote pode estar em uma etapa diferente.

18. PREPARATIVO

A tela do preparativo deve mostrar os lotes disponíveis.

Ao abrir um lote:

Mostrar os itens daquele lote.

O operador deverá conseguir:

iniciar item;

pausar item;

concluir item;

observar item.

Quando todos os itens obrigatórios forem concluídos:

habilitar:

LIBERAR PARA MONTAGEM

19. MONTAGEM

Mostrar somente lotes que chegaram à montagem.

Ações:

INICIAR MONTAGEM

e:

CONCLUIR MONTAGEM

Ao concluir:

Enviar automaticamente para solda.

20. SOLDA

Mostrar somente lotes que chegaram à solda.

Ações:

INICIAR SOLDA

e:

CONCLUIR SOLDA

Ao concluir:

Enviar automaticamente para acabamento.

21. ACABAMENTO

Mostrar somente lotes que chegaram ao acabamento.

Ações:

INICIAR ACABAMENTO

e:

CONCLUIR ACABAMENTO

Ao concluir:

Enviar para:

CONCLUÍDO

22. CONCLUSÃO DA O.S.

Uma O.S. somente pode ser considerada concluída quando todos os seus lotes estiverem concluídos.

Calcular automaticamente.

23. DADOS DE TESTE

Durante o desenvolvimento, pode criar dados de teste para validar o sistema.

Porém:

identificar claramente os dados de teste;

não misturar com dados reais;

permitir remover os dados de teste;

não depender deles para o funcionamento.

24. QUALIDADE DO CÓDIGO

Não criar uma aplicação monolítica difícil de manter.

Organizar:

componentes;

páginas;

serviços;

hooks;

tipos;

validações;

regras;

consultas;

componentes reutilizáveis.

Evitar duplicação.

Criar código limpo e organizado.

25. ANTES DE CODIFICAR

Primeiro analise o material fornecido pelo Claude.

Identifique:

arquitetura;

banco;

tabelas;

relacionamentos;

regras;

telas;

componentes;

dependências.

Se encontrar conflito entre o material do Claude e as regras deste prompt, as regras deste prompt têm prioridade, principalmente a regra de:

ITEM → PREPARATIVO

e:

LOTE → MONTAGEM → SOLDA → ACABAMENTO

26. DESENVOLVIMENTO POR FASES

Não tente fazer tudo simultaneamente.

FASE 1

Implementar:

Supabase;

banco;

autenticação;

usuários;

clientes;

O.S.;

desenhos;

itens;

lotes.

Primeiro garantir que tudo está persistindo corretamente.

FASE 2

Implementar:

Preparativo;

itens dos lotes;

apontamentos;

liberação para montagem.

FASE 3

Implementar:

Montagem;

Solda;

Acabamento;

movimentação automática.

FASE 4

Implementar:

Dashboard;

indicadores;

peso por área;

percentual;

Kanban.

FASE 5

Implementar:

histórico;

produtividade;

tempos;

relatórios;

melhorias de UX.

27. TESTES OBRIGATÓRIOS

Antes de considerar cada fase concluída, testar:

TESTE 1

Criar cliente.

TESTE 2

Criar O.S.

TESTE 3

Criar desenho.

TESTE 4

Criar itens.

TESTE 5

Criar lote.

TESTE 6

Preparar itens.

TESTE 7

Liberar lote.

TESTE 8

Enviar para montagem.

TESTE 9

Enviar para solda.

TESTE 10

Enviar para acabamento.

TESTE 11

Concluir lote.

TESTE 12

Verificar cálculo do peso.

TESTE 13

Verificar histórico.

TESTE 14

Verificar permissões.

TESTE 15

Verificar que a O.S. somente conclui quando todos os lotes estiverem concluídos.

28. IMPORTANTE SOBRE DEPLOY

A aplicação deve ficar preparada para publicação.

O banco deve permanecer no Supabase.

O código deve ser compatível com GitHub.

As informações sensíveis devem utilizar variáveis de ambiente.

Não colocar:

senhas;

tokens;

chaves privadas;

diretamente no código.

29. DOMÍNIO

A aplicação deverá posteriormente poder ser acessada por domínio próprio.

Portanto, não criar nenhuma lógica que dependa do endereço temporário do Lovable.

30. REGRA FINAL

Não transforme esse sistema em uma simples lista de tarefas.

O sistema deve representar o processo real de produção.

A lógica fundamental é:

CLIENTE
↓
O.S.
↓
DESENHO
↓
ITENS
↓
LOTE
↓
PREPARATIVO
↓
MONTAGEM
↓
SOLDA
↓
ACABAMENTO
↓
CONCLUÍDO

O preparativo trabalha os itens.

Os demais setores trabalham o lote.

O lote possui peso.

O peso acompanha o lote.

O lote possui apenas uma etapa atual.

O sistema calcula automaticamente o peso existente em cada área.

Não duplicar peso.

Não permitir movimentação inválida.

Não permitir conclusão incorreta.

Construir o sistema como um SaaS real e preparado para produção.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3b2b1fd2-cd7c-4aec-abc4-4ce677d7a7ef).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
