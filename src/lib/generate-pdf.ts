import type { Employee, ScheduleCell } from '@/types'
import { ROLE_LABELS, ROLE_ORDER } from '@/lib/constants'
import { format, parseISO, getDay } from 'date-fns'

const DAY_KR = ['일', '월', '화', '수', '목', '금', '토'] as const

interface PdfInput {
  employees: Employee[]
  cells: ScheduleCell[]
  startDate: string
  endDate: string
  storeClosedDates: string[]
}

function generateDateRange(start: string, end: string): string[] {
  const result: string[] = []
  let d = parseISO(start)
  const e = parseISO(end)
  while (d <= e) {
    result.push(format(d, 'yyyy-MM-dd'))
    d = new Date(d.getTime() + 86400000)
  }
  return result
}

function getStatusLabel(status: string): string {
  if (status === 'OFF_RANDOM') return '휴무'
  if (status === 'OFF_FIXED') return '고정휴무'
  if (status === 'OFF_STORE') return '매장휴무'
  return ''
}

function isOff(status: string): boolean {
  return status === 'OFF_RANDOM' || status === 'OFF_FIXED' || status === 'OFF_STORE'
}

function buildWeekTable(input: PdfInput, weekDates: string[], weekLabel: string): string {
  const sorted = [...input.employees].sort(
    (a, b) =>
      ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
      a.name.localeCompare(b.name, 'ko'),
  )

  const cellMap = new Map<string, ScheduleCell>()
  for (const c of input.cells) {
    cellMap.set(`${c.employeeId}:${c.date}`, c)
  }

  let html = `
    <div style="page-break-after: always; padding: 24px 0;">
      <h2 style="text-align:center; font-size:18px; margin:0 0 16px;">${weekLabel}</h2>
      <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
        <thead><tr>
          <th style="width:90px; padding:10px 6px; background:#1e3a5f; color:#fff; font-size:14px; font-weight:700; border:2px solid #1e3a5f; text-align:center;">직원</th>`

  for (const date of weekDates) {
    const dow = getDay(parseISO(date))
    const isWeekend = dow === 0 || dow === 5 || dow === 6
    const isClosed = input.storeClosedDates.includes(date)
    const bg = isClosed ? '#dbeafe' : isWeekend ? '#fef3c7' : '#f0f4f8'
    const color = isWeekend ? '#dc2626' : '#1e3a5f'
    html += `<th style="padding:8px 2px; background:${bg}; border:2px solid #94a3b8; text-align:center; color:${color}; font-weight:700;">
      <div style="font-size:12px;">${DAY_KR[dow]}</div>
      <div style="font-size:18px; font-weight:800;">${format(parseISO(date), 'd')}</div>
      ${isClosed ? '<div style="font-size:9px; color:#2563eb;">매장휴무</div>' : ''}
    </th>`
  }
  html += '</tr></thead><tbody>'

  sorted.forEach((emp, idx) => {
    const rowBg = idx % 2 === 0 ? '#fff' : '#f8fafc'
    html += `<tr><td style="padding:10px 6px; background:${rowBg}; border:2px solid #94a3b8; font-size:15px; font-weight:700; text-align:center;">
      ${emp.name}<br><span style="font-size:11px; color:#64748b; font-weight:400;">${ROLE_LABELS[emp.role]}</span></td>`
    for (const date of weekDates) {
      const cell = cellMap.get(`${emp.id}:${date}`)
      const status = cell?.status ?? 'WORK'
      const off = isOff(status)
      const label = getStatusLabel(status)
      let bg = rowBg, color = '#ccc', fw = '400', fs = '13px'
      if (off) {
        bg = status === 'OFF_FIXED' ? '#f3e8ff' : status === 'OFF_STORE' ? '#dbeafe' : '#e0f2fe'
        color = status === 'OFF_FIXED' ? '#7c3aed' : '#1d4ed8'
        fw = '800'; fs = '14px'
      }
      html += `<td style="padding:10px 2px; background:${bg}; border:2px solid #94a3b8; text-align:center; font-size:${fs}; font-weight:${fw}; color:${color};">${label}</td>`
    }
    html += '</tr>'
  })

  html += `<tr><td style="padding:10px 6px; background:#1e3a5f; color:#fff; border:2px solid #1e3a5f; font-size:13px; font-weight:700; text-align:center;">출근</td>`
  for (const date of weekDates) {
    let wc = 0
    for (const emp of sorted) {
      const cell = cellMap.get(`${emp.id}:${date}`)
      if (!isOff(cell?.status ?? 'WORK')) wc++
    }
    html += `<td style="padding:10px 2px; background:#f0f4f8; border:2px solid #94a3b8; text-align:center; font-size:18px; font-weight:800; color:#1e3a5f;">${wc}명</td>`
  }
  html += '</tr></tbody></table></div>'
  return html
}

