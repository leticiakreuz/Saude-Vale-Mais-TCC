import { gerarIconeApp } from "@/lib/iconeApp";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  return gerarIconeApp(size.width);
}
