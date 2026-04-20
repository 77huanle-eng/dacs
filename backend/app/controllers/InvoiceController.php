<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\ApiException;
use App\Core\Controller;
use App\Core\Database;
use App\Core\Request;
use App\Models\Invoice;

class InvoiceController extends Controller
{
    private Invoice $invoices;

    public function __construct()
    {
        $this->invoices = new Invoice();
    }

    public function detail(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $invoiceId = $this->routeId($params);

        $invoice = $this->fetchInvoiceWithBooking($invoiceId);
        $this->ensureAccess($user, $invoice);

        $this->ok($invoice, 'Lấy hóa đơn thành công.');
    }

    public function downloadPdf(Request $request, array $params): void
    {
        $user = $request->attribute('auth_user');
        $invoiceId = $this->routeId($params);

        $invoice = $this->fetchInvoiceWithBooking($invoiceId);
        $this->ensureAccess($user, $invoice);

        $pdf = $this->renderInvoicePdf($invoiceId, $invoice);
        $filename = preg_replace('/[^A-Za-z0-9\-_]/', '_', (string) ($invoice['invoice_code'] ?? ('invoice-' . $invoiceId))) . '.pdf';

        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($pdf));
        echo $pdf;
    }

    private function fetchInvoiceWithBooking(int $invoiceId): array
    {
        if ($invoiceId <= 0) {
            throw new ApiException('invoice id không hợp lệ.', 422);
        }

        $sql = 'SELECT i.*, b.booking_code, b.user_id, b.contact_name, b.contact_email, b.contact_phone,
                       b.total_guests, b.departure_date, t.title AS tour_title, t.destination
                FROM invoices i
                INNER JOIN bookings b ON b.id = i.booking_id
                INNER JOIN tours t ON t.id = b.tour_id
                WHERE i.id = :id
                LIMIT 1';

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute(['id' => $invoiceId]);
        $invoice = $stmt->fetch();

        if (!$invoice) {
            throw new ApiException('Không tìm thấy hóa đơn.', 404);
        }

        return $invoice;
    }

    private function ensureAccess(array $user, array $invoice): void
    {
        $role = strtolower((string) ($user['role_name'] ?? 'user'));
        if ($role === 'admin') {
            return;
        }

        if ((int) $invoice['user_id'] !== (int) $user['id']) {
            throw new ApiException('Bạn không có quyền xem hóa đơn này.', 403);
        }
    }

    private function renderInvoicePdf(int $invoiceId, array $invoice): string
    {
        $issuedAt = (string) ($invoice['issued_at'] ?? $invoice['created_at'] ?? date('Y-m-d H:i:s'));
        $statusLabel = strtoupper((string) ($invoice['payment_status'] ?? 'unpaid'));
        $contentBlocks = [];
        $y = 800;

        $pushLine = function (string $text, int $fontSize = 12, string $font = 'F1', int $x = 50, int $lineHeight = 18) use (&$contentBlocks, &$y): void {
            foreach ($this->wrapPdfText($text, 74) as $line) {
                $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $this->normalizePdfText($line));
                $contentBlocks[] = "BT";
                $contentBlocks[] = "/{$font} {$fontSize} Tf";
                $contentBlocks[] = "1 0 0 1 {$x} {$y} Tm";
                $contentBlocks[] = "({$escaped}) Tj";
                $contentBlocks[] = "ET";
                $y -= $lineHeight;
            }
        };

        $contentBlocks[] = "0.94 0.96 1 rg";
        $contentBlocks[] = "40 760 515 65 re f";
        $contentBlocks[] = "0 0 0 rg";

        $pushLine('VIET HORIZON TRAVEL', 18, 'F2', 50, 22);
        $pushLine('Booking Invoice / Hoa don dat tour', 12, 'F1', 50, 18);
        $y -= 6;

        $pushLine('THONG TIN CHUNG', 11, 'F2', 50, 18);
        $pushLine('Ma hoa don: ' . (string) ($invoice['invoice_code'] ?? ('INV-' . $invoiceId)));
        $pushLine('Ma booking: ' . (string) ($invoice['booking_code'] ?? '-'));
        $pushLine('Ngay phat hanh: ' . $issuedAt);
        $pushLine('Trang thai thanh toan: ' . $statusLabel);
        $y -= 4;

        $pushLine('THONG TIN KHACH HANG', 11, 'F2', 50, 18);
        $pushLine('Khach hang: ' . (string) ($invoice['contact_name'] ?? '-'));
        $pushLine('Email: ' . (string) ($invoice['contact_email'] ?? '-'));
        $pushLine('Dien thoai: ' . (string) ($invoice['contact_phone'] ?? '-'));
        $y -= 4;

        $pushLine('THONG TIN TOUR', 11, 'F2', 50, 18);
        $pushLine('Ten tour: ' . (string) ($invoice['tour_title'] ?? '-'));
        $pushLine('Diem den: ' . (string) ($invoice['destination'] ?? '-'));
        $pushLine('Ngay khoi hanh: ' . (string) ($invoice['departure_date'] ?? '-'));
        $pushLine('So khach: ' . (string) ($invoice['total_guests'] ?? '-'));
        $y -= 4;

        $contentBlocks[] = "0.97 0.98 1 rg";
        $contentBlocks[] = "40 " . ($y - 66) . " 515 72 re f";
        $contentBlocks[] = "0 0 0 rg";

        $pushLine('CHI TIET THANH TOAN', 11, 'F2', 50, 18);
        $pushLine('Tam tinh: ' . number_format((float) ($invoice['subtotal'] ?? 0), 0, '.', ',') . ' VND');
        $pushLine('Giam gia: ' . number_format((float) ($invoice['discount_amount'] ?? 0), 0, '.', ',') . ' VND');
        $pushLine('Tong thanh toan: ' . number_format((float) ($invoice['total_amount'] ?? 0), 0, '.', ',') . ' VND', 13, 'F2', 50, 20);
        $y -= 6;
        $pushLine('Generated at: ' . date('Y-m-d H:i:s'), 10, 'F1', 50, 16);

        $content = implode("\n", $contentBlocks);

        $objects = [
            "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
            "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
            "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
            "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
            "6 0 obj\n<< /Length " . strlen($content) . " >>\nstream\n{$content}\nendstream\nendobj\n",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object;
        }

        $xrefPosition = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";

        foreach ($offsets as $offset) {
            $pdf .= sprintf('%010d 00000 n ', $offset) . "\n";
        }

        $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xrefPosition}\n%%EOF";

        return $pdf;
    }

    private function wrapPdfText(string $value, int $maxLength = 80): array
    {
        $normalized = trim((string) $value);
        if ($normalized === '') {
            return ['-'];
        }

        $words = preg_split('/\s+/', $normalized) ?: [];
        $lines = [];
        $current = '';

        foreach ($words as $word) {
            $candidate = trim($current . ' ' . $word);
            if ($current !== '' && strlen($candidate) > $maxLength) {
                $lines[] = $current;
                $current = $word;
                continue;
            }

            $current = $candidate;
        }

        if ($current !== '') {
            $lines[] = $current;
        }

        return $lines !== [] ? $lines : ['-'];
    }

    private function normalizePdfText(string $value): string
    {
        $map = [
            'Đ' => 'D',
            'đ' => 'd',
            'Ă' => 'A', 'ă' => 'a',
            'Â' => 'A', 'â' => 'a',
            'Ê' => 'E', 'ê' => 'e',
            'Ô' => 'O', 'ô' => 'o',
            'Ơ' => 'O', 'ơ' => 'o',
            'Ư' => 'U', 'ư' => 'u',
            '–' => '-',
            '—' => '-',
            '₫' => 'VND',
        ];

        $normalized = strtr($value, $map);
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $normalized);
        if ($ascii === false) {
            $ascii = preg_replace('/[^\x20-\x7E]/', '', $normalized) ?? '';
        }

        return trim((string) $ascii);
    }
}
