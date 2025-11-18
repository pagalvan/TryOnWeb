import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import * as XLSX from "xlsx-js-style"

import { ensureAdmin } from "@/lib/auth/session"
import { getDashboardOverview, getReportsOverview } from "@/lib/services/analytics.server"
import type { DashboardFiltersInput, DashboardOverview, ReportsOverview } from "@/lib/types/analytics"

export const runtime = "nodejs"

const numberFormatter = new Intl.NumberFormat("es-CO")
const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
})

const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
})

const plainDateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
})

const formatNumber = (value: number) => numberFormatter.format(Math.round(value))
const formatCurrency = (value: number) => currencyFormatter.format(Math.round(value))
const formatDateTime = (value: string | Date) => dateTimeFormatter.format(new Date(value))
const formatPlainDate = (value: string | Date) => plainDateFormatter.format(new Date(value))

const DEFAULT_FILE_BASENAME = "dashboard-tryonweb"

const parseFiltersFromParams = (params: URLSearchParams): DashboardFiltersInput => ({
  from: params.get("from") ?? undefined,
  to: params.get("to") ?? undefined,
  categoryId: params.get("categoryId") ?? undefined,
  location: params.get("location") ?? undefined,
  stockStatus: (params.get("stockStatus") as DashboardFiltersInput["stockStatus"]) ?? undefined,
})

const STOCK_STATUS_LABELS: Record<NonNullable<DashboardFiltersInput["stockStatus"]>, string> = {
  all: "Todos",
  warning: "Bajo",
  critical: "Crítico",
}

const getFilterDisplayInfo = (dashboard: DashboardOverview, filters: DashboardFiltersInput) => {
  const availableCategories = dashboard.context?.availableFilters?.categories ?? []
  const categoryLookup = new Map(availableCategories.map((category) => [category.id, category.nombre]))
  for (const category of dashboard.categories) {
    if (!categoryLookup.has(category.id)) {
      categoryLookup.set(category.id, category.nombre)
    }
  }

  const categoryName = filters.categoryId
    ? categoryLookup.get(filters.categoryId) ?? filters.categoryId
    : "Todas"

  const hasCategoryFilter = Boolean(filters.categoryId)
  const locationName = filters.location ?? "Todas"
  const hasLocationFilter = Boolean(filters.location)
  const normalizedStockStatus = (filters.stockStatus ?? "all") as NonNullable<DashboardFiltersInput["stockStatus"]>
  const stockLabel = STOCK_STATUS_LABELS[normalizedStockStatus] ?? normalizedStockStatus
  const stockIsFiltered = normalizedStockStatus !== "all"

  return {
    categoryName,
    hasCategoryFilter,
    locationName,
    hasLocationFilter,
    stockLabel,
    stockIsFiltered,
  }
}

type ExportPayload = {
  dashboard: DashboardOverview
  reports: ReportsOverview
  filters: DashboardFiltersInput
}

