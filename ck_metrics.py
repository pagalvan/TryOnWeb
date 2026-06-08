"""
Métricas CK (Chidamber & Kemerer) para TypeScript/Next.js funcional
Columnas: Clase/Componente | No métodos | WMC | DIT | CBO | LCOM
Uso: python ck_metrics.py
"""

import os
import re
import sys
from pathlib import Path

EXTENSIONS = {".ts", ".tsx"}
IGNORE_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out", ".turbo", "coverage", "public", "scripts"}
ANALYZE_DIRS = {"app", "components", "lib", "hooks", "types"}

# ─── Regex ────────────────────────────────────────────────────────────────────
RE_FUNC       = re.compile(r'(?:export\s+)?(?:const|function|async function)\s+([a-zA-Z_]\w*)\s*[=:(]', re.MULTILINE)
RE_ARROW      = re.compile(r'(?:export\s+)?const\s+([a-zA-Z_]\w*)\s*=\s*(?:async\s+)?\(', re.MULTILINE)
RE_IMPORT     = re.compile(r"^import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]", re.MULTILINE)
RE_COMP_CALL  = re.compile(r'<([A-Z][a-zA-Z]+)', re.MULTILINE)  # componentes usados
RE_HOOK_CALL  = re.compile(r'\buse[A-Z]\w+\s*\(', re.MULTILINE)
RE_IF         = re.compile(r'\bif\s*\(')
RE_ELSE       = re.compile(r'\belse\s*\{')
RE_FOR        = re.compile(r'\bfor\s*\(')
RE_WHILE      = re.compile(r'\bwhile\s*\(')
RE_CASE       = re.compile(r'\bcase\s+')
RE_TERNARY    = re.compile(r'\?\s*[^:\n]+\s*:')
RE_AND_OR     = re.compile(r'&&|\|\|')
RE_CATCH      = re.compile(r'\bcatch\s*\(')
RE_EXTENDS    = re.compile(r'\bextends\s+(\w+)')


def calcular_complejidad(bloque: str) -> int:
    """Complejidad ciclomática = 1 + decisiones"""
    cc = 1
    cc += len(RE_IF.findall(bloque))
    cc += len(RE_FOR.findall(bloque))
    cc += len(RE_WHILE.findall(bloque))
    cc += len(RE_CASE.findall(bloque))
    cc += len(RE_AND_OR.findall(bloque))
    cc += len(RE_CATCH.findall(bloque))
    cc += len(RE_TERNARY.findall(bloque))
    return cc


def extraer_funciones(contenido: str):
    """Retorna lista de nombres de funciones/componentes encontrados."""
    nombres = set()
    for m in RE_FUNC.finditer(contenido):
        n = m.group(1)
        if n not in {"if", "for", "while", "switch", "return", "import", "from"}:
            nombres.add(n)
    for m in RE_ARROW.finditer(contenido):
        n = m.group(1)
        if n not in {"if", "for", "while", "switch", "return"}:
            nombres.add(n)
    return list(nombres)


def calcular_dit(contenido: str) -> int:
    """DIT: profundidad de herencia. En funcional = niveles de composición/extends."""
    extends = RE_EXTENDS.findall(contenido)
    # En React funcional, DIT se basa en si extiende algo
    if extends:
        return len(extends) + 1
    # Si usa hooks de otras librerías = nivel 1 de composición
    hooks = RE_HOOK_CALL.findall(contenido)
    if hooks:
        return 1
    return 0


def calcular_cbo(contenido: str, ruta_base: Path, archivo: Path) -> int:
    """CBO: acoplamiento = número de imports externos + componentes usados."""
    imports = RE_IMPORT.findall(contenido)
    externos = 0
    for imp in imports:
        # Imports externos (no relativos)
        if not imp.startswith(".") and not imp.startswith("@/"):
            externos += 1
        else:
            externos += 1  # imports internos también cuentan como acoplamiento
    # Componentes React usados desde otros módulos
    comp_usados = set(RE_COMP_CALL.findall(contenido))
    cbo = len(imports) + len(comp_usados)
    return min(cbo, 99)  # cap para outliers


def calcular_lcom(num_metodos: int, num_vars: int) -> float:
    """
    LCOM simplificado: si métodos no comparten variables → falta cohesión.
    LCOM = 1 - (variables compartidas / métodos)
    Aproximación: LCOM bajo = alta cohesión.
    """
    if num_metodos == 0:
        return 0.0
    # Aproximación: hooks y props compartidos = cohesión
    cohesion = min(num_vars / max(num_metodos, 1), 1.0)
    lcom = round(1.0 - cohesion, 2)
    return lcom