function buildFullHtml(input: PdfInput): string {
  const allDates = generateDateRange(input.startDate, input.endDate)
  const weeks: string[][] = []
  for (let i = 0; i < allDates.length; i += 7) {
    weeks.push(allDates.slice(i, i + 7))
  }

  const title = `${format(parseISO(input.startDate), 'yyyy년 M월 d일')} ~ ${format(parseISO(input.endDate), 'M월 d일')} 직원 스케줄표`

  let body = ''
  for (let i = 0; i < weeks.length; i++) {
    const label = `${i + 1}주차 (${format(parseISO(weeks[i][0]), 'M/d')} ~ ${format(parseISO(weeks[i][6]), 'M/d')})`
    body += buildWeekTable(input, weeks[i], label)
  }

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, system-ui, 'Malgun Gothic', sans-serif;
    background: #fff;
    padding: 20px;
  }
  h1 { font-size: 22px; text-align: center; margin-bottom: 4px; font-weight: 800; }
  .sub { font-size: 14px; text-align: center; color: #555; margin-bottom: 20px; }
  .legend { display:flex; gap:16px; justify-content:center; font-size:12px; color:#64748b; margin-top:12px; flex-wrap:wrap; }
  @media print {
    body { padding: 0; }
    @page { size: landscape; margin: 10mm; }
  }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="sub">
    <span>■ <b style="color:#1d4ed8">휴무</b> = 일반</span>&nbsp;&nbsp;
    <span>■ <b style="color:#7c3aed">고정휴무</b> = 사전 지정</span>&nbsp;&nbsp;
    <span>■ <b style="color:#2563eb">매장휴무</b> = 매장 정기</span>
  </div>
  ${body}
  <script>window.onafterprint=function(){window.close();}</script>
</body>
</html>`
}

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

function openPrintWindow(input: PdfInput) {
  const html = buildFullHtml(input)
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

  const allDates = generateDateRange(input.startDate, input.endDate)
  const weeks: string[][] = []
  for (let i = 0; i < allDates.length; i += 7) {
    weeks.push(allDates.slice(i, i + 7))
  }

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '0'
  iframe.style.top = '0'
  iframe.style.width = '1200px'
  iframe.style.height = '900px'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'
  iframe.style.zIndex = '-1'
  document.body.appendChild(iframe)

  try {
    for (let i = 0; i < weeks.length; i++) {
      const weekLabel = `${i + 1}주차 (${format(parseISO(weeks[i][0]), 'M/d')} ~ ${format(parseISO(weeks[i][6]), 'M/d')})`
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,system-ui,'Malgun Gothic',sans-serif;background:#fff;}</style></head><body>${buildWeekTable(input, weeks[i], weekLabel)}</body></html>`

      const iframeDoc = iframe.contentDocument!
      iframeDoc.open()
      iframeDoc.write(fullHtml)
      iframeDoc.close()
      await new Promise((r) => setTimeout(r, 300))

      const target = iframeDoc.body.firstElementChild as HTMLElement
      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: '#ffffff',
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
