# Análisis de Pruebas — Formulario de Registro

## Reglas de validación extraídas del código fuente

Las reglas se obtuvieron de dos fuentes:

| Fuente | Archivo |
|--------|---------|
| Validación en cliente (React Hook Form) | `app/registro/page.tsx` |
| Validación en servidor (Zod schema) | `lib/schemas/auth.ts` |

---

## 1. Tabla de clases de equivalencia

| N.° | Campo | Clase | Tipo | Regla heurística aplicada | Valor de Ejemplo |
|-----|-------|-------|------|--------------------------|------------------|
| CE-01 | Nombre completo | Nombre con exactamente 2 caracteres | Válida | Valor en límite inferior exacto (longitud mínima permitida) | `"Al"` |
| CE-02 | Nombre completo | Nombre con longitud entre 3 y 254 caracteres | Válida | Rango normal dentro de los límites | `"Juan Pérez"` |
| CE-03 | Nombre completo | Nombre con 1 carácter | Inválida | Valor por debajo del mínimo | `"A"` |
| CE-04 | Nombre completo | Cadena vacía / solo espacios | Inválida | Campo obligatorio vacío | `""` |
| CE-05 | Nombre completo | Valor nulo o ausente | Inválida | Campo requerido no enviado | `null` |
| CE-06 | Teléfono | Exactamente 7 dígitos numéricos | Válida | Valor en límite inferior exacto | `"3001234"` |
| CE-07 | Teléfono | Entre 8 y 14 dígitos numéricos | Válida | Rango normal dentro de los límites | `"3001234567"` |
| CE-08 | Teléfono | Exactamente 15 dígitos numéricos | Válida | Valor en límite superior exacto | `"300123456789012"` |
| CE-09 | Teléfono | Campo vacío / omitido | Válida | Campo opcional, acepta cadena vacía o ausencia de valor | `""` |
| CE-10 | Teléfono | Menos de 7 dígitos (1–6 dígitos) | Inválida | Por debajo del mínimo permitido | `"12345"` |
| CE-11 | Teléfono | Más de 15 dígitos (≥16 dígitos) | Inválida | Supera el máximo permitido | `"3001234567890123"` |
| CE-12 | Teléfono | Contiene letras o caracteres especiales | Inválida | No cumple el patrón `/^\d{7,15}$/` | `"300abc123"` |
| CE-13 | Correo electrónico | Dirección de correo con formato válido | Válida | Contiene `@`, dominio y TLD | `"usuario@dominio.com"` |
| CE-14 | Correo electrónico | Correo con subdominio válido | Válida | Formato extendido permitido por RFC | `"user@mail.empresa.co"` |
| CE-15 | Correo electrónico | Sin símbolo `@` | Inválida | Falta delimitador obligatorio | `"usuariodominio.com"` |
| CE-16 | Correo electrónico | Sin dominio tras `@` | Inválida | Dominio vacío o ausente | `"usuario@"` |
| CE-17 | Correo electrónico | Sin TLD (extensión de dominio) | Inválida | Falta punto y extensión | `"usuario@dominio"` |
| CE-18 | Correo electrónico | Cadena vacía / omitida | Inválida | Campo requerido vacío | `""` |
| CE-19 | Contraseña | Exactamente 6 caracteres | Válida | Valor en límite inferior exacto | `"abc123"` |
| CE-20 | Contraseña | Más de 6 caracteres (7–255 caracteres) | Válida | Rango normal dentro del límite | `"segura2024"` |
| CE-21 | Contraseña | Menos de 6 caracteres (1–5) | Inválida | Por debajo del mínimo permitido | `"abc1"` |
| CE-22 | Contraseña | Cadena vacía / omitida | Inválida | Campo requerido vacío | `""` |
| CE-23 | Confirmar contraseña | Valor idéntico al campo Contraseña | Válida | Las dos contraseñas coinciden | `"abc123"` (igual que Contraseña) |
| CE-24 | Confirmar contraseña | Valor diferente al campo Contraseña | Inválida | Las contraseñas no coinciden | `"abc124"` (distinto a Contraseña) |
| CE-25 | Confirmar contraseña | Cadena vacía / omitida | Inválida | Campo requerido vacío | `""` |

---

## 2. Tabla de casos de prueba con valores límite

