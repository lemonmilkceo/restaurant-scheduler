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

function buildScheduleHtml(input: PdfInput, weekDates: string[], weekLabel: string): string {
  const sorted = [...input.employees].sort(
    (a, b) =>
      ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
      a.name.localeCompare(b.name, 'ko'),
  )

  const cellMap = new Map<string, ScheduleCell>()
  for (const c of input.cells) {
    cellMap.set(`${c.employeeId}:${c.date}`, c)
  }

  const title = `${format(parseISO(input.startDate), 'yyyy년 M월 d일')} ~ ${format(parseISO(input.endDate), 'M월 d일')} 직원 스케줄표`

  let html = `
    <div style="
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, 'Malgun Gothic', sans-serif;
      padding: 40px;
      background: white;
      width: 1100px;
    ">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">
          ${title}
        </h1>
        <p style="font-size: 18px; color: #555; margin: 0; font-weight: 600;">
          ${weekLabel}
        </p>
      </div>

      <table style="
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      ">
        <thead>
          <tr>
            <th style="
              width: 120px;
              padding: 12px 8px;
              background: #1e3a5f;
              color: white;
              font-size: 16px;
              font-weight: 700;
              border: 2px solid #1e3a5f;
              text-align: center;
            ">직원</th>`

  for (const date of weekDates) {
    const dow = getDay(parseISO(date))
    const dayKr = DAY_KR[dow]
    const dayNum = format(parseISO(date), 'd')
    const isWeekend = dow === 0 || dow === 5 || dow === 6
    const isClosed = input.storeClosedDates.includes(date)
    const bgColor = isClosed ? '#dbeafe' : isWeekend ? '#fef3c7' : '#f0f4f8'
    const textColor = isWeekend ? '#dc2626' : '#1e3a5f'

    html += `
            <th style="
              padding: 10px 4px;
              background: ${bgColor};
              border: 2px solid #94a3b8;
              text-align: center;
              font-size: 14px;
              font-weight: 700;
              color: ${textColor};
              line-height: 1.4;
            ">
              <div style="font-size: 13px;">${dayKr}</div>
              <div style="font-size: 20px; font-weight: 800;">${dayNum}</div>
              ${isClosed ? '<div style="font-size: 10px; color: #2563eb;">매장휴무</div>' : ''}
            </th>`
  }

  html += `
          </tr>
        </thead>
        <tbody>`

  sorted.forEach((emp, idx) => {
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc'

    html += `
          <tr>
            <td style="
              padding: 14px 10px;
              background: ${rowBg};
              border: 2px solid #94a3b8;
              font-size: 17px;
              font-weight: 700;
              text-align: center;
              white-space: nowrap;
            ">
              ${emp.name}
              <span style="font-size: 12px; color: #64748b; font-weight: 500; display: block;">
                ${ROLE_LABELS[emp.role]}
              </span>
            </td>`

    for (const date of weekDates) {
      const cell = cellMap.get(`${emp.id}:${date}`)
      const status = cell?.status ?? 'WORK'
      const off = isOff(status)
      const label = getStatusLabel(status)

      let cellBg = rowBg
      let cellColor = '#94a3b8'
      let cellFont = '14px'
      let cellWeight = '400'

      if (off) {
        cellBg = status === 'OFF_FIXED' ? '#f3e8ff' : status === 'OFF_STORE' ? '#dbeafe' : '#e0f2fe'
        cellColor = status === 'OFF_FIXED' ? '#7c3aed' : '#1d4ed8'
        cellFont = '16px'
        cellWeight = '800'
      }

      html += `
            <td style="
              padding: 12px 4px;
              background: ${cellBg};
              border: 2px solid #94a3b8;
              text-align: center;
              font-size: ${cellFont};
              font-weight: ${cellWeight};
              color: ${cellColor};
            ">${label}</td>`
    }

    html += '</tr>'
  })

  html += `
          <tr>
            <td style="
              padding: 12px 10px;
              background: #1e3a5f;
              color: white;
              border: 2px solid #1e3a5f;
              font-size: 15px;
              font-weight: 700;
              text-align: center;
            ">출근 인원</td>`

  for (const date of weekDates) {
    let workCount = 0
    for (const emp of sorted) {
      const cell = cellMap.get(`${emp.id}:${date}`)
      const status = cell?.status ?? 'WORK'
      if (!isOff(status)) workCount++
    }

    html += `
            <td style="
              padding: 12px 4px;
              background: #f0f4f8;
              border: 2px solid #94a3b8;
              text-align: center;
              font-size: 20px;
              font-weight: 800;
              color: #1e3a5f;
            ">${workCount}명</td>`
  }

  html += `
          </tr>
        </tbody>
      </table>

      <div style="
        margin-top: 20px;
        display: flex;
        gap: 24px;
        font-size: 13px;
        color: #64748b;
        justify-content: center;
      ">
        <span>■ <b style="color:#1d4ed8">휴무</b> = 일반 휴무</span>
        <span>■ <b style="color:#7c3aed">고정휴무</b> = 사전 지정</span>
        <span>■ <b style="color:#2563eb">매장휴무</b> = 매장 정기 휴무</span>
      </div>
    </div>`

  return html
}

export async function downloadSchedulePdf(input: PdfInput): Promise<void> {
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

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  document.body.appendChild(container)

  try {
    for (let i = 0; i < weeks.length; i++) {
      const weekLabel = `${i + 1}주차 (${format(parseISO(weeks[i][0]), 'M/d')} ~ ${format(parseISO(weeks[i][6]), 'M/d')})`
      const html = buildScheduleHtml(input, weeks[i], weekLabel)

      container.innerHTML = html
      await new Promise((r) => setTimeout(r, 100))

      const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
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
    document.body.removeChild(container)
  }
}
