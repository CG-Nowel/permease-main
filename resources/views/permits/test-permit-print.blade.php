<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Print Examination Permit - {{ $student->student_number }}</title>
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
            margin: 0 auto;
            padding: 0;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 8.5pt;
            line-height: 1.25;
            color: #000000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        @media screen {
            html, body {
                width: 100mm;
                max-width: 100mm;
                padding: 4mm;
                margin: 10px auto;
                border: 1px dashed #94a3b8;
            }
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
            background-color: #ffffff !important;
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
        @media print {
            html, body {
                width: 92mm;
                max-width: 92mm;
                height: auto;
                max-height: 140mm;
                margin: 0;
                padding: 0;
                border: none;
                overflow: hidden;
            }
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Main Top Title -->
        <div class="title-block">
            <div class="main-title">EXAMINATION PERMIT</div>
        </div>

        <!-- Student Details Block -->
        <table class="info-grid">
            <tr>
                <td class="info-label">Name:</td>
                <td class="info-value" colspan="3">{{ strtoupper($student->last_name) }}, {{ strtoupper($student->first_name) }} {{ strtoupper($student->middle_name ?? '') }}</td>
            </tr>
            <tr>
                <td class="info-label">Student No:</td>
                <td class="info-value" style="font-family: 'Courier New', Courier, monospace; font-weight: 800;">{{ $student->student_number }}</td>
                <td class="info-label" style="width: 58px; padding-left: 6px;">Permit No:</td>
                <td class="info-value" style="font-family: 'Courier New', Courier, monospace; font-weight: 800;">{{ $permitNumber }}</td>
            </tr>
            <tr>
                <td class="info-label">Program:</td>
                <td class="info-value" colspan="3">{{ $student->course }} {{ $student->program }} ({{ $student->grade_year_level ?? '1st Year' }} - {{ $student->section ?? 'A' }})</td>
            </tr>
            <tr>
                <td class="info-label">Semester:</td>
                <td class="info-value">{{ $semester }}</td>
                <td class="info-label" style="width: 58px; padding-left: 6px;">S.Y:</td>
                <td class="info-value">{{ $academicYear }}</td>
            </tr>
        </table>

        <!-- Examination Period Heading -->
        <div class="period-header">{{ strtoupper($examPeriod) }}</div>

        <!-- Subjects & Proctor Signature Table -->
        <table class="permit-table">
            <thead>
                <tr>
                    <th class="col-code">SUBJECT CODE</th>
                    <th class="col-desc">SUBJECT DESCRIPTION</th>
                    <th class="col-sig">PROCTOR SIGNATURE</th>
                </tr>
            </thead>
            <tbody>
                @forelse($subjects as $subject)
                    <tr>
                        <td class="col-code">{{ $subject['code'] }}</td>
                        <td class="col-desc">{{ $subject['title'] }}</td>
                        <td class="col-sig" style="height: 18px;">&nbsp;</td>
                    </tr>
                @empty
                    <tr>
                        <td class="col-code">IT 101</td>
                        <td class="col-desc">Introduction to Information Technology</td>
                        <td class="col-sig" style="height: 18px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td class="col-code">IT 102</td>
                        <td class="col-desc">Computer Programming 1</td>
                        <td class="col-sig" style="height: 18px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td class="col-code">GE 101</td>
                        <td class="col-desc">Understanding the Self</td>
                        <td class="col-sig" style="height: 18px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td class="col-code">GE 102</td>
                        <td class="col-desc">Readings in Philippine History</td>
                        <td class="col-sig" style="height: 18px;">&nbsp;</td>
                    </tr>
                @endforelse

                @php
                    $count = count($subjects);
                    $minRows = 5;
                @endphp
                @for($i = $count; $i < $minRows; $i++)
                    <tr>
                        <td class="col-code">&nbsp;</td>
                        <td class="col-desc">&nbsp;</td>
                        <td class="col-sig" style="height: 18px;">&nbsp;</td>
                    </tr>
                @endfor
            </tbody>
        </table>

        <!-- Date Issued & Security Footer -->
        <table class="footer-table">
            <tr>
                <td style="width: 50%;">
                    Date Issued: <span class="date-issued">{{ $dateIssued }}</span>
                </td>
                <td class="security-mark" style="width: 50%;">
                    PERMEASE RFID KIOSK SYSTEM • AUTH VALIDATED
                </td>
            </tr>
        </table>
    </div>

    <!-- Automatic Direct Hardware Print Trigger & Auto-Close -->
    @if(request()->query('auto') !== '0')
    <script>
        window.addEventListener('load', function() {
            setTimeout(function() {
                window.focus();
                window.print();
            }, 300);
        });

        // Automatically close the window after printing is sent or cancelled
        window.addEventListener('afterprint', function() {
            setTimeout(function() {
                try {
                    window.close();
                } catch(e) {}
            }, 400);
        });
    </script>
    @endif
</body>
</html>
