"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";


export default function EntrarPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function handleEntrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");
    setCarregando(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Erro ao entrar:", error);

      const codigo =
        typeof error === "object" &&
          error !== null &&
          "code" in error
          ? String(error.code)
          : "";

      if (
        codigo === "auth/invalid-credential" ||
        codigo === "auth/wrong-password" ||
        codigo === "auth/user-not-found"
      ) {
        setErro("E-mail ou senha incorretos. Confira os dados e tente novamente.");
      } else if (codigo === "auth/invalid-email") {
        setErro("Digite um endereço de e-mail válido.");
      } else if (codigo === "auth/too-many-requests") {
        setErro("Muitas tentativas. Aguarde um pouco antes de tentar novamente.");
      } else {
        setErro("Não foi possível entrar. Verifique sua conexão e tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  }

  async function handleRecuperarSenha() {
    setErro("");
    setMensagem("");

    if (!email.trim()) {
      setErro("Digite seu e-mail no campo acima para recuperar a senha.");
      return;
    }

    setRecuperando(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMensagem("Se esse e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.");
    } catch (error: unknown) {
      console.error("Erro ao recuperar senha:", error);

      const codigo =
        typeof error === "object" &&
          error !== null &&
          "code" in error
          ? String(error.code)
          : "";

      if (codigo === "auth/invalid-email") {
        setErro("Digite um endereço de e-mail válido.");
      } else {
        setErro("Não foi possível solicitar a recuperação. Confira o e-mail e tente novamente.");
      }
    } finally {
      setRecuperando(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#DCEBF4] px-4 py-8 sm:px-8">
      {/* FUNDO */}
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
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#007DB8] shadow-md transition hover:bg-[#F5F7FA] sm:left-8 sm:top-8"
      >
        <span aria-hidden="true">←</span>
        Voltar para o início
      </Link>

      {/* CARTÃO PRINCIPAL */}
      <div className="relative z-10 my-14 grid w-full max-w-[1090px] overflow-hidden rounded-[24px] bg-white shadow-2xl shadow-[#003B5C]/20 lg:my-8 lg:min-h-[650px] lg:grid-cols-[0.95fr_1.05fr]">
        {/* LATERAL AZUL */}
        <section className="relative flex flex-col bg-gradient-to-br from-[#0A5C83] via-[#0A5C83] to-[#0A5C83] px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-11 lg:py-8">
          {/* LOGO ORIGINAL CENTRALIZADA */}
          <Link
            href="/"
            className="mb-8 flex w-full justify-center"
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

          {/* TEXTO */}
          <div className="mb-6 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8ED3F5]">
              Saúde Vale+
            </p>

            <h1 className="mx-auto max-w-md text-[30px] font-bold leading-tight tracking-tight sm:text-[35px]">
              Que bom ter você de volta!
            </h1>

            <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-white/95 sm:text-base">
              Entre na sua conta e fique mais perto dos serviços de saúde
              pública. Estamos aqui para facilitar o seu cuidado.
            </p>
          </div>

          {/* IMAGEM */}
          <div className="relative mt-1 h-[230px] w-full overflow-hidden rounded-2xl shadow-lg sm:h-[300px] lg:h-[300px]">
            <Image
              src="/imagens/blumenau-fundo.png"
              alt="Paisagem de Blumenau"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#003B5C]/25 via-transparent to-transparent" />
          </div>

          <p className="mt-6 text-center text-xs text-white/75">
            Saúde Vale+ — Saúde mais perto de você.
          </p>
        </section>

        {/* FORMULÁRIO BRANCO */}
        <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-[455px]">
            <div className="mb-7">
              <p className="mb-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-[#007DB8]">
                Área do cidadão
              </p>

              <h2 className="text-[32px] font-bold leading-tight tracking-tight text-[#073B60]">
                Entrar na sua conta
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#7186A3]">
                Informe seus dados para acessar sua área do cidadão.
              </p>
            </div>

            <form onSubmit={handleEntrar} className="space-y-5">
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
                  className="h-[46px] w-full rounded-md border border-[#D1DCE8] bg-white px-3.5 text-sm text-[#173F62] outline-none transition placeholder:text-[#8195B0] focus:border-[#007DB8] focus:ring-2 focus:ring-[#007DB8]/15"
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
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    required
                    className="h-[46px] w-full rounded-md border border-[#D1DCE8] bg-white px-3.5 pr-20 text-sm text-[#173F62] outline-none transition placeholder:text-[#8195B0] focus:border-[#007DB8] focus:ring-2 focus:ring-[#007DB8]/15"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha((atual) => !atual)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#007DB8] hover:text-[#005F8F]"
                  >
                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleRecuperarSenha}
                    disabled={recuperando}
                    className="text-xs font-semibold text-[#007DB8] transition hover:text-[#005F8F] hover:underline disabled:opacity-60"
                  >
                    {recuperando ? "Enviando..." : "Esqueci minha senha"}
                  </button>
                </div>
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

              {/* CONFIRMAÇÃO */}
              {mensagem && (
                <div
                  role="status"
                  className="rounded-lg border border-green-200 bg-green-50 px-3.5 py-3 text-sm text-green-800"
                >
                  {mensagem}
                </div>
              )}

              {/* BOTÃO ENTRAR */}
              <button
                type="submit"
                disabled={carregando}
                className="flex h-[46px] w-full items-center justify-center rounded-md bg-gradient-to-r from-[#0787BE] to-[#007DB8] px-4 text-sm font-bold text-white shadow-sm transition hover:from-[#006FA6] hover:to-[#005F8F] focus:outline-none focus:ring-2 focus:ring-[#007DB8] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            </form>

            {/* LINK PARA CADASTRO */}
            <p className="mt-6 text-center text-sm text-[#7186A3]">
              Ainda não possui uma conta?{" "}
              <Link
                href="/cadastro"
                className="font-bold text-[#007DB8] hover:underline"
              >
                Criar conta
              </Link>
            </p>

            {/* SEGURANÇA */}
            <div className="mt-8 flex items-start justify-center gap-2 text-center">
              <span aria-hidden="true" className="mt-0.5 text-sm">
                🔒
              </span>

              <p className="max-w-sm text-xs leading-5 text-[#8195B0]">
                Acesse sua conta para consultar os serviços disponibilizados
                pelo Saúde Vale+.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}