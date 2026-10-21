
"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function formatarCPF(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function validarCPF(cpf: string) {
  const numero = cpf.replace(/\D/g, "");

  if (numero.length !== 11 || /^(\d)\1{10}$/.test(numero)) {
    return false;
  }

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(numero[i]) * (10 - i);
  }

  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;

  if (resto !== Number(numero[9])) return false;

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(numero[i]) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;

  return resto === Number(numero[10]);
}

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleCadastro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("Digite seu nome completo.");
      return;
    }

    if (!validarCPF(cpf)) {
      setErro("Informe um CPF válido.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      const credencial = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        senha
      );

      await updateProfile(credencial.user, {
        displayName: nome.trim(),
      });

      await setDoc(doc(db, "usuarios", credencial.user.uid), {
        uid: credencial.user.uid,
        nome: nome.trim(),
        cpf: cpf.replace(/\D/g, ""),
        email: email.trim(),
        criadoEm: new Date().toISOString(),
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Erro ao realizar cadastro:", error);

      const codigo =
        typeof error === "object" &&
          error !== null &&
          "code" in error
          ? String(error.code)
          : "";

      if (codigo === "auth/email-already-in-use") {
        setErro("Este e-mail já está cadastrado.");
      } else if (codigo === "auth/invalid-email") {
        setErro("Digite um endereço de e-mail válido.");
      } else if (codigo === "auth/weak-password") {
        setErro("Escolha uma senha mais segura.");
      } else if (codigo === "auth/operation-not-allowed") {
        setErro(
          "Ative o acesso por e-mail e senha nas configurações do Firebase."
        );
      } else if (codigo === "permission-denied") {
        setErro(
          "Não foi possível salvar os dados. Verifique as regras do Firestore."
        );
      } else {
        setErro(
          "Não foi possível concluir o cadastro. Confira os dados e tente novamente."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#DCEBF4] px-4 py-8 sm:px-8">
      {/* FUNDO DA PÁGINA */}
      <div className="absolute inset-0">
        <Image
          src="/imagens/blumenau-fundo.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#EAF4FA]/40 backdrop-blur-[2px]" />
      </div>

      {/* VOLTAR PARA O INÍCIO */}
      <Link
        href="/"
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#007DB8] shadow-md transition hover:bg-[#0A5C83] sm:left-8 sm:top-8"
      >
        <span aria-hidden="true">←</span>
        Voltar para o início
      </Link>

      {/* CARTÃO PRINCIPAL */}
      <div className="relative z-10 my-14 grid w-full max-w-[1090px] overflow-hidden rounded-[24px] bg-white shadow-2xl shadow-[#003B5C]/20 lg:my-8 lg:min-h-[720px] lg:grid-cols-[0.95fr_1.05fr]">
        {/* PAINEL AZUL */}
        <section className="relative flex flex-col bg-gradient-to-br from-[#0A5C83] via-[#0A5C83] to-[#0A5C83] px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-11 lg:py-8">

          {/* LOGO CENTRALIZADA */}
          <Link
            href="/"
            className="mb-7 flex w-full justify-center"
          >
            <Image
              src="/imagens/logo-saude-vale-mais-1.png"
              alt="Logo Saúde Vale+"
              width={220}
              height={90}
              priority
              className="h-auto w-44 object-contain sm:w-48"
            />
          </Link>
          {/* TEXTOS ACIMA DA FOTO */}
          <div className="mb-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8ED3F5]">
              Saúde Vale+
            </p>

            <h1 className="max-w-md text-[30px] font-bold leading-[1.15] tracking-tight sm:text-[35px]">
              Cuidar de você é o que nos move.
            </h1>

            <p className="mt-3 max-w-md text-[15px] leading-6 text-white/95 sm:text-base">
              Mais facilidade para acessar os serviços de saúde e mais
              tranquilidade para cuidar de quem você ama.
            </p>
          </div>

          {/* FOTO ABAIXO DOS TEXTOS */}
          <div className="relative mt-1 h-[230px] w-full overflow-hidden rounded-2xl shadow-lg sm:h-[300px] lg:h-[330px]">
            <Image
              src="/imagens/blumenau-fundo.png"
              alt="Paisagem de Blumenau e sua comunidade"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#003B5C]/25 via-transparent to-transparent" />
          </div>

          <p className="mt-6 text-xs text-white/75">
            Projeto acadêmico Saúde Vale+
          </p>
        </section>

        {/* FORMULÁRIO BRANCO */}
        <section className="flex items-center justify-center bg-white px-6 py-9 sm:px-10 sm:py-10 lg:px-12 lg:py-8">
          <div className="w-full max-w-[455px]">
            <div className="mb-5">
              <p className="mb-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-[#007DB8]">
                Cadastro
              </p>

              <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#073B60]">
                Crie sua conta
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#7186A3]">
                Preencha seus dados para começar a utilizar os serviços do{" "}
                <span className="font-medium text-[#174B78]">
                  Saúde Vale+.
                </span>
              </p>
            </div>

            <form onSubmit={handleCadastro} className="space-y-3.5">
              {/* NOME COMPLETO */}
              <div>
                <label
                  htmlFor="nome"
                  className="mb-1.5 block text-sm font-bold text-[#123F65]"
                >
                  Nome completo
                </label>

                <input
                  id="nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Digite seu nome completo"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  required
                  className="h-[43px] w-full rounded-md border border-[#D1DCE8] bg-white px-3.5 text-sm text-[#173F62] outline-none transition placeholder:text-[#8195B0] focus:border-[#007DB8] focus:ring-2 focus:ring-[#007DB8]/15"
                />
              </div>

              {/* CPF */}
              <div>
                <label
                  htmlFor="cpf"
                  className="mb-1.5 block text-sm font-bold text-[#123F65]"
                >
                  CPF
                </label>

                <input
                  id="cpf"
                  name="cpf"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(event) => setCpf(formatarCPF(event.target.value))}
                  maxLength={14}
                  required
                  className="h-[43px] w-full rounded-md border border-[#D1DCE8] bg-white px-3.5 text-sm text-[#173F62] outline-none transition placeholder:text-[#8195B0] focus:border-[#007DB8] focus:ring-2 focus:ring-[#007DB8]/15"
                />

                <p className="mt-1 text-xs text-[#7186A3]">
                  Informe seu CPF para o cadastro.
                </p>
              </div>

              {/* E-MAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-bold text-[#123F65]"
                >
                  E-mail
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-[43px] w-full rounded-md border border-[#D1DCE8] bg-white px-3.5 text-sm text-[#173F62] outline-none transition placeholder:text-[#8195B0] focus:border-[#007DB8] focus:ring-2 focus:ring-[#007DB8]/15"
                />
              </div>

              {/* SENHA */}
              <div>
                <label
                  htmlFor="senha"
                  className="mb-1.5 block text-sm font-bold text-[#123F65]"
                >
                  Senha
                </label>

                <div className="relative">
                  <input
                    id="senha"
                    name="senha"
                    type={mostrarSenha ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Crie uma senha"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    minLength={6}
                    required
                    className="h-[43px] w-full rounded-md border border-[#D1DCE8] bg-white px-3.5 pr-20 text-sm text-[#173F62] outline-none transition placeholder:text-[#8195B0] focus:border-[#007DB8] focus:ring-2 focus:ring-[#007DB8]/15"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha((atual) => !atual)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#007DB8] hover:text-[#005F8F]"
                  >
                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                <p className="mt-1 text-xs text-[#7186A3]">
                  A senha deve ter pelo menos 6 caracteres.
                </p>
              </div>

              {/* CONFIRMAR SENHA */}
              <div>
                <label
                  htmlFor="confirmarSenha"
                  className="mb-1.5 block text-sm font-bold text-[#123F65]"
                >
                  Confirmar senha
                </label>

                <input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Digite a senha novamente"
                  value={confirmarSenha}
                  onChange={(event) =>
                    setConfirmarSenha(event.target.value)
                  }
                  required
                  className="h-[43px] w-full rounded-md border border-[#D1DCE8] bg-white px-3.5 text-sm text-[#173F62] outline-none transition placeholder:text-[#8195B0] focus:border-[#007DB8] focus:ring-2 focus:ring-[#007DB8]/15"
                />
              </div>

              {/* ERRO */}
              {erro && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                >
                  {erro}
                </div>
              )}

              {/* CRIAR CONTA */}
              <button
                type="submit"
                disabled={carregando}
                className="mt-1 flex h-[45px] w-full items-center justify-center rounded-md bg-gradient-to-r from-[#0787BE] to-[#007DB8] px-4 text-sm font-bold text-white shadow-sm transition hover:from-[#006FA6] hover:to-[#005F8F] focus:outline-none focus:ring-2 focus:ring-[#007DB8] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando ? "Criando sua conta..." : "Criar conta"}
              </button>
            </form>

            {/* LINK PARA ENTRAR */}
            <p className="mt-5 text-center text-sm text-[#7186A3]">
              Já possui uma conta?{" "}
              <Link
                href="/login"
                className="font-bold text-[#007DB8] hover:underline"
              >
                Entrar
              </Link>
            </p>

            {/* AVISO DE SEGURANÇA */}
            <div className="mt-6 flex items-start justify-center gap-2 text-center">
              <span
                aria-hidden="true"
                className="mt-0.5 text-sm text-[#007DB8]"
              >
                🔒
              </span>

              <p className="max-w-sm text-xs leading-5 text-[#8195B0]">
                Seus dados devem ser tratados com segurança e utilizados
                apenas para as finalidades informadas ao cidadão.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