export const createPdfBuffer = async ({ dashboard, reports, filters }: ExportPayload) => {
  const doc = await PDFDocument.create()
  const regularFont = await doc.embedFont(StandardFonts.Helvetica)
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)

  const palette = {
    navy: rgb(0.07, 0.16, 0.33),
    accent: rgb(0.16, 0.41, 0.76),
    text: rgb(0.13, 0.16, 0.24),
    muted: rgb(0.37, 0.43, 0.5),
    badgeBg: rgb(0.9, 0.94, 1),
    badgeBorder: rgb(0.7, 0.81, 0.95),
    cardBg: rgb(0.97, 0.98, 1),
    cardBorder: rgb(0.82, 0.88, 0.96),
    tableHeader: rgb(0.87, 0.92, 0.98),
    tableRow: rgb(0.95, 0.97, 1),
    axis: rgb(0.75, 0.79, 0.84),
  }

  const margin = 48
  let page = doc.addPage()
  let cursorY = page.getHeight() - margin
  const pageWidth = page.getWidth()
  const contentWidth = pageWidth - margin * 2

  const addPage = () => {
    page = doc.addPage()
    cursorY = page.getHeight() - margin
  }

  const ensureSpace = (height: number) => {
    if (cursorY - height < margin) {
      addPage()
    }
  }

  const drawParagraph = (
    text: string,
    options?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; spacing?: number },
  ) => {
    const { size = 11, bold = false, color = palette.text, spacing = 6 } = options ?? {}
    const font = bold ? boldFont : regularFont
    const lines = wrapText(text, font, size, contentWidth)
    lines.forEach((line) => {
      ensureSpace(size + spacing)
      page.drawText(line, { x: margin, y: cursorY - size, size, font, color })
      cursorY -= size + spacing
    })
  }

  const drawSectionTitle = (title: string) => {
    ensureSpace(36)
    const titleY = cursorY - 18
    page.drawText(title, { x: margin, y: titleY, size: 14, font: boldFont, color: palette.navy })
    page.drawRectangle({ x: margin, y: titleY - 4, width: 80, height: 2, color: palette.accent })
    cursorY -= 36
  }

  const drawBadgeRow = (badges: string[]) => {
    if (badges.length === 0) {
      return
    }
    const badgeHeight = 22
    let x = margin
    ensureSpace(badgeHeight + 20)
    badges.forEach((badge) => {
      const textWidth = regularFont.widthOfTextAtSize(badge, 10)
      const badgeWidth = textWidth + 16
      if (x + badgeWidth > pageWidth - margin) {
        cursorY -= badgeHeight + 8
        ensureSpace(badgeHeight + 8)
        x = margin
      }
      const y = cursorY - badgeHeight
      page.drawRectangle({
        x,
        y,
        width: badgeWidth,
        height: badgeHeight,
        color: palette.badgeBg,
        borderColor: palette.badgeBorder,
        borderWidth: 1,
      })
      page.drawText(badge, { x: x + 8, y: y + 6, size: 10, font: regularFont, color: palette.navy })
      x += badgeWidth + 8
    })
    cursorY -= badgeHeight + 20
  }

  type MetricCard = { label: string; value: string; detail?: string }
  const drawMetricCards = (cards: MetricCard[]) => {
    if (cards.length === 0) {
      return
    }
    const columns = 3
    const gap = 12
    const cardHeight = 82
    const cardWidth = (contentWidth - gap * (columns - 1)) / columns

    cards.forEach((card, index) => {
      const column = index % columns
      if (column === 0) {
        ensureSpace(cardHeight + 22)
      }
      const x = margin + column * (cardWidth + gap)
      const y = cursorY - cardHeight
      page.drawRectangle({
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        color: palette.cardBg,
        borderColor: palette.cardBorder,
        borderWidth: 1,
      })
      page.drawText(card.value, {
        x: x + 12,
        y: y + cardHeight - 20,
        size: 16,
        font: boldFont,
        color: palette.navy,
      })
      page.drawText(card.label, {
        x: x + 12,
        y: y + cardHeight - 38,
        size: 10,
        font: regularFont,
        color: palette.muted,
      })
      if (card.detail) {
        const detailLines = wrapText(card.detail, regularFont, 9, cardWidth - 24).slice(0, 2)
        detailLines.forEach((line, lineIndex) => {
          page.drawText(line, {
            x: x + 12,
            y: y + cardHeight - 56 - lineIndex * 11,
            size: 9,
            font: regularFont,
            color: palette.text,
          })
        })
      }
      if (column === columns - 1 || index === cards.length - 1) {
        cursorY = y - 22
      }
    })
  }

  const drawBarChart = (title: string, labels: string[], values: number[]) => {
    if (values.length === 0) {
      drawParagraph("No hay datos para graficar en el periodo seleccionado.", { color: palette.muted })
      return
    }
    const chartHeight = 170
    ensureSpace(chartHeight + 40)
    const titleY = cursorY - 16
    page.drawText(title, { x: margin, y: titleY, size: 12, font: boldFont, color: palette.navy })
    const top = titleY - 14
    const bottom = top - chartHeight + 40
    const axisY = bottom + 20
    const innerHeight = top - axisY
    const axisStart = { x: margin, y: axisY }
    const axisEndX = margin + contentWidth
    page.drawLine({ start: axisStart, end: { x: axisEndX, y: axisY }, thickness: 1, color: palette.axis })
    page.drawLine({ start: axisStart, end: { x: margin, y: axisY + innerHeight }, thickness: 1, color: palette.axis })

    const maxValue = Math.max(...values)
    const normalizedMax = maxValue <= 0 ? 1 : maxValue
    const slot = contentWidth / values.length

    values.forEach((value, index) => {
      const barWidth = slot * 0.6
      const x = margin + index * slot + slot * 0.2
      const height = Math.max((value / normalizedMax) * (innerHeight - 6), 4)
      page.drawRectangle({ x, y: axisY, width: barWidth, height, color: palette.accent })
      const label = labels[index]
      const labelWidth = regularFont.widthOfTextAtSize(label, 9)
      page.drawText(label, {
        x: x + (barWidth - labelWidth) / 2,
        y: axisY - 14,
        size: 9,
        font: regularFont,
        color: palette.muted,
      })
      const valueLabel = formatNumber(value)
      page.drawText(valueLabel, {
        x,
        y: axisY + height + 6,
        size: 9,
        font: regularFont,
        color: palette.text,
      })
    })

    cursorY = axisY - 40
  }

  const drawTable = (title: string, headers: string[], rows: string[][], columnFlex: number[]) => {
    drawSectionTitle(title)
    if (rows.length === 0) {
      drawParagraph("No hay datos disponibles para esta sección.", { color: palette.muted })
      return
    }
    const totalFlex = columnFlex.reduce((acc, value) => acc + value, 0)
    const columnWidths = columnFlex.map((value) => (value / totalFlex) * contentWidth)
    const headerHeight = 26
    const rowHeight = 22
    const tableHeight = headerHeight + rowHeight * rows.length
    ensureSpace(tableHeight + 16)

    let x = margin
    const headerY = cursorY - headerHeight
    page.drawRectangle({ x, y: headerY, width: contentWidth, height: headerHeight, color: palette.tableHeader })
    headers.forEach((header, index) => {
      page.drawText(header, {
        x: x + 8,
        y: headerY + headerHeight - 18,
        size: 10,
        font: boldFont,
        color: palette.navy,
      })
      x += columnWidths[index]
    })

    let currentY = headerY
    rows.forEach((row, rowIndex) => {
      currentY -= rowHeight
      const fillColor = rowIndex % 2 === 0 ? palette.tableRow : undefined
      if (fillColor) {
        page.drawRectangle({
          x: margin,
          y: currentY,
          width: contentWidth,
          height: rowHeight,
          color: fillColor,
          opacity: 0.7,
        })
      }
      let cellX = margin
      row.forEach((cell, cellIndex) => {
        const cellWidth = columnWidths[cellIndex]
        const cellLines = wrapText(cell, regularFont, 10, cellWidth - 12).slice(0, 2)
        cellLines.forEach((line, lineIndex) => {
          page.drawText(line, {
            x: cellX + 6,
            y: currentY + rowHeight - 12 - lineIndex * 10,
            size: 10,
            font: regularFont,
            color: palette.text,
          })
        })
        cellX += cellWidth
      })
    })

    cursorY = currentY - 24
  }

  const drawHeader = () => {
    const headerHeight = 120
    ensureSpace(headerHeight)
    const headerY = cursorY - headerHeight
    page.drawRectangle({ x: 0, y: headerY, width: pageWidth, height: headerHeight, color: palette.navy })
    page.drawRectangle({
      x: 0,
      y: headerY,
      width: pageWidth,
      height: headerHeight,
      color: palette.accent,
      opacity: 0.25,
    })
    page.drawText("TryOnWeb", {
      x: margin,
      y: headerY + headerHeight - 32,
      size: 20,
      font: boldFont,
      color: rgb(1, 1, 1),
    })
    page.drawText("Reporte ejecutivo de inventario", {
      x: margin,
      y: headerY + headerHeight - 54,
      size: 12,
      font: regularFont,
      color: rgb(0.91, 0.95, 1),
    })
    cursorY = headerY - 24
  }

  const filterInfo = getFilterDisplayInfo(dashboard, filters)
  const periodLabel = filters.from && filters.to
    ? `${formatPlainDate(filters.from)} al ${formatPlainDate(filters.to)}`
    : "Periodo no especificado"
  const inboundTotal = dashboard.inventoryFlow.reduce((acc, point) => acc + point.inbound, 0)
  const outboundTotal = dashboard.inventoryFlow.reduce((acc, point) => acc + point.outbound, 0)

  const metricCards: MetricCard[] = [
    {
      label: "Valor inventario",
      value: formatCurrency(dashboard.metrics.totalInventoryValue),
      detail: `${formatNumber(dashboard.metrics.totalProducts)} productos activos`,
    },
    {
      label: "Unidades disponibles",
      value: formatNumber(dashboard.metrics.totalStockUnits),
      detail: "Stock consolidado en bodegas",
    },
    {
      label: "Ingresos registrados",
      value: formatCurrency(inboundTotal),
      detail: "Entradas del periodo",
    },
    {
      label: "Salidas registradas",
      value: formatCurrency(outboundTotal),
      detail: "Movimientos despachados",
    },
    {
      label: "Sesiones try-on",
      value: formatNumber(dashboard.tryOn.summary.sessions),
      detail: `${formatNumber(dashboard.tryOn.summary.items)} items probados`,
    },
    {
      label: "Alertas activas",
      value: formatNumber(dashboard.inventory.lowStock.length),
      detail: "Productos por debajo del mínimo",
    },
  ]

  const filterBadges: string[] = [`Categoría ${filterInfo.categoryName}`]
  if (filterInfo.hasLocationFilter) filterBadges.push(`Ubicación ${filterInfo.locationName}`)
  if (filterInfo.stockIsFiltered) filterBadges.push(`Stock ${filterInfo.stockLabel}`)

  const trendPoints = dashboard.tryOn.trend.slice(-6)
  const chartLabels = trendPoints.map((point) => formatPlainDate(point.date))
  const chartValues = trendPoints.map((point) => point.sessions)

  const lowStockRows = dashboard.inventory.lowStock.slice(0, 6).map((item) => [
    item.productName,
    formatNumber(item.totalStock),
    formatNumber(item.minimumStock),
    item.status,
  ])

  const topProductsRows = dashboard.topProducts.slice(0, 6).map((item, index) => [
    `${index + 1}. ${item.productName}`,
    formatNumber(item.tryons),
    formatNumber(item.favorites),
    formatNumber(item.shares),
  ])

  drawHeader()
  drawParagraph(`Generado el ${formatDateTime(new Date())}`, { size: 10, color: palette.muted })
  drawParagraph(`Periodo analizado: ${periodLabel}`, { size: 10, color: palette.muted })
  drawBadgeRow(filterBadges)

  drawSectionTitle("Resumen ejecutivo")
  drawMetricCards(metricCards)

  drawSectionTitle("Comportamiento de sesiones TryOn")
  drawBarChart("Sesiones registradas (últimos 6 puntos)", chartLabels, chartValues)

  drawTable(
    "Inventario en alerta",
    ["Producto", "Stock", "Mínimo", "Estado"],
    lowStockRows,
    [4, 1.2, 1.2, 2],
  )

  drawTable(
    "Top productos interactivos",
    ["Producto", "Try-on", "Favoritos", "Compartidos"],
    topProductsRows,
    [4, 1.2, 1.2, 1.2],
  )

  drawSectionTitle("Reportes generados recientemente")
  if (reports.recentReports.length === 0) {
    drawParagraph("Aún no se han generado reportes en el periodo seleccionado.", { color: palette.muted })
  } else {
    reports.recentReports.slice(0, 5).forEach((report) => {
      const summary = report.summary ? ` — ${report.summary}` : ""
      drawParagraph(`${formatDateTime(report.createdAt)} · ${report.type.toUpperCase()}${summary}`, {
        size: 11,
        color: palette.text,
      })
    })
  }

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}

