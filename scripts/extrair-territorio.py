"""Extrai a tabela pública da Prefeitura. Uso: python scripts/extrair-territorio.py entrada.pdf
Requer pypdf; não consulta endereços pessoais.
"""
import hashlib, json, re, sys
from pathlib import Path
from pypdf import PdfReader
origem = Path(sys.argv[1])
leitor = PdfReader(origem)
linhas, ignoradas = [], []
for pagina, folha in enumerate(leitor.pages, 1):
    continuacao = ""
    for linha in folha.extract_text(extraction_mode="layout").splitlines():
        texto = " ".join(linha.split())
        if not texto or texto.startswith("ANEXO") or texto.startswith("RUA ") or texto.isdigit():
            continue
        achado = re.fullmatch(r"(.+?)\s+((?:ESF|USF|EAP)\s+.+?)\s+(\d+)\s+(\d+)", texto)
        if not achado:
            ignoradas.append({"pagina": pagina, "texto": texto})
            if not re.search(r"\b(?:ESF|USF|EAP)\b", texto) and re.fullmatch(r"[A-ZÀ-Ú ]+", texto):
                continuacao = texto + " "
            continue
        rua, unidade, inicio, fim = achado.groups()
        rua = continuacao + rua
        continuacao = ""
        linhas.append([rua, unidade, int(inicio), int(fim)])
Path(".local/territorio/extracao-revisar.json").write_text(json.dumps(ignoradas, ensure_ascii=False, indent=2), encoding="utf-8")
saida = {"fonte": "Município de Blumenau / SEMUS", "url": "https://www.blumenau.sc.gov.br/downloads/semus/unidade_saude_referencia.pdf", "consultadoEm": "2026-11-03", "documentoCriadoEm": "2022-03-30", "sha256": hashlib.sha256(origem.read_bytes()).hexdigest(), "paginas": len(leitor.pages), "linhas": linhas}
Path("dados").mkdir(exist_ok=True)
Path("dados/territorio-blumenau.json").write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(json.dumps({"paginas": len(leitor.pages), "linhas": len(linhas), "revisar": ignoradas[:20], "totalRevisar": len(ignoradas)}, ensure_ascii=True))
