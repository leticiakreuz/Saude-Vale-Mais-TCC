import Link from "next/link";
import InstalarApp from "./InstalarApp";
export default function Footer() {
  return <footer className="bg-[#005F8F] text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-8">
    <div><Link href="/" className="text-xl font-extrabold">Saúde Vale<span className="text-green-300">+</span></Link><p className="mt-1 text-xs text-sky-100">© 2026 · Projeto acadêmico</p></div>
    <InstalarApp />
  </div></footer>;
}
