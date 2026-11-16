import type { Student } from '../../../types/index.ts';

export interface KioskPrintPayload {
  student: Student;
  examPeriod: string;
  permitNumber?: string;
}

const PRINT_FRAME_ID = 'permease-kiosk-print-frame';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function getDefaultSubjects(student: Student): Array<{ code: string; title: string }> {
  if (student.subjects && student.subjects.length > 0) {
    return student.subjects.map((s) => {
      const subj = s as { subject_code?: string; code?: string; subject_title?: string; title?: string };
      return {
        code: subj.subject_code || subj.code || '',
        title: subj.subject_title || subj.title || '',
      };
    });
  }

  const programText = `${student.course} ${student.program}`.toUpperCase();
  if (programText.includes('IT') || programText.includes('INFORMATION')) {
    return [
      { code: 'IT 101', title: 'Introduction to Computing' },
      { code: 'IT 102', title: 'Computer Programming 1' },
      { code: 'IT 103', title: 'Data Structures & Algorithms' },
      { code: 'GE 101', title: 'Understanding the Self' },
      { code: 'GE 102', title: 'Readings in Philippine History' },
      { code: 'PE 101', title: 'Physical Activities Towards Health & Fitness 1' },
    ];
  }

  return [
    { code: 'CS 101', title: 'Discrete Structures 1' },
    { code: 'CS 102', title: 'Object-Oriented Programming' },
    { code: 'MATH 101', title: 'Calculus for Computing' },
    { code: 'GE 101', title: 'Purposive Communication' },
    { code: 'GE 104', title: 'The Contemporary World' },
  ];
}

