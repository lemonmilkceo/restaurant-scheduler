import type { Employee, ScheduleCell } from '@/types'
import { ROLE_ORDER } from '@/lib/constants'
import { format, parseISO } from 'date-fns'

const DAY_KR = ['일', '월', '화', '수', '목', '금', '토'] as const

interface PdfInput {
  employees: Employee[]
  cells: ScheduleCell[]
  startDate: string
  endDate: string
  storeClosedDates: string[]
}

const EMPLOYEE_PALETTE: { bg: string; text: string }[] = [
  { bg: '#ef4444', text: '#ffffff' },
  { bg: '#22c55e', text: '#000000' },
  { bg: '#ec4899', text: '#ffffff' },
  { bg: '#f97316', text: '#000000' },
  { bg: '#facc15', text: '#000000' },
  { bg: '#a855f7', text: '#ffffff' },
  { bg: '#06b6d4', text: '#000000' },
  { bg: '#3b82f6', text: '#ffffff' },
  { bg: '#14b8a6', text: '#000000' },
  { bg: '#f43f5e', text: '#ffffff' },
  { bg: '#84cc16', text: '#000000' },
  { bg: '#d946ef', text: '#ffffff' },
]

function isOff(status: string): boolean {
  return status === 'OFF_RANDOM' || status === 'OFF_FIXED' || status === 'OFF_STORE'
}

function dateToStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function sortedEmployees(employees: Employee[]): Employee[] {
  return [...employees].sort(
    (a, b) =>
      ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
      a.name.localeCompare(b.name, 'ko'),
  )
}

function assignColors(employees: Employee[]): Map<string, { bg: string; text: string }> {
  const sorted = sortedEmployees(employees)
  const map = new Map<string, { bg: string; text: string }>()
  sorted.forEach((emp, i) => {
    map.set(emp.id, EMPLOYEE_PALETTE[i % EMPLOYEE_PALETTE.length])
  })
  return map
}

function getMonthsInRange(start: string, end: string): { year: number; month: number }[] {
  const s = parseISO(start)
  const e = parseISO(end)
  const months: { year: number; month: number }[] = []
  let cur = new Date(s.getFullYear(), s.getMonth(), 1)
  const endMonth = new Date(e.getFullYear(), e.getMonth(), 1)
  while (cur <= endMonth) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() })
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  return months
}

interface DayCell {
  day: number
  dateStr: string
  isCurrentMonth: boolean
  dow: number
}

function buildCalendarWeeks(year: number, month: number): DayCell[][] {
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastOfMonth.getDate()
  const startDow = firstOfMonth.getDay()

  const weeks: DayCell[][] = []
  let week: DayCell[] = []

  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    week.push({ day: d.getDate(), dateStr: dateToStr(d), isCurrentMonth: false, dow: d.getDay() })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
    const d = new Date(year, month, day)
    week.push({ day, dateStr: dateToStr(d), isCurrentMonth: true, dow: d.getDay() })
  }

  if (week.length > 0 && week.length < 7) {
    let nextDay = 1
    while (week.length < 7) {
      const d = new Date(year, month + 1, nextDay)
      week.push({ day: nextDay, dateStr: dateToStr(d), isCurrentMonth: false, dow: d.getDay() })
      nextDay++
    }
  }
  if (week.length === 7) weeks.push(week)

  return weeks
}

function buildMonthPage(
  input: PdfInput,
  year: number,
  month: number,
  colorMap: Map<string, { bg: string; text: string }>,
  empNameMap: Map<string, string>,
): string {
  const monthLabel = `${year}년${month + 1}월`
  const closedSet = new Set(input.storeClosedDates)

  const offByDate = new Map<string, { name: string; bg: string; text: string }[]>()
  for (const cell of input.cells) {
    if (isOff(cell.status) && cell.status !== 'OFF_STORE') {
      if (!offByDate.has(cell.date)) offByDate.set(cell.date, [])
      const color = colorMap.get(cell.employeeId) || { bg: '#666', text: '#fff' }
      const name = empNameMap.get(cell.employeeId) || '?'
      offByDate.get(cell.date)!.push({ name, bg: color.bg, text: color.text })
    }
  }

  const weeks = buildCalendarWeeks(year, month)

  let html = `<div class="month-page">`
  html += `<div class="month-header">${monthLabel}</div>`
  html += `<table class="cal-table"><thead><tr>`

  for (let i = 0; i < 7; i++) {
    const cls = i === 0 ? ' class="sun"' : ''
    html += `<th${cls}>${DAY_KR[i]}</th>`
  }
  html += `</tr></thead><tbody>`

  for (const week of weeks) {
    html += `<tr>`
    for (const d of week) {
      const isClosed = closedSet.has(d.dateStr)
      const numCls = !d.isCurrentMonth ? 'other' : d.dow === 0 ? 'sun' : ''

      html += `<td>`
      html += `<div class="dn ${numCls}">${d.day}</div>`

      if (isClosed && d.isCurrentMonth) {
        html += `<div class="tag closed">매장휴무</div>`
      } else if (d.isCurrentMonth) {
        const offList = offByDate.get(d.dateStr) || []
        for (const emp of offList) {
          html += `<div class="tag" style="background:${emp.bg};color:${emp.text};">${emp.name}</div>`
        }
      }

      html += `</td>`
    }
    html += `</tr>`
  }

  html += `</tbody></table></div>`
  return html
}

