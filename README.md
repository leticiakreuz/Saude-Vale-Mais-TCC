# Saúde Vale+

Sistema acadêmico de acesso e gestão de serviços de saúde pública desenvolvido como TCC. Next.js 16, React, TypeScript, Tailwind CSS e Firebase.

Inclui a área do paciente e cinco painéis profissionais protegidos por cargo e UBS: medicina, enfermagem, odontologia, recepção e administração.

Veja o guia completo em [docs/CONTINUACAO-TCC.md](docs/CONTINUACAO-TCC.md), com arquivos alterados, configuração, comandos PowerShell, segurança, checklist e preparação para GitHub/Vercel.

## Executar

Configure as variáveis de `.env.example` em `.env.local` e execute:

```powershell
npm.cmd ci
npm.cmd run dev:webpack
```

## Verificar

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build:webpack
```

Os registros e as receitas são demonstrativos. O Saúde Vale+ não é um sistema oficial do SUS e não substitui documentação ou atendimento de saúde.
