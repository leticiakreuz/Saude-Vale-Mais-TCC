# Revisão da interface — 02/11/2026

Os comentários visuais da usuária foram incorporados ao projeto local.

- Administração: áreas independentes para histórico de atendimentos, equipe e permissões, escalas e funcionários por UBS. O diretório permite selecionar uma UBS ou todas; somente informações profissionais mínimas são retornadas. Alterações de equipe continuam restritas à unidade do administrador.
- Identidade: cabeçalho azul com a logo original; acesso às preferências em Configurações.
- Login: o acesso profissional leva a /login?area=profissional, com título, orientação e links próprios. O parâmetro apenas altera a apresentação; o servidor continua validando a função e as permissões.
- Modo Simples: início por cartões, consultas em telas curtas, medicamentos simplificados e lista de vacinas com acesso à carteira completa. A preferência anterior foi preservada para quem já a utilizava.
- Agendamentos: símbolos diferentes por serviço, relógio para histórico, seringa para vacinas, tarde com símbolo colorido e remoção da faixa de etapas e da barra fixa de atalhos.
- Perfil: ícones vetoriais maiores de pessoa, casa e cartão; subtítulo removido.
- Navegação autenticada: removido o link Sobre o SUS. O conteúdo informativo continua disponível na área pública.
- Painel: removido o bloco de próximos agendamentos, conta e direitos selecionado pela usuária.
- Medicamentos: nova apresentação com autoria da prescrição, disponibilidade em destaque e UBS de retirada quando cadastrada. A API salva a unidade a partir da conta profissional autorizada. A lista mostra somente medicamentos ativos, sem o botão Todos. Registros antigos sem autoria mostram “Profissional não informado”; nenhum médico foi atribuído por suposição.
- Vacinação: removido o link duplicado “Voltar ao painel”.
- Página inicial: removidos a faixa acadêmica superior, o link Configurações, o cartão flutuante e a explicação ao lado dos serviços. Adicionado o acesso Sou profissional.
- Rodapés: compactos, com instalação do aplicativo; nas páginas públicas curtas ficam no final da tela.
- Instalação: manifesto e ícones PNG com a logo original, botão de instalação quando o navegador oferece essa opção e instruções para os demais casos. Sem funcionamento offline; os serviços exigem internet. Removidos os símbolos de celular solicitados.
- Imagem inicial: ilustração criada com image_gen, salva no projeto. Ver [prompt e identificação para o TCC](IMAGEM-TCC.md).

## Validação

TypeScript e build de produção com Webpack aprovados. Os 12 testes de negócio passaram. A última execução de integração no Firebase real passou nos 15 testes, incluindo os novos limites do histórico administrativo e do diretório por UBS; as contas temporárias foram removidas ao terminar.

Na prévia local foram verificadas a recuperação da página de agendamentos após a correção de compilação, os ícones dos serviços, a remoção da barra fixa, o login profissional e o rodapé no final da tela. Manifesto e ícones 192/512 responderam HTTP 200. O teste de redimensionamento do navegador não aplicou a largura de 390 px nesta sessão; a verificação visual móvel completa permanece no checklist manual.

Não houve nova publicação das regras, push para GitHub ou publicação na Vercel nesta revisão da interface.