function buildThermalPermitHtml(payload: KioskPrintPayload): string {
  const { student, examPeriod } = payload;
  const permitNumber =
    payload.permitNumber ||
    student.current_permit?.permit_number ||
    `TP-2026-${String(student.id).padStart(6, '0')}`;
  const semester = student.semester || student.current_permit?.semester || '1st Semester';
  const academicYear = student.academic_year || student.current_permit?.academic_year || '2026-2027';
  const dateIssued = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });

  const subjects = getDefaultSubjects(student);
  const emptyRowsNeeded = Math.max(0, 5 - subjects.length);

  const subjectRowsHtml = [
    ...subjects.map(
      (subj) => `
      <tr>
        <td class="col-code">${escapeHtml(subj.code)}</td>
        <td class="col-desc">${escapeHtml(subj.title)}</td>
        <td class="col-sig" style="height: 18px;">&nbsp;</td>
      </tr>`
    ),
    ...Array.from({ length: emptyRowsNeeded }).map(
      () => `
      <tr>
        <td class="col-code">&nbsp;</td>
        <td class="col-desc">&nbsp;</td>
        <td class="col-sig" style="height: 18px;">&nbsp;</td>
      </tr>`
    ),
  ].join('');

  const fullName = `${student.last_name}, ${student.first_name} ${student.middle_name || ''}`.trim().toUpperCase();
  const programLine = `${student.course} ${student.program} (${student.grade_year_level || '1st Year'} - ${student.section || 'A'})`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Print Examination Permit - ${escapeHtml(student.student_number)}</title>
  <style>
    @page {
      size: 100mm 150mm portrait;
      margin: 4mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 92mm;
      height: auto;
      max-width: 92mm;
      max-height: 140mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 8.5pt;
      line-height: 1.25;
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      overflow: hidden;
    }
    .container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .title-block {
      text-align: center;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #000000;
    }
    .main-title {
      font-size: 12pt;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #000000;
    }
    .sub-curly {
      font-size: 8.5pt;
      font-weight: 800;
      color: #000000;
      margin-top: 1px;
    }
    .info-grid {
      width: 100%;
      border-collapse: collapse;
    }
    .info-grid td {
      vertical-align: top;
      padding: 1.5px 0;
      font-size: 8pt;
      color: #000000;
    }
    .info-label {
      font-weight: 800;
      color: #000000;
      width: 68px;
      white-space: nowrap;
    }
    .info-value {
      color: #000000;
      font-weight: 600;
    }
    .period-header {
      text-align: center;
      font-size: 9.5pt;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #000000;
      border-top: 1px solid #000000;
      border-bottom: 1px solid #000000;
      padding: 2.5px 0;
    }
    .permit-table {
      width: 100%;
      border-collapse: collapse;
    }
    .permit-table th,
    .permit-table td {
      border: 1px solid #000000;
      padding: 3px 4px;
      text-align: left;
      font-size: 7.5pt;
      color: #000000;
    }
    .permit-table th {
      background-color: #ffffff;
      font-weight: 900;
      text-transform: uppercase;
      color: #000000;
      font-size: 7pt;
      letter-spacing: 0.3px;
      border-bottom: 1.5px solid #000000;
    }
    .col-code {
      width: 24%;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 800;
      white-space: nowrap;
    }
    .col-desc {
      width: 48%;
    }
    .col-sig {
      width: 28%;
      text-align: center;
    }
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 2px;
      border-top: 1px dashed #000000;
    }
    .footer-table td {
      padding-top: 4px;
      font-size: 7pt;
      color: #000000;
    }
    .date-issued {
      font-weight: 800;
      color: #000000;
    }
    .security-mark {
      text-align: right;
      font-family: 'Courier New', Courier, monospace;
      font-size: 6.5pt;
      font-weight: 700;
      color: #000000;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title-block">
      <div class="main-title">EXAMINATION PERMIT</div>
    </div>

    <table class="info-grid">
      <tr>
        <td class="info-label">Name:</td>
        <td class="info-value" colspan="3">${escapeHtml(fullName)}</td>
      </tr>
      <tr>
        <td class="info-label">Student No:</td>
        <td class="info-value" style="font-family: 'Courier New', Courier, monospace; font-weight: 800;">${escapeHtml(student.student_number)}</td>
        <td class="info-label" style="width: 58px; padding-left: 6px;">Permit No:</td>
        <td class="info-value" style="font-family: 'Courier New', Courier, monospace; font-weight: 800;">${escapeHtml(permitNumber)}</td>
      </tr>
      <tr>
        <td class="info-label">Program:</td>
        <td class="info-value" colspan="3">${escapeHtml(programLine)}</td>
      </tr>
      <tr>
        <td class="info-label">Semester:</td>
        <td class="info-value">${escapeHtml(semester)}</td>
        <td class="info-label" style="width: 58px; padding-left: 6px;">S.Y:</td>
        <td class="info-value">${escapeHtml(academicYear)}</td>
      </tr>
    </table>

    <div class="period-header">${escapeHtml(examPeriod.toUpperCase())}</div>

    <table class="permit-table">
      <thead>
        <tr>
          <th class="col-code">SUBJECT CODE</th>
          <th class="col-desc">SUBJECT DESCRIPTION</th>
          <th class="col-sig">PROCTOR SIGNATURE</th>
        </tr>
      </thead>
      <tbody>
        ${subjectRowsHtml}
      </tbody>
    </table>

    <table class="footer-table">
      <tr>
        <td style="width: 50%;">Date Issued: <span class="date-issued">${escapeHtml(dateIssued)}</span></td>
        <td class="security-mark" style="width: 50%;">PERMEASE RFID KIOSK SYSTEM &bull; AUTH VALIDATED</td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

async function fetchBackendPrintHtml(identifier: string, examPeriod: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3000);

  try {
    const url = `/permits/${encodeURIComponent(identifier)}/print?period=${encodeURIComponent(examPeriod)}&auto=0`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'text/html' },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const html = await response.text();
    if (!html.includes('EXAMINATION PERMIT')) return null;

    return html;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function printHtmlViaHiddenIframe(html: string): void {
  const existing = document.getElementById(PRINT_FRAME_ID);
  if (existing) {
    existing.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = PRINT_FRAME_ID;
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.border = '0';

  let hasPrinted = false;
  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1000);
  };

  iframe.onload = () => {
    if (hasPrinted) return;
    hasPrinted = true;

    window.setTimeout(() => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        return;
      }

      win.addEventListener('afterprint', cleanup, { once: true });
      win.focus();
      win.print();

      // Safety cleanup if browser does not emit afterprint
      window.setTimeout(cleanup, 60000);
    }, 120);
  };

  document.body.appendChild(iframe);
  iframe.srcdoc = html;
}

/**
 * Print an examination permit silently (with Chrome --kiosk-printing) or via
 * the browser print dialog to the connected default printer (e.g. Y41BT Label).
 */
export async function printKioskPermit(payload: KioskPrintPayload): Promise<void> {
  const identifier = payload.student.student_number || String(payload.student.id);
  const backendHtml = await fetchBackendPrintHtml(identifier, payload.examPeriod);
  const htmlToPrint = backendHtml || buildThermalPermitHtml(payload);
  printHtmlViaHiddenIframe(htmlToPrint);
}