| N.° | Campo | Tipo de límite | Valor de prueba | Resultado esperado |
|-----|-------|---------------|-----------------|-------------------|
| VL-01 | Nombre completo | Límite inferior – 1 (inválido) | `"A"` (1 carácter) | Error: "Nombre demasiado corto" |
| VL-02 | Nombre completo | Límite inferior exacto (válido) | `"Al"` (2 caracteres) | Aceptado |
| VL-03 | Nombre completo | Límite inferior + 1 (válido) | `"Ali"` (3 caracteres) | Aceptado |
| VL-04 | Nombre completo | Cadena vacía (inválido) | `""` (0 caracteres) | Error: "El nombre es obligatorio" |
| VL-05 | Teléfono | Límite inferior – 1 (inválido) | `"123456"` (6 dígitos) | Error: "Teléfono inválido" |
| VL-06 | Teléfono | Límite inferior exacto (válido) | `"1234567"` (7 dígitos) | Aceptado |
| VL-07 | Teléfono | Límite inferior + 1 (válido) | `"12345678"` (8 dígitos) | Aceptado |
| VL-08 | Teléfono | Límite superior – 1 (válido) | `"12345678901234"` (14 dígitos) | Aceptado |
| VL-09 | Teléfono | Límite superior exacto (válido) | `"123456789012345"` (15 dígitos) | Aceptado |
| VL-10 | Teléfono | Límite superior + 1 (inválido) | `"1234567890123456"` (16 dígitos) | Error: "Teléfono inválido" |
| VL-11 | Teléfono | Campo vacío (válido, opcional) | `""` | Aceptado (campo opcional) |
| VL-12 | Correo electrónico | Formato mínimo válido | `"a@b.co"` | Aceptado |
| VL-13 | Correo electrónico | Sin `@` (inválido) | `"usuariodominio.com"` | Error: "Correo inválido" |
| VL-14 | Correo electrónico | Solo `@` y TLD (inválido) | `"@dominio.com"` | Error: "Correo inválido" |
| VL-15 | Correo electrónico | Sin TLD (inválido) | `"usuario@dominio"` | Error: "Correo inválido" |
| VL-16 | Correo electrónico | Cadena vacía (inválido) | `""` | Error: "El correo es obligatorio" |
| VL-17 | Contraseña | Límite inferior – 1 (inválido) | `"abc12"` (5 caracteres) | Error: "La contraseña debe tener al menos 6 caracteres" |
| VL-18 | Contraseña | Límite inferior exacto (válido) | `"abc123"` (6 caracteres) | Aceptado |
| VL-19 | Contraseña | Límite inferior + 1 (válido) | `"abc1234"` (7 caracteres) | Aceptado |
| VL-20 | Contraseña | Cadena vacía (inválido) | `""` | Error: "La contraseña es obligatoria" |
| VL-21 | Confirmar contraseña | Igual a contraseña (válido) | Mismo valor que Contraseña | Aceptado |
| VL-22 | Confirmar contraseña | Diferente a contraseña (inválido) | Valor distinto a Contraseña | Error: "Las contraseñas no coinciden" |
| VL-23 | Confirmar contraseña | Cadena vacía (inválido) | `""` | Error: "Confirma la contraseña" |

---

## 3. Tablas de ejemplos de prueba para valores límite

### 3.1 Campo: Nombre completo

| Clase | Dato de Entrada | Valor | Escenario | Resultado Esperado |
|-------|-----------------|-------|-----------|-------------------|
| CE-04 | Nombre vacío | `""` | Intentar enviar el formulario sin ingresar nombre | Error: "El nombre es obligatorio" |
| CE-03 / VL-01 | Nombre de 1 carácter | `"A"` | Ingresar un solo carácter en el campo nombre | Error: "Nombre demasiado corto" |
| CE-01 / VL-02 | Nombre de 2 caracteres | `"Al"` | Ingresar exactamente 2 caracteres | Aceptado |
| CE-01 / VL-03 | Nombre de 3 caracteres | `"Ali"` | Ingresar 3 caracteres (un dígito sobre el mínimo) | Aceptado |
| CE-02 | Nombre típico | `"Juan Pérez"` | Nombre y apellido completos, formato habitual | Aceptado |

### 3.2 Campo: Teléfono

