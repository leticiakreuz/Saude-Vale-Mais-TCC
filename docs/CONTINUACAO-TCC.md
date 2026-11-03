# Continuação do TCC — Saúde Vale+

Data: 2 de novembro de 2026 (America/Sao_Paulo).

Repositório escolhido: https://github.com/leticiakreuz/Saude-Vale-Mais-TCC

Pasta atual: `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais`.

A pasta original do VS Code, `C:\Users\letic\Downloads\saude-vale-mais`, foi preservada. As alterações ainda não commitadas em perfil, layout e acessibilidade foram incorporadas nesta cópia. A configuração do Firebase foi copiada para `.env.local`, que permanece fora do Git.

## Arquivos e entregas por etapa

Os arquivos abaixo já contêm o código completo na pasta atual. Não é necessário copiar blocos do chat ou recriar as pastas manualmente. No VS Code, abra a pasta atual em Arquivo > Abrir Pasta e use Ctrl+P com o caminho informado.

### 1. Análise

Coleções, controle de consulta ativa, chave de reserva por UBS/profissional/data/hora e alterações locais do VS Code revisados. As coleções do paciente foram preservadas.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\firebase.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\lib\firebaseAdmin.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\agendamentos\reservar\route.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\agendamentos\cancelar\route.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\agendamentos\disponibilidade\route.ts`

### 2. Página inicial

Nova apresentação, serviços, passos, acessos por conta e logo original reaproveitada.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\page.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\publico\Cabecalho.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\publico\Icone.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\publico\Rodape.tsx`

### 3. Sobre o SUS

Conteúdo didático, princípios, UBS, serviços, direitos, responsabilidades e FAQ. Referências oficiais e identificação acadêmica.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\sobre-sus\page.tsx`

### 4. Modelos e permissões

Cinco cargos, permissões máximas por função, padrões e vínculos individuais à UBS.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\lib\profissionais\modelos.ts`

### 5. Autorização

Firebase ID Token e cookie HttpOnly para páginas. Verificação de revogação, claims, status ativo, cargo, UBS e versão no documento protegido. Login encaminha para a área autorizada.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\lib\profissionais\autorizacao.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\acesso\route.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\login\page.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\EntradaConta.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\acesso\page.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\profissional\page.tsx`

### 6. Estrutura compartilhada

Menu próprio da função, formulários rotulados, feedback e proteção no servidor antes de renderizar cada painel.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\profissional\Estrutura.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\profissional\Protegido.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\profissional\ui.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\profissional\api.ts`

### 7. Medicina

Agenda própria, próximas consultas, confirmações, presença, falta, conclusão, histórico por data, escalas e receitas demonstrativas vinculadas ao atendimento.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\profissional\medico\page.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\profissional\Clinica.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\profissional\FerramentasClinicas.tsx`

### 8. Enfermagem

Agenda de enfermagem e sala de vacinação, com data, dose, lote, unidade, autoria e correção versionada. Receitas só com autorização adicional expressa.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\profissional\enfermagem\page.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\profissional\Clinica.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\profissional\FerramentasClinicas.tsx`

### 9. Odontologia

Mapa de horários odontológicos, agenda, histórico por data e receitas demonstrativas. Navegação e composição distintas do painel médico.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\profissional\odontologia\page.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\profissional\Clinica.tsx`

### 10. Recepção

Agenda da UBS por data/profissional/serviço, busca por início do nome, marcação e remarcação, cancelamento e chegada/falta. Sem vacinação ou receitas.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\profissional\recepcao\page.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\profissional\Recepcao.tsx`

### 11. Administração

Equipe, ativação/desativação, permissões, escalas, bloqueios, tipos de atendimento e relatórios agregados. Sem acesso clínico.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\profissional\administracao\page.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\profissional\Administracao.tsx`

### 12. Integração

Transações preservam a reserva compartilhada e o controle de consulta ativa. Remarcação libera o horário anterior e reserva o novo atomicamente. Estado anterior, UBS e autorização são conferidos dentro das transações. Auditoria administrativa.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\lib\profissionais\agendamentos.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\lib\profissionais\agendaRegras.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\lib\profissionais\datas.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\profissional\agenda\route.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\profissional\agendamentos\route.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\profissional\disponibilidade\route.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\profissional\equipe\route.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\profissional\escalas\route.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\profissional\servicos\route.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\profissional\pacientes\route.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\profissional\registros\route.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\api\profissional\relatorios\route.ts`

### 13. Firestore