function buildLegend(employees: Employee[]): string {
  const sorted = sortedEmployees(employees)
  let html = '<div class="legend">'
  sorted.forEach((emp, i) => {
    const c = EMPLOYEE_PALETTE[i % EMPLOYEE_PALETTE.length]
    html += `<span class="legend-item" style="background:${c.bg};color:${c.text};">${emp.name}</span>`
  })
  html += '</div>'
  return html
}

const CALENDAR_CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, system-ui, 'Malgun Gothic', sans-serif;
  background: #000;
  color: #fff;
}
.month-page { padding: 16px 20px; }
.month-header {
  font-size: 28px;
  font-weight: 800;
  text-align: center;
  padding: 8px 0 14px;
}
.cal-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.cal-table th {
  font-size: 15px;
  font-weight: 700;
  color: #999;
  padding: 8px 0;
  text-align: center;
  border-bottom: 1px solid #333;
}
.cal-table th.sun { color: #ef4444; }
.cal-table td {
  vertical-align: top;
  padding: 6px 3px 8px;
  height: 82px;
  border-bottom: 1px solid #1a1a1a;
}
.dn {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 3px;
  color: #e5e5e5;
}
.dn.sun { color: #ef4444; }
.dn.other { color: #444; }
.tag {
  display: block;
  padding: 3px 2px;
  margin: 2px 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
.tag.closed {
  background: #374151;
  color: #9ca3af;
}
.legend {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  padding: 12px 20px;
}
.legend-item {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
}
@media print {
  body { padding: 0; }
  @page { size: portrait; margin: 8mm; }
  .month-page { page-break-after: always; }
}
`

function buildCalendarFullHtml(input: PdfInput): string {
  const colorMap = assignColors(input.employees)
  const empNameMap = new Map<string, string>()
  for (const emp of input.employees) empNameMap.set(emp.id, emp.name)

  const months = getMonthsInRange(input.startDate, input.endDate)
  let body = ''
  for (const { year, month } of months) {
    body += buildMonthPage(input, year, month, colorMap, empNameMap)
  }

  const legend = buildLegend(input.employees)

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>스케줄표</title>
<style>${CALENDAR_CSS}</style>
</head>
<body>
  ${body}
  ${legend}
  <script>window.onafterprint=function(){window.close();}</script>
</body>
</html>`
}

function buildSinglePageHtml(
  input: PdfInput,
  year: number,
  month: number,
  colorMap: Map<string, { bg: string; text: string }>,
  empNameMap: Map<string, string>,
): string {
  const pageHtml = buildMonthPage(input, year, month, colorMap, empNameMap)
  const legend = buildLegend(input.employees)
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${CALENDAR_CSS}</style>
</head><body>${pageHtml}${legend}</body></html>`
}

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

function openPrintWindow(input: PdfInput) {
  const html = buildCalendarFullHtml(input)
  const w = window.open('', '_blank')
  if (!w) {
    alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.')
    return
  }
  w.document.write(html)
  w.document.close()
  setTimeout(() => w.print(), 500)
}

async function generateWithCanvas(input: PdfInput) {
  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])
  const html2canvas = html2canvasModule.default

  const colorMap = assignColors(input.employees)
  const empNameMap = new Map<string, string>()
  for (const emp of input.employees) empNameMap.set(emp.id, emp.name)

  const months = getMonthsInRange(input.startDate, input.endDate)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const iframe = document.createElement('iframe')
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '800px',
    height: '1200px',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1',
  })
  document.body.appendChild(iframe)

  try {
    for (let i = 0; i < months.length; i++) {
      const { year, month } = months[i]
      const fullHtml = buildSinglePageHtml(input, year, month, colorMap, empNameMap)

      const iframeDoc = iframe.contentDocument!
      iframeDoc.open()
      iframeDoc.write(fullHtml)
      iframeDoc.close()
      await new Promise((r) => setTimeout(r, 300))

      const target = iframeDoc.body as HTMLElement
      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: '#000000',
        logging: false,
      })

      if (i > 0) pdf.addPage()

      const imgWidth = pageWidth - 16
      const imgHeight = (canvas.height / canvas.width) * imgWidth
      const yOffset = Math.max(8, (pageHeight - imgHeight) / 2)

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        8,
        yOffset,
        imgWidth,
        Math.min(imgHeight, pageHeight - 16),
      )
    }

    const filename = `schedule_${format(parseISO(input.startDate), 'yyyyMMdd')}_${format(parseISO(input.endDate), 'yyyyMMdd')}.pdf`
    pdf.save(filename)
  } finally {
    document.body.removeChild(iframe)
  }
}

export async function downloadSchedulePdf(input: PdfInput): Promise<void> {
  if (isMobile()) {
    openPrintWindow(input)
  } else {
    await generateWithCanvas(input)
  }
}
