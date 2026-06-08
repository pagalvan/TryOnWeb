"""
Métricas de Tamaño Orientadas a Objetos para TypeScript/Next.js
PIM, NIM, NIV, NCM, NCV por clase/componente
Uso: python oo_metrics.py <ruta_proyecto>
"""

import os
import re
import sys
from pathlib import Path

EXTENSIONS = {".ts", ".tsx"}
IGNORE_DIRS = {"node_modules", ".next", ".git", "dist", "build", "out", ".turbo", "coverage"}

# ─── Patrones regex ────────────────────────────────────────────────────────────
RE_CLASS        = re.compile(r'^\s*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)', re.MULTILINE)
RE_PUB_METHOD   = re.compile(r'^\s*public\s+(?!static)(\w+)\s*\(', re.MULTILINE)
RE_ALL_METHOD   = re.compile(r'^\s*(?:public|private|protected|override)?\s*(?!static)(?!readonly)(\w+)\s*\([^)]*\)\s*(?::\s*\S+)?\s*\{', re.MULTILINE)
RE_INSTANCE_VAR = re.compile(r'^\s*(?:public|private|protected|readonly)\s+(?!static)(\w+)\s*[=:!?]', re.MULTILINE)
RE_STATIC_M     = re.compile(r'^\s*(?:public|private|protected)?\s*static\s+(\w+)\s*\(', re.MULTILINE)
RE_STATIC_V     = re.compile(r'^\s*(?:public|private|protected)?\s*static\s+(?!readonly)(\w+)\s*[=:!?]', re.MULTILINE)

# Componentes funcionales React
RE_FUNC_COMP    = re.compile(r'(?:export\s+(?:default\s+)?)?(?:const|function)\s+([A-Z]\w+)\s*[=:(]', re.MULTILINE)
RE_HOOK         = re.compile(r'\buse[A-Z]\w+\s*\(', re.MULTILINE)
RE_PROPS        = re.compile(r'interface\s+\w*Props\s*\{([^}]*)\}', re.DOTALL)
RE_PROP_FIELD   = re.compile(r'^\s+(\w+)\??:', re.MULTILINE)


def extraer_bloques_clase(contenido):
    """Extrae el contenido de cada bloque class {}"""
    bloques = []
    for m in RE_CLASS.finditer(contenido):
        nombre = m.group(1)
        inicio = m.end()
        # Buscar el bloque { } correspondiente
        depth = 0
        i = inicio
        bloque_inicio = None
        while i < len(contenido):
            if contenido[i] == '{':
                depth += 1
                if bloque_inicio is None:
                    bloque_inicio = i
            elif contenido[i] == '}':
                depth -= 1
                if depth == 0 and bloque_inicio is not None:
                    bloques.append((nombre, contenido[bloque_inicio:i+1]))
                    break
            i += 1
    return bloques


def analizar_clase(nombre, bloque):
    pub_methods   = len(RE_PUB_METHOD.findall(bloque))
    all_methods   = len(RE_ALL_METHOD.findall(bloque))
    instance_vars = len(RE_INSTANCE_VAR.findall(bloque))
    static_meth   = len(RE_STATIC_M.findall(bloque))
    static_vars   = len(RE_STATIC_V.findall(bloque))
    return {
        "nombre": nombre,
        "tipo": "Clase",
        "PIM": pub_methods,
        "NIM": all_methods,
        "NIV": instance_vars,
        "NCM": static_meth,
        "NCV": static_vars,
    }


def analizar_componente_funcional(nombre, contenido):
    hooks = len(RE_HOOK.findall(contenido))
    # Contar props de la interfaz si existe
    props_count = 0
    for m in RE_PROPS.finditer(contenido):
        props_count += len(RE_PROP_FIELD.findall(m.group(1)))
    return {
        "nombre": nombre,
        "tipo": "Componente",
        "PIM": 1,           # el componente mismo es una función pública
        "NIM": hooks,       # hooks = operaciones de instancia equivalentes
        "NIV": props_count, # props = variables de instancia equivalentes
        "NCM": 0,
        "NCV": 0,
    }


def analizar_archivo(path):
    try:
        contenido = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return []

    resultados = []

    # Analizar clases
    bloques = extraer_bloques_clase(contenido)
    for nombre, bloque in bloques:
        resultados.append(analizar_clase(nombre, bloque))

    # Si no hay clases, buscar componentes funcionales React
    if not bloques and path.suffix == ".tsx":
        for m in RE_FUNC_COMP.finditer(contenido):
            nombre = m.group(1)
            resultados.append(analizar_componente_funcional(nombre, contenido))
            break  # un componente por archivo

    return resultados


