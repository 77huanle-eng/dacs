import test from "node:test";
import assert from "node:assert/strict";
import { applyTourFilters, calcBookingTotals, sortTours } from "../assets/js/core/logic.js";

const seedTours = [
  { id: 1, name: "Đà Nẵng", location: "Đà Nẵng", type: "Nghỉ dưỡng", duration: 3, rating: 4.5, price: 4_500_000, oldPrice: 5_000_000, booked: 140 },
  { id: 2, name: "Phú Quốc", location: "Phú Quốc", type: "Nghỉ dưỡng", duration: 4, rating: 4.9, price: 6_900_000, oldPrice: 7_900_000, booked: 200 },
  { id: 3, name: "Bangkok", location: "Bangkok", type: "Quốc tế", duration: 5, rating: 4.2, price: 11_000_000, oldPrice: 11_000_000, booked: 90 },
  { id: 4, name: "Hàn Quốc", location: "Seoul", type: "Quốc tế", duration: 6, rating: 4.8, price: 20_500_000, oldPrice: 22_500_000, booked: 180 }
];

test("applyTourFilters lọc đúng theo từ khóa + giá + rating", () => {
  const rows = applyTourFilters(seedTours, {
    keyword: "quốc",
    price: "10000000-25000000",
    rating: "4.5"
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 4);
});

test("applyTourFilters promoOnly chỉ lấy tour có giảm giá", () => {
  const rows = applyTourFilters(seedTours, {}, { promoOnly: true });
  const ids = rows.map((item) => item.id);
  assert.deepEqual(ids, [1, 2, 4]);
});

test("sortTours hỗ trợ price asc/desc và popular", () => {
  const asc = sortTours(seedTours, "price-asc").map((item) => item.id);
  const desc = sortTours(seedTours, "price-desc").map((item) => item.id);
  const popular = sortTours(seedTours, "popular").map((item) => item.id);

  assert.deepEqual(asc, [1, 2, 3, 4]);
  assert.deepEqual(desc, [4, 3, 2, 1]);
  assert.deepEqual(popular, [2, 4, 1, 3]);
});

test("calcBookingTotals tính tổng tiền có coupon phần trăm", () => {
  const totals = calcBookingTotals({
    unitPrice: 5_000_000,
    people: 3,
    coupon: { status: "Đang hoạt động", type: "percent", value: 10 }
  });

  assert.equal(totals.people, 3);
  assert.equal(totals.subTotal, 15_000_000);
  assert.equal(totals.discount, 1_500_000);
  assert.equal(totals.total, 13_500_000);
});

test("calcBookingTotals không để tổng âm", () => {
  const totals = calcBookingTotals({
    unitPrice: 300_000,
    people: 1,
    coupon: { status: "Đang hoạt động", type: "flat", value: 1_000_000 }
  });

  assert.equal(totals.total, 0);
});
