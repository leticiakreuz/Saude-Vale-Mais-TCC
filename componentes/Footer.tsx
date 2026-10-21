import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#005F8F] text-white">

      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">

        <div className="grid gap-10 md:grid-cols-3">

          {/* MARCA */}
          <div>
            <Link
              href="/"
              className="font-[family-name:var(--font-inter)] text-2xl font-extrabold"
            >
              Saúde Vale<span className="text-[#22C55E]">+</span>
            </Link>

            <p className="mt-4 max-w-sm font-[family-name:var(--font-roboto)] text-sm leading-6 text-white/75">
              Uma plataforma digital pensada para facilitar o acesso da
              população aos serviços de saúde pública.
            </p>
          </div>

          {/* NAVEGAÇÃO */}
          <div>
            <h2 className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-wide text-white">
              Navegação
            </h2>

            <div className="mt-4 flex flex-col gap-3">

              <Link
                href="/"
                className="font-[family-name:var(--font-roboto)] text-sm text-white/75 transition hover:text-[#8ED3F5]"
              >
                Início
              </Link>

              <Link
                href="#servicos"
                className="font-[family-name:var(--font-roboto)] text-sm text-white/75 transition hover:text-[#8ED3F5]"
              >
                Serviços
              </Link>

              <Link
                href="#sobre"
                className="font-[family-name:var(--font-roboto)] text-sm text-white/75 transition hover:text-[#8ED3F5]"
              >
                Sobre o projeto
              </Link>

              <Link
                href="#como-funciona"
                className="font-[family-name:var(--font-roboto)] text-sm text-white/75 transition hover:text-[#8ED3F5]"
              >
                Como funciona
              </Link>

            </div>
          </div>

          {/* INFORMAÇÕES */}
          <div>
            <h2 className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-wide text-white">
              Saúde Vale+
            </h2>

            <p className="mt-4 font-[family-name:var(--font-roboto)] text-sm leading-6 text-white/75">
              Tecnologia para aproximar a população dos serviços de saúde
              pública.
            </p>

            <div className="mt-5 inline-flex rounded-full bg-[#007DB8] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white">
              Projeto acadêmico
            </div>
          </div>

        </div>

        <div className="my-10 border-t border-white/15" />

        <div className="flex flex-col gap-2 font-[family-name:var(--font-roboto)] text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Saúde Vale+</p>
          <p>Projeto acadêmico de tecnologia</p>
        </div>

      </div>
    </footer>
  );
}