"""
Métricas de tamaño del código fuente (LOC, NCLOC, CLOC, DC)
Para proyectos TypeScript / Next.js
Uso: python loc_metrics.py <ruta_del_proyecto>
"""

import os
import sys
import re
from pathlib import Path

# Extensiones a analizar
EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}

# Carpetas a ignorar
IGNORE_DIRS = {
    "node_modules", ".next", ".git", "dist", "build",
    "out", ".turbo", "coverage", ".cache"
}


def analizar_archivo(path: Path):
    """Cuenta LOC, NCLOC, CLOC de un archivo."""
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            lineas = f.readlines()
    except Exception:
        return None

    total = 0
    cloc = 0
    ncloc = 0
    en_bloque = False

    for linea in lineas:
        stripped = linea.strip()
        if not stripped:
            continue  # líneas en blanco no cuentan

        total += 1

        # Detectar inicio/fin de comentario de bloque
        if en_bloque:
            cloc += 1
            if "*/" in stripped:
                en_bloque = False
            continue

        if stripped.startswith("/*") or stripped.startswith("/**"):
            cloc += 1
            if "*/" not in stripped:
                en_bloque = True
            continue

        if stripped.startswith("//"):
            cloc += 1
            continue

        # Comentario inline al final de una línea de código
        # La línea tiene código Y comentario → cuenta como NCLOC
        ncloc += 1

    return {
        "loc": total,
        "ncloc": ncloc,
        "cloc": cloc,
    }


def recorrer_proyecto(ruta_base: str):
    base = Path(ruta_base).resolve()
    if not base.exists():
        print(f"Error: la ruta '{ruta_base}' no existe.")
        sys.exit(1)

    resultados = []
    totales = {"loc": 0, "ncloc": 0, "cloc": 0}

    for root, dirs, files in os.walk(base):
        # Filtrar carpetas ignoradas
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            path = Path(root) / file
            if path.suffix not in EXTENSIONS:
                continue

            metricas = analizar_archivo(path)
            if metricas is None:
                continue

            rel = path.relative_to(base)
            resultados.append((str(rel), metricas))
            totales["loc"] += metricas["loc"]
            totales["ncloc"] += metricas["ncloc"]
            totales["cloc"] += metricas["cloc"]

    return resultados, totales


def imprimir_reporte(resultados, totales):
    print("\n" + "=" * 72)
    print("  MÉTRICAS DE TAMAÑO DEL CÓDIGO FUENTE")
    print("=" * 72)
    print(f"{'Archivo':<48} {'LOC':>6} {'NCLOC':>7} {'CLOC':>6} {'DC':>7}")
    print("-" * 72)

    for rel, m in sorted(resultados, key=lambda x: -x[1]["loc"]):
        dc = (m["cloc"] / m["loc"] * 100) if m["loc"] > 0 else 0
        nombre = rel if len(rel) <= 48 else "…" + rel[-47:]
        print(f"{nombre:<48} {m['loc']:>6} {m['ncloc']:>7} {m['cloc']:>6} {dc:>6.1f}%")

    print("=" * 72)
    dc_total = (totales["cloc"] / totales["loc"] * 100) if totales["loc"] > 0 else 0
    print(f"{'TOTAL':<48} {totales['loc']:>6} {totales['ncloc']:>7} {totales['cloc']:>6} {dc_total:>6.1f}%")
    print("=" * 72)

    print("\n📊 RESUMEN")
    print(f"  LOC total   : {totales['loc']:,}")
    print(f"  NCLOC       : {totales['ncloc']:,}  (líneas de código efectivas)")
    print(f"  CLOC        : {totales['cloc']:,}  (líneas comentadas)")
    print(f"  DC          : {dc_total:.1f}%  (densidad de comentarios)")
    kloc = totales["loc"] / 1000
    print(f"  KLOC        : {kloc:.2f}")
    print()

    # Guardar CSV
    csv_path = "loc_metricas.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("Archivo,LOC,NCLOC,CLOC,DC\n")
        for rel, m in resultados:
            dc = (m["cloc"] / m["loc"] * 100) if m["loc"] > 0 else 0
            f.write(f"{rel},{m['loc']},{m['ncloc']},{m['cloc']},{dc:.2f}\n")
        dc_total_val = (totales["cloc"] / totales["loc"] * 100) if totales["loc"] > 0 else 0
        f.write(f"TOTAL,{totales['loc']},{totales['ncloc']},{totales['cloc']},{dc_total_val:.2f}\n")
    print(f"  CSV guardado en: {os.path.abspath(csv_path)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Si no se pasa argumento, usa el directorio actual
        ruta = "."
    else:
        ruta = sys.argv[1]

    print(f"Analizando: {Path(ruta).resolve()}")
    resultados, totales = recorrer_proyecto(ruta)

    if not resultados:
        print("No se encontraron archivos .ts/.tsx/.js/.jsx")
        sys.exit(0)

    imprimir_reporte(resultados, totales)