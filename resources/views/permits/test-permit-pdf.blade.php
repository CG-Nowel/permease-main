<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Examination Permit - {{ $student->student_number }}</title>
    <style>
        @page {
            size: a6 landscape;
            margin: 6mm 8mm 6mm 8mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #111827;
            background: #ffffff;
            font-size: 8pt;
            line-height: 1.2;
            width: 100%;
        }
        .container {
            width: 100%;
        }
        .title-block {
            text-align: center;
            margin-bottom: 4px;
        }
        .main-title {
            font-size: 11pt;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #0b1b3d;
        }
        .sub-curly {
            font-size: 8pt;
            font-weight: bold;
            color: #4b5563;
            margin-top: 1px;
        }
        .info-grid {
            width: 100%;
            margin-bottom: 5px;
            border-collapse: collapse;
        }
        .info-grid td {
            vertical-align: top;
            padding: 1px 0;
            font-size: 7.8pt;
        }
        .info-label {
            font-weight: bold;
            color: #1f2937;
            width: 72px;
        }
        .info-value {
            color: #111827;
            font-weight: 500;
        }
        .period-header {
            text-align: center;
            font-size: 9pt;
            font-weight: 900;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #0b1b3d;
            margin: 3px 0 3px 0;
        }
        .permit-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }
        .permit-table th,
        .permit-table td {
            border: 1px solid #1f2937;
            padding: 3px 5px;
            text-align: left;
            font-size: 7pt;
        }
        .permit-table th {
            background-color: #f3f4f6;
            font-weight: bold;
            text-transform: uppercase;
            color: #111827;
            font-size: 6.8pt;
            letter-spacing: 0.5px;
        }
        .col-code {
            width: 25%;
            font-family: 'Courier', monospace;
            font-weight: bold;
        }
        .col-desc {
            width: 48%;
        }
        .col-sig {
            width: 27%;
            text-align: center;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }
        .footer-table td {
            font-size: 7pt;
            color: #374151;
        }
        .date-issued {
            font-weight: bold;
            color: #111827;
        }
        .security-mark {
            text-align: right;
            font-family: 'Courier', monospace;
            font-size: 6.5pt;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Main Top Title -->
        <div class="title-block">
            <div class="main-title">EXAMINATION PERMIT</div>
            <div class="sub-curly">{ {{ strtoupper($examPeriod) }} }</div>
        </div>

        <!-- Student Details Block -->
        <table class="info-grid">
            <tr>
                <td style="width: 58%;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td class="info-label">Name:</td>
                            <td class="info-value">{{ strtoupper($student->last_name) }}, {{ strtoupper($student->first_name) }} {{ strtoupper($student->middle_name ?? '') }}</td>
                        </tr>
                        <tr>
                            <td class="info-label">Student No:</td>
                            <td class="info-value" style="font-family: 'Courier', monospace; font-weight: bold;">{{ $student->student_number }}</td>
                        </tr>
                        <tr>
                            <td class="info-label">Program:</td>
                            <td class="info-value">{{ $student->course }} {{ $student->program }} ({{ $student->grade_year_level ?? '1st Year' }} - {{ $student->section ?? 'A' }})</td>
                        </tr>
                    </table>
                </td>
                <td style="width: 42%;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td class="info-label" style="width: 60px;">Semester:</td>
                            <td class="info-value">{{ $semester }}</td>
                        </tr>
                        <tr>
                            <td class="info-label" style="width: 60px;">S.Y:</td>
                            <td class="info-value">{{ $academicYear }}</td>
                        </tr>
                        <tr>
                            <td class="info-label" style="width: 60px;">Permit No:</td>
                            <td class="info-value" style="font-family: 'Courier', monospace; font-weight: bold; color: #1e40af;">{{ $permitNumber }}</td>
                        </tr>
                    </table>
                </td>
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

                {{-- Guarantee minimal row count so table looks uniform --}}
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
</body>
</html>