def recorrer_proyecto(ruta_base):
    base = Path(ruta_base).resolve()
    if not base.exists():
        print(f"Error: '{ruta_base}' no existe.")
        sys.exit(1)

    todos = []
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            path = Path(root) / file
            if path.suffix not in EXTENSIONS:
                continue
            rel = str(path.relative_to(base))
            items = analizar_archivo(path)
            for item in items:
                item["archivo"] = rel
                todos.append(item)

    return todos


def imprimir_reporte(datos):
    if not datos:
        print("No se encontraron clases ni componentes.")
        return

    print("\n" + "=" * 90)
    print("  MÉTRICAS OO DE TAMAÑO — TypeScript/Next.js")
    print("=" * 90)
    print(f"{'Clase/Componente':<30} {'Tipo':<12} {'PIM':>5} {'NIM':>5} {'NIV':>5} {'NCM':>5} {'NCV':>5}  Archivo")
    print("-" * 90)

    for d in sorted(datos, key=lambda x: x["nombre"]):
        archivo = d["archivo"] if len(d["archivo"]) <= 35 else "…" + d["archivo"][-34:]
        print(f"{d['nombre']:<30} {d['tipo']:<12} {d['PIM']:>5} {d['NIM']:>5} {d['NIV']:>5} {d['NCM']:>5} {d['NCV']:>5}  {archivo}")

    # Promedios
    n = len(datos)
    pim_avg = sum(d["PIM"] for d in datos) / n
    nim_avg = sum(d["NIM"] for d in datos) / n
    niv_avg = sum(d["NIV"] for d in datos) / n
    ncm_avg = sum(d["NCM"] for d in datos) / n
    ncv_avg = sum(d["NCV"] for d in datos) / n

    print("=" * 90)
    print(f"{'PROMEDIO SISTEMA':<30} {'':12} {pim_avg:>5.1f} {nim_avg:>5.1f} {niv_avg:>5.1f} {ncm_avg:>5.1f} {ncv_avg:>5.1f}")
    print(f"{'TOTAL clases/comps':<30} {n:>5}")
    print("=" * 90)

    print("\n📊 RESUMEN DE MÉTRICAS")
    print(f"  PIM promedio (métodos públicos de instancia) : {pim_avg:.2f}")
    print(f"  NIM promedio (todos los métodos instancia)   : {nim_avg:.2f}")
    print(f"  NIV promedio (variables de instancia)        : {niv_avg:.2f}")
    print(f"  NCM promedio (métodos de clase/estáticos)    : {ncm_avg:.2f}")
    print(f"  NCV promedio (variables de clase/estáticas)  : {ncv_avg:.2f}")

    # Interpretación automática
    print("\n📝 INTERPRETACIÓN AUTOMÁTICA")
    if nim_avg > 10:
        print("  ⚠️  NIM alto: algunas clases pueden tener demasiada responsabilidad.")
    else:
        print("  ✅  NIM aceptable: responsabilidades bien distribuidas.")
    if niv_avg > 8:
        print("  ⚠️  NIV alto: considerar dividir clases con muchas variables.")
    else:
        print("  ✅  NIV aceptable: bajo acoplamiento de datos.")
    if pim_avg < 3:
        print("  ✅  PIM bajo: alta probabilidad de reutilización de clases.")

    # Guardar CSV
    csv_path = "oo_metricas.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("Clase/Componente,Tipo,PIM,NIM,NIV,NCM,NCV,Archivo\n")
        for d in datos:
            f.write(f"{d['nombre']},{d['tipo']},{d['PIM']},{d['NIM']},{d['NIV']},{d['NCM']},{d['NCV']},{d['archivo']}\n")
        f.write(f"PROMEDIO,,{pim_avg:.2f},{nim_avg:.2f},{niv_avg:.2f},{ncm_avg:.2f},{ncv_avg:.2f},\n")
    print(f"\n  CSV guardado en: {os.path.abspath(csv_path)}")


if __name__ == "__main__":
    ruta = sys.argv[1] if len(sys.argv) > 1 else "."
    print(f"Analizando: {Path(ruta).resolve()}")
    datos = recorrer_proyecto(ruta)
    imprimir_reporte(datos)