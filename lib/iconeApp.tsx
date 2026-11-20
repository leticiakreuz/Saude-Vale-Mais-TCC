import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export async function gerarIconeApp(tamanho: number) {
  const logo = await readFile(join(process.cwd(), "public/imagens/logo-saude-vale-mais-1.png"));
  const escala = tamanho / 360;
  return new ImageResponse(
    <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#0A5C83", borderRadius: tamanho * 0.1875 }}>
      <img src={`data:image/png;base64,${logo.toString("base64")}`} alt="" width={1024 * escala} height={512 * escala} style={{ position: "absolute", left: -90 * escala, top: -70 * escala, maxWidth: "none" }} />
    </div>,
    { width: tamanho, height: tamanho },
  );
}
