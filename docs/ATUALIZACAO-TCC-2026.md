# Última atualização TCC - 2026

Revisão de 24 de novembro de 2026 para a apresentação acadêmica.

## Interface

- O botão principal da página inicial abre o cadastro com o texto “Criar uma conta”.
- A fotografia do fundo permanece visível no login e no cadastro em modo escuro; os rótulos dos campos têm contraste ajustado.
- Os cartões de medicamentos apresentam disponibilidade, quantidade, frequência, próxima retirada e prescritor em blocos organizados.
- No Modo Simples, os profissionais são escolhidos em botões grandes e a data em um calendário mensal. Os dias permitidos seguem o limite de 21 dias e os dias úteis já usados pela agenda.
- Horários livres aparecem em verde; os ocupados, em vermelho e bloqueados; o escolhido recebe uma marca de confirmação.

## Banco e demonstrações

Os dados no Firebase são independentes dos commits do Git. A limpeza autorizada de contas antigas foi executada com cópia local; a conta principal e seus registros foram preservados.

Foram preparados quatro cadastros sintéticos completos, vinculados a uma UBS pela mesma validação territorial do aplicativo:

| Documento em `usuarios` | Cenário |
| --- | --- |
| `demo-crianca-tcc` | Criança, com responsável |
| `demo-adolescente-tcc` | Adolescente |
| `demo-adulto-tcc` | Adulto e responsável da criança |
| `demo-gestante-tcc` | Adulto feminino com gestação demonstrativa |

Essas contas possuem o marcador `demonstracao: true` e uma descrição em `cenarioApresentacao`. E-mails terminados em `.invalid` são exemplos e não recebem mensagens. As novas contas têm perfis completos; receitas, consultas e doses não são criadas automaticamente pelo script de contas.

As senhas ficam exclusivamente em `.local/apresentacao/ACESSOS.md` e `.local/apresentacao/acessos.json`. Backups e relatórios ficam em `.local/`, ignorado pelo Git. Não são necessários para executar a aplicação publicada.

## Ferramentas administrativas locais

- `scripts/auditar-banco.mjs`: conferência somente leitura; gera relatório privado em `.local/`.
- `scripts/criar-contas-apresentacao.mjs`: valida os quatro cenários; só cria contas quando recebe `--aplicar` e não sobrescreve contas existentes.
- `scripts/limpar-outras-contas.mjs`: ferramenta de limpeza usada nesta revisão. Exige `--preservar email`; sem `--aplicar`, apenas prepara o plano e a cópia local. Com `--aplicar`, remove as demais contas e seus registros vinculados. Não faz parte da inicialização nem da publicação do site.

Os scripts usam credenciais administrativas locais e são restritos ao projeto acadêmico `saude-vale-mais`. Essas credenciais não devem ser incluídas no Git.

## Verificações

Os 28 testes automatizados e a verificação TypeScript passaram. A prévia do calendário também foi conferida nos temas claro e escuro, com verificações de seleção, dias bloqueados, virada de mês e fevereiro bissexto. Os quatro logins demonstrativos e a leitura de seus perfis pelo SDK cliente foram testados.