Leitura dos próprios registros pelo paciente. Escritas profissionais apenas via servidor. Perfil não aceita cargos/permissões. Vínculo territorial protegido. Regras e índices publicados no projeto saude-vale-mais após autorização.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\firestore.rules`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\firestore.indexes.json`

### 14. Responsividade e acessibilidade

Preferências e perfil locais do VS Code incorporados. Tema, contraste e Modo Simples usam uma única preferência. Página inicial, SUS, menu móvel e acesso protegido conferidos no navegador.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\globals.css`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\layout.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\lib\acessibilidade.ts`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\AcessibilidadeGlobal.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\ModoEssencial.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\app\perfil\page.tsx`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\componentes\Header.tsx`

### 15. Verificações

Testes de regras de negócio e integração com fixtures isoladas. TypeScript e build. Veja o relatório final ao fim deste arquivo.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\tests\sistema.test.cjs`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\scripts\testar-integracao.mjs`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\scripts\verificar-firebase.mjs`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\scripts\verificar-indices.mjs`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\package.json`

### 16. GitHub e Vercel

Código pronto para revisão e envio. Credenciais locais e resultados de QA ignorados pelo Git. A publicação do site na Vercel não foi executada.

- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\.env.example`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\.gitignore`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\README.md`
- `C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais\docs\CONTINUACAO-TCC.md`

## Operação local no PowerShell

```powershell
Set-Location 'C:\Users\letic\OneDrive\Documentos\ChatGPT\saude vale mais'
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
npm.cmd run dev:webpack -- --port 3100
```

Acesse http://localhost:3100. O desenvolvimento usa a configuração já existente do seu Firebase. Na primeira execução em outro computador, copie `.env.example` para `.env.local` e preencha os valores no editor, sem colocá-los em mensagens ou commits.

```powershell
Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
```

Não execute essa cópia sobre um `.env.local` já preenchido.

### Conta administrativa

A conta `gabriel@gmail.com` foi vinculada, com autorização da usuária, ao cargo `administracao` da `UBS Acadêmica Vale`. Saia e entre novamente para renovar as permissões. O vínculo profissional é separado do perfil de paciente; não foi necessário transferir o perfil de paciente existente.

A administração permite cadastrar funções assistenciais e recepção. Novos administradores são provisionados pelo responsável técnico, para impedir promoção de contas pelo navegador:

```powershell
npm.cmd run provisionar:admin -- --email 'email-ja-cadastrado@exemplo.com' --unidade 'Nome exato da UBS'
```

Para vincular um paciente cadastrado à unidade, o responsável técnico pode usar:

```powershell
npm.cmd run vincular:paciente -- --email 'paciente@exemplo.com' --unidade 'Nome exato da UBS'
```

O script recusa transferência enquanto houver controle de consulta ativa. Ambos os scripts exigem credenciais administrativas locais. Nenhuma chave privada deve receber o prefixo NEXT_PUBLIC.

### Cadastro de profissionais

Entre no painel administrativo, preencha nome, e-mail, registro, função e permissões. O nome de agenda é permanente porque os agendamentos legados identificam o profissional pelo nome. Para assumir a agenda demonstrativa existente, use exatamente um dos nomes já oferecidos na área do paciente, por exemplo `Dr. Rafael Martins`.

Contas novas recebem um link para definir a senha, mostrado somente ao administrador que as criou. Entregue esse link à pessoa responsável. Contas existentes mantêm sua senha. Mudanças de permissão exigem novo login. A desativação é verificada em cada requisição e revoga sessões.

Profissionais novos de enfermagem e outros nomes personalizados precisam de escala por data. Os serviços e horários personalizados são usados na marcação pela recepção. A área pública do paciente preserva seu catálogo demonstrativo anterior e passa a respeitar bloqueios, escalas e inativação nas APIs.

### Dados e compatibilidade

- Perfil: `usuarios/{uid}`.
- Consultas: `usuarios/{uid}/agendamentos/{id}`.
- Consulta ativa: `usuarios/{uid}/controleAgendamento/ativo`.
- Reservas: `horariosReservados/{sha256([UBS,nomeAgenda,dia,horario])}`.
- Vacinação: `usuarios/{uid}/vacinacao/{id}`.
- Medicamentos: `usuarios/{uid}/medicamentos/{id}`.
- Novas estruturas protegidas: `profissionais`, `vinculosAgenda`, `escalas`, `servicosAtendimento` e `auditoria`.

Não foram migradas nem duplicadas as coleções antigas. Medicamentos e vacinação continuam vinculados ao UID do paciente. Datas administrativas usam America/Sao_Paulo. Os novos registros são demonstrativos. Não existe prontuário, anotação clínica livre, integração oficial com o SUS ou receita médica assinada.