const wrapText = (text: string, font: any, size: number, maxWidth: number) => {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""

  words.forEach((word) => {
    const testLine = current ? `${current} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, size)
    if (width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = testLine
    }
  })

  if (current) {
    lines.push(current)
  }

  return lines.length > 0 ? lines : [""]
}

export const createExcelBuffer = async ({ dashboard, reports: _reports, filters }: ExportPayload) => {
  const workbook = XLSX.utils.book_new()
  const periodLabel = filters.from && filters.to ? `${filters.from} al ${filters.to}` : "Periodo no especificado"
  const generatedAt = formatDateTime(new Date())
  const inboundTotal = dashboard.inventoryFlow.reduce((acc, point) => acc + point.inbound, 0)
  const outboundTotal = dashboard.inventoryFlow.reduce((acc, point) => acc + point.outbound, 0)
  const filterInfo = getFilterDisplayInfo(dashboard, filters)

  const resumenData = [
    ["Sistema de inventario TryOnWeb"],
    ["Periodo", periodLabel, "", "", "Generado", generatedAt],
    ["Categoría", filterInfo.categoryName, "", "", "Ubicación", filterInfo.locationName],
    ["Stock", filterInfo.stockLabel, "", "", "", ""],
    [],
    ["Indicador", "Valor", "Descripción"],
    ["Valor inventario", dashboard.metrics.totalInventoryValue, formatCurrency(dashboard.metrics.totalInventoryValue)],
    ["Unidades disponibles", dashboard.metrics.totalStockUnits, "Unidades activas en stock"],
    ["Ingresos registrados", inboundTotal, formatCurrency(inboundTotal)],
    ["Salidas registradas", outboundTotal, formatCurrency(outboundTotal)],
    ["Sesiones try-on", dashboard.tryOn.summary.sessions, `${formatNumber(dashboard.tryOn.summary.items)} items probados`],
    ["Alertas activas", dashboard.inventory.lowStock.length, "Productos por debajo del mínimo"],
  ]
  const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData)
  resumenSheet["!merges"] = [
    { s: { c: 0, r: 0 }, e: { c: 5, r: 0 } },
  ]
  resumenSheet["!cols"] = [{ wch: 18 }, { wch: 16 }, { wch: 36 }, { wch: 4 }, { wch: 16 }, { wch: 24 }]

  const summaryHeaderStyle: XLSX.CellStyle = {
    font: { name: "Calibri", sz: 18, bold: true, color: { rgb: "FFFFFFFF" } },
    alignment: { vertical: "center", horizontal: "left" },
    fill: { patternType: "solid", fgColor: { rgb: "FF0F62FE" } },
  }
  const mutedStyle: XLSX.CellStyle = {
    font: { name: "Calibri", sz: 10, color: { rgb: "FF6B7280" } },
  }
  const tableHeaderStyle: XLSX.CellStyle = {
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFFFF" } },
    alignment: { vertical: "center", horizontal: "left", wrapText: true },
    fill: { patternType: "solid", fgColor: { rgb: "FF1F2A37" } },
    border: {
      top: { style: "thin", color: { rgb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { rgb: "FFD1D5DB" } },
      left: { style: "thin", color: { rgb: "FFD1D5DB" } },
      right: { style: "thin", color: { rgb: "FFD1D5DB" } },
    },
  }
  const tableBodyStyle: XLSX.CellStyle = {
    font: { name: "Calibri", sz: 10, color: { rgb: "FF1F2937" } },
    alignment: { vertical: "center", wrapText: true },
    border: {
      top: { style: "hair", color: { rgb: "FFE5E7EB" } },
      bottom: { style: "hair", color: { rgb: "FFE5E7EB" } },
      left: { style: "hair", color: { rgb: "FFE5E7EB" } },
      right: { style: "hair", color: { rgb: "FFE5E7EB" } },
    },
  }
  const bandedFill = (color: string): XLSX.CellStyle["fill"] => ({ patternType: "solid", fgColor: { rgb: color } })

  const applyRowStyle = (sheet: XLSX.WorkSheet, rowIndex: number, colCount: number, style: Partial<XLSX.CellStyle>) => {
    for (let col = 0; col < colCount; col++) {
      const ref = XLSX.utils.encode_cell({ c: col, r: rowIndex })
      if (sheet[ref]) {
        sheet[ref].s = { ...(sheet[ref].s ?? {}), ...style }
      }
    }
  }

  applyRowStyle(resumenSheet, 0, 6, summaryHeaderStyle)
  applyRowStyle(resumenSheet, 1, 6, mutedStyle)
  applyRowStyle(resumenSheet, 2, 6, mutedStyle)
  applyRowStyle(resumenSheet, 3, 6, mutedStyle)
  applyRowStyle(resumenSheet, 5, 3, tableHeaderStyle)
  for (let r = 6; r < resumenData.length; r++) {
    applyRowStyle(resumenSheet, r, 3, {
      ...tableBodyStyle,
      fill: (r % 2 === 0 ? bandedFill("FFF7F9FC") : bandedFill("FFFFFFFF")),
    })
    const valueCellRef = XLSX.utils.encode_cell({ c: 1, r })
    if (resumenSheet[valueCellRef]) {
      resumenSheet[valueCellRef].z = "#,##0"
    }
  }

  const movementRows = dashboard.inventory.movements.length > 0
    ? dashboard.inventory.movements.slice(0, 40).map((movement) => ([
      formatDateTime(movement.timestamp),
      movement.productName ?? "Producto sin nombre",
      movement.sku ?? "Sin SKU",
      movement.type === "inbound" ? "Entrada" : "Salida",
      movement.type === "inbound" ? movement.quantity : "",
      movement.type !== "inbound" ? movement.quantity : "",
      movement.quantity,
      movement.location ?? "Sin ubicación",
      movement.reference ?? "-",
    ]))
    : [["Sin movimientos registrados", "", "", "", "", "", "", "", ""]]

  const movementTable = [
    ["Fecha", "Producto", "SKU", "Tipo", "Entradas", "Salidas", "Cantidad", "Ubicación", "Referencia"],
    ...movementRows,
  ]

  const inventorySheet = XLSX.utils.aoa_to_sheet([
    ["Inventario consolidado"],
    [],
    ...movementTable,
  ])

  const movementHeaderRow = 2 // zero-based
  const movementDataStart = movementHeaderRow + 1
  const movementDataEnd = movementHeaderRow + movementRows.length

  inventorySheet["!merges"] = [{ s: { c: 0, r: 0 }, e: { c: 8, r: 0 } }]
  inventorySheet["!cols"] = [12, 26, 12, 10, 12, 12, 12, 16, 16].map((wch) => ({ wch }))
  inventorySheet["!autofilter"] = { ref: `A${movementHeaderRow + 1}:I${movementDataEnd + 1}` }

  applyRowStyle(inventorySheet, 0, 9, summaryHeaderStyle)
  applyRowStyle(inventorySheet, movementHeaderRow, 9, tableHeaderStyle)

  for (let r = movementDataStart; r <= movementDataEnd; r++) {
    const fill = r % 2 === 0 ? bandedFill("FFF4F6FB") : bandedFill("FFFFFFFF")
    applyRowStyle(inventorySheet, r, 9, { ...tableBodyStyle, fill })
    const entradaRef = XLSX.utils.encode_cell({ c: 4, r })
    const salidaRef = XLSX.utils.encode_cell({ c: 5, r })
    if (inventorySheet[entradaRef]) inventorySheet[entradaRef].z = "#,##0"
    if (inventorySheet[salidaRef]) inventorySheet[salidaRef].z = "#,##0"
  }

  const lowStockStartRow = movementDataEnd + 3
  const lowStockTable = [
    ["Productos en alerta"],
    [],
    ["Producto", "SKU", "Stock", "Mínimo", "Estado"],
    ...(
      dashboard.inventory.lowStock.length > 0
        ? dashboard.inventory.lowStock.slice(0, 20).map((item) => ([
          item.productName,
          item.sku ?? "Sin SKU",
          formatNumber(item.totalStock),
          formatNumber(item.minimumStock),
          item.status.toUpperCase(),
        ]))
        : [["Sin productos en alerta", "", "", "", ""]]
    ),
  ]

  XLSX.utils.sheet_add_aoa(inventorySheet, lowStockTable, { origin: `A${lowStockStartRow}` })
  const lowStockTitleRowNumber = lowStockStartRow
  const lowStockHeaderRowNumber = lowStockStartRow + 2
  const lowStockDataStartNumber = lowStockStartRow + 3
  const lowStockDataRowCount = lowStockTable.length - 3
  const lowStockDataEndNumber = lowStockDataStartNumber + lowStockDataRowCount - 1

  applyRowStyle(inventorySheet, lowStockTitleRowNumber - 1, 5, summaryHeaderStyle)
  applyRowStyle(inventorySheet, lowStockHeaderRowNumber - 1, 5, tableHeaderStyle)

  for (let rowNumber = lowStockDataStartNumber; rowNumber <= lowStockDataEndNumber; rowNumber++) {
    const zeroIndex = rowNumber - 1
    const fill = zeroIndex % 2 === 0 ? bandedFill("FFFDF4F4") : bandedFill("FFFFFFFF")
    applyRowStyle(inventorySheet, zeroIndex, 5, { ...tableBodyStyle, fill })
  }

  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen")
  XLSX.utils.book_append_sheet(workbook, inventorySheet, "Inventario")

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer
  return buffer
}

export async function GET(request: NextRequest) {
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const params = request.nextUrl.searchParams
  const filters = parseFiltersFromParams(params)
  const format = (params.get("format") ?? "pdf").toLowerCase()

  try {
    const [dashboard, reports] = await Promise.all([
      getDashboardOverview(filters),
      getReportsOverview(),
    ])

    const payload: ExportPayload = { dashboard, reports, filters }
    const timestamp = new Date().toISOString().split("T")[0]

    if (format === "excel") {
      const buffer = await createExcelBuffer(payload)
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${DEFAULT_FILE_BASENAME}-${timestamp}.xlsx"`,
          "Cache-Control": "no-store",
        },
      })
    }

    const buffer = await createPdfBuffer(payload)
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${DEFAULT_FILE_BASENAME}-${timestamp}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Dashboard export failed", error)
    return NextResponse.json({ message: "No pudimos generar el archivo solicitado" }, { status: 500 })
  }
}
