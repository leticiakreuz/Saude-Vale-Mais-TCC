# Cadastro obrigatório após o login e UBS de Blumenau

Atualização: 3 de novembro de 2026.

## Fluxo do cidadão

1. A página de criação conserva os campos anteriores: nome completo, CPF, e-mail, senha e confirmação. O visual do computador foi preservado; no celular o painel azul mostra apenas a logo, aproximando o formulário do início da página.
2. A API cria a identidade e um perfil básico com `cadastroVersao: 1`. Campos de cargo, UID, endereço, versão ou UBS enviados pelo cliente não concedem autorização. A identidade fica temporariamente desabilitada até salvar esse perfil básico; uma falha desfaz a criação.
3. Depois do login, `/api/acesso` encaminha cidadãos com perfil incompleto para `/completar-cadastro`. Essa tela exige os dados pessoais e, na segunda etapa, o endereço e a identificação da UBS.
4. O usuário informa nascimento, telefone com DDD e Cartão SUS, além de nome/CPF já preenchidos. Crianças menores de dez anos também informam o e-mail de um responsável, diferente do e-mail da própria conta.
5. O CEP preenche rua e bairro. O número residencial determina o trecho territorial. A conclusão é permitida apenas para Blumenau/SC, código IBGE 4202404, com uma única unidade identificada.
6. `/api/perfil` verifica novamente todos os dados, consulta o CEP e calcula a UBS no servidor. Só então grava `cadastroVersao: 2` e libera a área do cidadão. A UBS não é um campo editável.
7. Contas antigas incompletas também passam pela conclusão. Não foi feita uma migração automática de endereços ou UBS de pessoas reais. As áreas profissionais mantêm seu próprio fluxo e suas permissões.

A proteção das páginas impede abrir consultas, medicamentos, vacinas e perfil enquanto faltar completar o cadastro. As APIs de reserva, disponibilidade e comprovante e as regras das subcoleções clínicas também verificam o perfil. Apenas esconder botões não é a proteção de acesso.

Nome/CPF/e-mail são suficientes para criar a conta, conforme a interface anterior. Os demais campos são obrigatórios **depois de entrar, antes de usar os serviços**.

## Endereço e base territorial

- Consulta postal: [ViaCEP](https://viacep.com.br/). Somente o CEP é enviado ao serviço; CPF, nome, número residencial e informações de saúde não são enviados.
- Fonte territorial: [tabela pública da Secretaria Municipal de Promoção da Saúde de Blumenau](https://www.blumenau.sc.gov.br/downloads/semus/unidade_saude_referencia.pdf).
- PDF: 87 páginas; metadado de criação em 30/03/2022; consultado em 03/11/2026.
- SHA-256 do PDF utilizado: `6fe4719f5742d39a6535e98d84c65e6774ed5ebc8951ada96c29e054597ef9a5`.
- Base extraída: `dados/territorio-blumenau.json`, com 3.781 registros de rua, unidade e limites de numeração. O perfil guarda a identificação dessa fonte.

A tabela é de **2022**, mesmo estando disponível no site municipal em 2026. Ela não comprova que todos os territórios ou nomes de equipes continuam atuais. O aviso aparece na tela; a unidade deve confirmar o atendimento presencial. Esta integração é uma demonstração acadêmica, sem acesso aos sistemas operacionais do município.

A busca normaliza acentos, pontuação e prefixos comuns de logradouro, mas não escolhe por distância, semelhança ou bairro. Uma rua pode pertencer a UBS diferentes conforme o número. A rua do CEP deve corresponder à informada quando o serviço postal fornece um logradouro.

Quando não há correspondência, há mais de uma unidade, a numeração não é suportada ou a consulta de CEP falha, a conclusão é bloqueada com uma orientação para conferir o endereço. Não existe seleção automática de uma unidade aproximada. As faixas pares/ímpares da Rua Frederico Jensen foram conferidas visualmente na página 34 do PDF e têm tratamento explícito. Trechos incompletos de Professor Jacob Ineichen, BR-470 e Waldir Krüger são recusados.

## Validação e acesso

- CPF: formato e dígitos verificadores. Nascimento: data real, não futura e idade até 130 anos. Telefone: DDD e quantidade de dígitos. CNS: 15 números não repetidos.
- A validação não verifica identidade, titularidade do CNS, residência efetiva ou existência do número residencial em cadastro imobiliário.
- Perfil completo deve manter os dados obrigatórios, a versão validada e uma UBS. O marcador isolado não libera acesso.
- O SDK cliente não cria perfis nem altera CPF, endereço, UBS, versão ou permissões. Essas alterações passam pelas APIs autenticadas e validadas. Somente os campos autodeclarados de gestação continuam com atualização direta restrita pelas regras.
- CPF e nascimento de um perfil versão 2 não podem ser alterados na tela de perfil. A mudança de UBS é bloqueada enquanto houver consulta ativa.
- A criação inicial tem limite simples por processo/IP. Produção com várias instâncias precisaria de limitação compartilhada e proteção adicional contra abuso.
- As regras atualizadas foram compiladas e aplicadas no projeto Firebase `saude-vale-mais`. Isso não publica automaticamente o aplicativo Next.js.

## Atualizar a tabela

Baixe o PDF diretamente do endereço municipal acima para `.local/territorio/unidade-saude-referencia.pdf`. Com Python e `pypdf` instalados, execute na raiz:

```powershell
python scripts/extrair-territorio.py .local/territorio/unidade-saude-referencia.pdf
```

Confira `.local/territorio/extracao-revisar.json`, nomes partidos em duas linhas, faixas sobrepostas e paridade antes de usar a extração. Atualize a data de consulta/metadados e revise os casos especiais no resolvedor; não publique uma atualização apenas porque a extração terminou. O JSON contém somente dados territoriais públicos, sem endereços de usuários.

## Verificação

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build:webpack
node --env-file=.env.local scripts/testar-cadastro.mjs
node --env-file=.env.local scripts/testar-integracao.mjs
```

Os testes de cadastro cobrem criação com os campos anteriores, bloqueio após login, dados obrigatórios, rejeição de outros municípios, UBS calculada no servidor, tentativas de forjar unidade/cargo e liberação após concluir. As contas fictícias desses scripts são removidas ao final; não são enviados e-mails de teste.

Credenciais, PDF de trabalho e resultados locais de teste permanecem ignorados pelo Git.