def analizar_archivo(path: Path, ruta_base: Path):
    try:
        contenido = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return None

    funciones = extraer_funciones(contenido)
    num_metodos = len(funciones)

    if num_metodos == 0:
        return None

    # WMC = suma de complejidades ciclomáticas de todos los métodos
    # Aproximación: calcular sobre todo el archivo
    wmc = calcular_complejidad(contenido)

    dit  = calcular_dit(contenido)
    cbo  = calcular_cbo(contenido, ruta_base, path)

    # NIV para LCOM: contar variables/props/hooks
    hooks = len(RE_HOOK_CALL.findall(contenido))
    lcom = calcular_lcom(num_metodos, hooks)

    # Nombre del componente = nombre del archivo sin extensión
    nombre = path.stem

    return {
        "nombre": nombre,
        "archivo": str(path.relative_to(ruta_base)),
        "NM": num_metodos,      # Número de métodos
        "WMC": wmc,             # Weighted Methods per Class
        "DIT": dit,             # Depth of Inheritance Tree
        "CBO": cbo,             # Coupling Between Objects
        "LCOM": lcom,           # Lack of Cohesion
    }


def recorrer_proyecto(ruta_base: Path):
    resultados = []
    for carpeta in ANALYZE_DIRS:
        carpeta_path = ruta_base / carpeta
        if not carpeta_path.exists():
            continue
        for root, dirs, files in os.walk(carpeta_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file in files:
                path = Path(root) / file
                if path.suffix not in EXTENSIONS:
                    continue
                r = analizar_archivo(path, ruta_base)
                if r:
                    resultados.append(r)
    return resultados


def imprimir_reporte(datos):
    if not datos:
        print("No se encontraron componentes.")
        return

    print("\n" + "=" * 95)
    print("  MÉTRICAS CK — TryOnWeb (Next.js / TypeScript)")
    print("=" * 95)
    print(f"{'Clase/Componente':<30} {'No Métodos':>10} {'WMC':>6} {'DIT':>5} {'CBO':>6} {'LCOM':>6}  Archivo")
    print("-" * 95)

    for d in sorted(datos, key=lambda x: x["nombre"]):
        archivo = d["archivo"] if len(d["archivo"]) <= 35 else "…" + d["archivo"][-34:]
        print(f"{d['nombre']:<30} {d['NM']:>10} {d['WMC']:>6} {d['DIT']:>5} {d['CBO']:>6} {d['LCOM']:>6}  {archivo}")

    n = len(datos)
    nm_t   = sum(d["NM"]   for d in datos)
    wmc_t  = sum(d["WMC"]  for d in datos)
    dit_t  = sum(d["DIT"]  for d in datos)
    cbo_t  = sum(d["CBO"]  for d in datos)
    lcom_t = sum(d["LCOM"] for d in datos)

    print("=" * 95)
    print(f"{'TOTALES':<30} {nm_t:>10} {wmc_t:>6} {dit_t:>5} {cbo_t:>6} {lcom_t:>6.2f}")
    print(f"{'PROMEDIO':<30} {nm_t/n:>10.1f} {wmc_t/n:>6.1f} {dit_t/n:>5.1f} {cbo_t/n:>6.1f} {lcom_t/n:>6.2f}")
    print("=" * 95)

    print("\n📊 INTERPRETACIÓN")
    wmc_avg = wmc_t / n
    cbo_avg = cbo_t / n
    dit_avg = dit_t / n
    lcom_avg = lcom_t / n

    print(f"  WMC promedio : {wmc_avg:.1f}  {'⚠️  Alta complejidad por componente' if wmc_avg > 10 else '✅ Complejidad aceptable'}")
    print(f"  DIT promedio : {dit_avg:.1f}  {'⚠️  Jerarquía profunda' if dit_avg > 3 else '✅ Herencia poco profunda (esperado en React)'}")
    print(f"  CBO promedio : {cbo_avg:.1f}  {'⚠️  Alto acoplamiento' if cbo_avg > 14 else '✅ Acoplamiento moderado'}")
    print(f"  LCOM promedio: {lcom_avg:.2f}  {'✅ Alta cohesión' if lcom_avg < 0.5 else '⚠️  Baja cohesión, considerar refactorizar'}")

    # Guardar CSV
    csv_path = "ck_metricas.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("Clase/Componente,No Métodos,WMC,DIT,CBO,LCOM,Archivo\n")
        for d in datos:
            f.write(f"{d['nombre']},{d['NM']},{d['WMC']},{d['DIT']},{d['CBO']},{d['LCOM']},{d['archivo']}\n")
        f.write(f"TOTAL,{nm_t},{wmc_t},{dit_t},{cbo_t},{lcom_t:.2f},\n")
        f.write(f"PROMEDIO,{nm_t/n:.1f},{wmc_t/n:.1f},{dit_t/n:.1f},{cbo_t/n:.1f},{lcom_t/n:.2f},\n")
    print(f"\n  CSV guardado en: {os.path.abspath(csv_path)}")


if __name__ == "__main__":
    ruta = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(".").resolve()
    print(f"Analizando: {ruta}")
    datos = recorrer_proyecto(ruta)
    imprimir_reporte(datos)