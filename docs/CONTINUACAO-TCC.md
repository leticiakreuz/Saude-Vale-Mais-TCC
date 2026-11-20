# Continuação do TCC — Saúde Vale+

Atualização em 20 de novembro de 2026.

O projeto concentra seus serviços na área do cidadão. O módulo profissional, seus painéis, APIs, permissões por cargo e script de provisionamento foram removidos.

## Acesso e cadastro

- `/login` autentica a conta por e-mail e senha.
- `/cadastro` cria a conta com os dados básicos.
- `/api/acesso` encaminha para `/completar-cadastro` ou `/dashboard`, conforme os dados do perfil.
- As preferências de acessibilidade e o Modo Simples ficam disponíveis nas configurações.

## Serviços

- Agendamentos oferecem consulta de horários, reserva e cancelamento pelo próprio cidadão.
- As regras compartilhadas de agenda estão em `lib/agendamentos`. Reservas respeitam a UBS, as escalas existentes, horários ocupados e o limite de uma consulta ativa.
- Medicamentos e vacinação consultam os registros vinculados à conta. O nome do responsável por uma receita aparece quando estiver cadastrado no registro.
- O perfil permite completar e atualizar os dados pessoais e o endereço em Blumenau. A fonte e as limitações da vinculação territorial estão em [CADASTRO-E-TERRITORIO.md](CADASTRO-E-TERRITORIO.md).

## Firebase

Configure as variáveis de `.env.example` em `.env.local`. As variáveis administrativas são exclusivas do servidor.

A remoção do módulo foi feita no código. Os registros existentes no Firebase continuam armazenados. As regras de privacidade das coleções continuam aplicadas.

## Executar e verificar

```powershell
npm.cmd ci
npm.cmd run dev:webpack -- --hostname 127.0.0.1 --port 3100
npm.cmd run typecheck
npm.cmd test
npm.cmd run build:webpack
```

Os testes locais cobrem login, conclusão do cadastro, regras territoriais, reserva concorrente, cancelamento e disponibilidade. O script `scripts/testar-cadastro.mjs` verifica o fluxo de cadastro com uma conta fictícia no Firebase e faz a limpeza ao terminar.

```powershell
node --env-file=.env.local scripts/testar-cadastro.mjs
```

Receitas, vacinas e agendamentos do projeto são demonstrativos. O aplicativo não realiza operações nos sistemas oficiais do SUS.
