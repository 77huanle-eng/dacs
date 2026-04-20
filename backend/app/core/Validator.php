<?php

declare(strict_types=1);

namespace App\Core;

final class Validator
{
    public static function validate(array $data, array $rules): array
    {
        $errors = [];

        foreach ($rules as $field => $ruleString) {
            $value = $data[$field] ?? null;
            $ruleParts = explode('|', $ruleString);

            foreach ($ruleParts as $rulePart) {
                [$rule, $param] = array_pad(explode(':', $rulePart, 2), 2, null);

                if ($rule === 'required' && ($value === null || $value === '')) {
                    $errors[$field][] = "{$field} là bắt buộc.";
                }

                if ($value === null || $value === '') {
                    continue;
                }

                if ($rule === 'email' && !filter_var((string) $value, FILTER_VALIDATE_EMAIL)) {
                    $errors[$field][] = "{$field} không đúng định dạng email.";
                }

                if ($rule === 'string' && !is_string($value)) {
                    $errors[$field][] = "{$field} phải là chuỗi.";
                }

                if ($rule === 'min' && is_scalar($value) && mb_strlen((string) $value) < (int) $param) {
                    $errors[$field][] = "{$field} tối thiểu {$param} ký tự.";
                }

                if ($rule === 'max' && is_scalar($value) && mb_strlen((string) $value) > (int) $param) {
                    $errors[$field][] = "{$field} tối đa {$param} ký tự.";
                }

                if ($rule === 'numeric' && !is_numeric($value)) {
                    $errors[$field][] = "{$field} phải là số.";
                }

                if ($rule === 'integer' && filter_var($value, FILTER_VALIDATE_INT) === false) {
                    $errors[$field][] = "{$field} phải là số nguyên.";
                }

                if ($rule === 'phone') {
                    $normalizedPhone = preg_replace('/\s+/', '', (string) $value);
                    if (!preg_match('/^(0|\+84)[0-9]{8,11}$/', $normalizedPhone)) {
                        $errors[$field][] = "{$field} không đúng định dạng số điện thoại.";
                    }
                }

                if ($rule === 'array' && !is_array($value)) {
                    $errors[$field][] = "{$field} phải là mảng hợp lệ.";
                }

                if ($rule === 'boolean' && !in_array($value, [true, false, 0, 1, '0', '1'], true)) {
                    $errors[$field][] = "{$field} phải là kiểu bật/tắt hợp lệ.";
                }

                if ($rule === 'in' && $param !== null) {
                    $allow = explode(',', $param);
                    if (!in_array((string) $value, $allow, true)) {
                        $errors[$field][] = "{$field} không hợp lệ.";
                    }
                }

                if ($rule === 'date' && strtotime((string) $value) === false) {
                    $errors[$field][] = "{$field} phải là ngày hợp lệ.";
                }

                if ($rule === 'after_or_equal' && $param !== null) {
                    $compareValue = $data[$param] ?? null;
                    if ($compareValue !== null && $compareValue !== '' && strtotime((string) $value) !== false && strtotime((string) $compareValue) !== false) {
                        if (strtotime((string) $value) < strtotime((string) $compareValue)) {
                            $errors[$field][] = "{$field} phải sau hoặc bằng {$param}.";
                        }
                    }
                }

                if ($rule === 'url' && !filter_var((string) $value, FILTER_VALIDATE_URL)) {
                    $errors[$field][] = "{$field} không đúng định dạng URL.";
                }

                if ($rule === 'min_num' && is_numeric($value) && (float) $value < (float) $param) {
                    $errors[$field][] = "{$field} tối thiểu {$param}.";
                }

                if ($rule === 'max_num' && is_numeric($value) && (float) $value > (float) $param) {
                    $errors[$field][] = "{$field} tối đa {$param}.";
                }
            }
        }

        return $errors;
    }
}