| Clase | Dato de Entrada | Valor | Escenario | Resultado Esperado |
|-------|-----------------|-------|-----------|-------------------|
| CE-09 / VL-11 | Teléfono omitido | `""` | Dejar el campo en blanco (campo opcional) | Aceptado |
| CE-10 / VL-05 | 6 dígitos | `"123456"` | Ingresar un dígito por debajo del mínimo | Error: "Teléfono inválido" |
| CE-06 / VL-06 | 7 dígitos | `"1234567"` | Ingresar exactamente el mínimo de dígitos | Aceptado |
| CE-07 / VL-07 | 8 dígitos | `"12345678"` | Ingresar un dígito sobre el mínimo | Aceptado |
| CE-07 | Teléfono típico | `"3001234567"` | Número local de 10 dígitos, caso más común | Aceptado |
| CE-08 / VL-08 | 14 dígitos | `"12345678901234"` | Un dígito por debajo del máximo | Aceptado |
| CE-08 / VL-09 | 15 dígitos | `"123456789012345"` | Exactamente el máximo de dígitos | Aceptado |
| CE-11 / VL-10 | 16 dígitos | `"1234567890123456"` | Un dígito sobre el máximo | Error: "Teléfono inválido" |
| CE-12 | Con letras | `"300abc1234"` | Contiene caracteres no numéricos | Error: "Teléfono inválido" |
| CE-12 | Con guión | `"300-123-4567"` | Incluye guiones separadores | Error: "Teléfono inválido" |

### 3.3 Campo: Correo electrónico

| Clase | Dato de Entrada | Valor | Escenario | Resultado Esperado |
|-------|-----------------|-------|-----------|-------------------|
| CE-18 / VL-16 | Correo vacío | `""` | No ingresar correo | Error: "El correo es obligatorio" |
| CE-15 / VL-13 | Sin arroba | `"usuariodominio.com"` | Dirección sin símbolo `@` | Error: "Correo inválido" |
| CE-16 / VL-14 | Sólo arroba y dominio | `"@dominio.com"` | Parte local vacía | Error: "Correo inválido" |
| CE-17 / VL-15 | Sin extensión | `"usuario@dominio"` | Falta punto y TLD | Error: "Correo inválido" |
| CE-13 / VL-12 | Formato mínimo válido | `"a@b.co"` | Correo más corto posible con formato correcto | Aceptado |
| CE-13 | Correo estándar | `"usuario@ejemplo.com"` | Dirección de correo común | Aceptado |
| CE-14 | Correo con subdominio | `"user@mail.empresa.co"` | Correo corporativo con subdominio | Aceptado |

### 3.4 Campo: Contraseña

| Clase | Dato de Entrada | Valor | Escenario | Resultado Esperado |
|-------|-----------------|-------|-----------|-------------------|
| CE-22 / VL-20 | Contraseña vacía | `""` | No ingresar contraseña | Error: "La contraseña es obligatoria" |
| CE-21 / VL-17 | 5 caracteres | `"abc12"` | Un carácter por debajo del mínimo | Error: "La contraseña debe tener al menos 6 caracteres" |
| CE-19 / VL-18 | 6 caracteres | `"abc123"` | Exactamente el mínimo requerido | Aceptado |
| CE-20 / VL-19 | 7 caracteres | `"abc1234"` | Un carácter sobre el mínimo | Aceptado |
| CE-20 | Contraseña robusta | `"MiClave#2024!"` | Contraseña con mayúsculas, dígitos y especiales | Aceptado |

### 3.5 Campo: Confirmar contraseña

| Clase | Dato de Entrada | Valor | Escenario | Resultado Esperado |
|-------|-----------------|-------|-----------|-------------------|
| CE-25 / VL-23 | Campo vacío | `""` | No repetir la contraseña | Error: "Confirma la contraseña" |
| CE-24 / VL-22 | No coincide | `"abc124"` (contraseña: `"abc123"`) | El valor difiere en un carácter respecto a la contraseña | Error: "Las contraseñas no coinciden" |
| CE-24 | Valor con diferente capitalización | `"Abc123"` (contraseña: `"abc123"`) | Misma cadena pero con una mayúscula diferente; al ser case-sensitive, los valores no coinciden | Error: "Las contraseñas no coinciden" |
| CE-23 / VL-21 | Coincide exactamente | `"abc123"` (contraseña: `"abc123"`) | Las dos contraseñas son idénticas | Aceptado |

---

## Resumen de validaciones

| Campo | Obligatorio | Mínimo | Máximo | Patrón / Formato |
|-------|-------------|--------|--------|-----------------|
| Nombre completo | Sí | 2 caracteres | — | Cualquier cadena no vacía |
| Teléfono | No (opcional) | 7 dígitos | 15 dígitos | Solo dígitos `0-9` (`/^\d{7,15}$/`) |
| Correo electrónico | Sí | — | — | Formato RFC (`[^@\s]+@[^@\s]+\.[^@\s]+`) |
| Contraseña | Sí | 6 caracteres | — | Cualquier cadena |
| Confirmar contraseña | Sí | — | — | Debe ser idéntico al campo Contraseña |