## Checklist de testes manuais

- [ ] Entrar como paciente e conferir perfil, agendamentos, medicamentos e carteirinha.
- [ ] Conferir se cada profissional é encaminhado ao painel de sua função.
- [ ] Tentar acessar outra função pela URL e confirmar bloqueio.
- [ ] Consultar a própria agenda como médico e dentista e registrar chegada/conclusão em atendimento da data atual.
- [ ] Registrar falta e verificar histórico e liberação do controle ativo.
- [ ] Registrar e corrigir aplicação pela enfermagem e verificar a carteirinha do paciente.
- [ ] Confirmar que a recepção não acessa vacinas nem emite receitas.
- [ ] Marcar e remarcar consulta pela recepção e conferir as duas reservas.
- [ ] Bloquear um horário e confirmar que a API impede uma nova reserva.
- [ ] Inativar uma conta e confirmar que o acesso profissional é negado.
- [ ] Conferir relatórios administrativos sem documentos individuais de pacientes.
- [ ] Testar 390 px, tablet, computador, zoom de 200%, teclado, tema escuro, contraste e Modo Simples.

## Atualização para GitHub e Vercel

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build:webpack
git diff --check
git status --short
```

O build padrão com Turbopack apresentou falha interna na criação de processos neste Windows. O build alternativo `next build --webpack` é suportado pelo Next.js 16 e foi incluído como `build:webpack`. O script padrão não foi substituído.

Depois da revisão, crie uma branch e envie somente os arquivos do projeto:

```powershell
git switch -c feat/reformulacao-area-profissional
git add .
git diff --cached --stat
git commit -m 'Reformula páginas públicas e adiciona área profissional protegida'
git push -u origin feat/reformulacao-area-profissional
```

Antes do commit, confirme que `.env.local`, `serviceAccountKey.json` e `.local/` não aparecem no stage. Na Vercel, use Next.js, configure as variáveis indicadas em `.env.example` e, se necessário, defina o comando de build como `npm run build:webpack`. Configure o domínio de autenticação autorizado no Firebase para o endereço usado na Vercel. A conta de serviço fica somente no ambiente do servidor.

As regras e os índices do Firestore já foram publicados com autorização. Em atualizações futuras, faça primeiro a simulação:

```powershell
firebase.cmd deploy --only firestore --dry-run --project saude-vale-mais
firebase.cmd deploy --only firestore --project saude-vale-mais
```

## Fontes e referências

- Ministério da Saúde: https://www.gov.br/saude/pt-br/sus
- Atenção Primária: https://www.gov.br/saude/pt-br/composicao/saps
- Carta dos Direitos e Deveres: https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/cartilhas/2019/cartas-dos-direitos-e-deveres-da-pessoa-usuaria-da-saude
- Firebase Custom Claims: https://firebase.google.com/docs/auth/admin/custom-claims
- Transações Firestore: https://firebase.google.com/docs/firestore/manage-data/transactions

## Relatório de validação

- 12 testes automatizados de regras de negócio: aprovados.
- 15 testes de integração no Firebase real: aprovados, incluindo autenticação dos cinco cargos, sessão das páginas, isolamento por UBS, conflito de reservas, remarcação, registros de vacinação/medicamentos, relatórios e revogação de acesso.
- Regras publicadas verificadas pelo SDK de cliente: leitura própria permitida; escrita direta em vacinação/agendamentos, leitura alheia e cargo falsificado bloqueados.
- Sete índices do Firestore: READY.
- TypeScript e build de produção com Webpack: aprovados com a configuração real do Firebase.
- Página inicial, Sobre o SUS, menu móvel, FAQ, Modo Simples e bloqueio de acesso pela URL conferidos no navegador. Telas autenticadas também responderam com suas sessões durante os testes de integração; os fluxos visuais de cada painel ainda podem ser percorridos pelo checklist manual.
- Todas as sete contas e os documentos fictícios da última integração foram removidos. A conta administrativa indicada pela usuária foi preservada.
- As melhorias locais de perfil, tema escuro e acessibilidade foram incorporadas à nova versão.
- GitHub e Vercel: atualização preparada localmente, sem push ou publicação do site. `vercel.json` configura o build com Webpack.

Resultados de integração são salvos em `.local/firebase/ultima-integracao.json`, sem senhas ou tokens. O teste cria uma UBS QA temporária e remove apenas suas próprias contas e documentos no bloco de limpeza; não altera a conta administrativa real.
