export function applyTourFilters(tours, filters = {}, options = {}) {
  const {
    keyword = "",
    location = "",
    type = "",
    duration = "",
    rating = "",
    price = ""
  } = filters;

  const isPromoMode = Boolean(options.promoOnly);

  const [minPrice, maxPrice] = (() => {
    if (!price) return [0, Number.MAX_SAFE_INTEGER];
    const [min, max] = String(price)
      .split("-")
      .map((value) => Number(value));
    return [min || 0, max || Number.MAX_SAFE_INTEGER];
  })();

  const normalizedKeyword = String(keyword).trim().toLowerCase();
  const minRating = Number(rating || 0);

  return tours.filter((tour) => {
    const matchKeyword = normalizedKeyword
      ? `${tour.name} ${tour.location} ${tour.type}`.toLowerCase().includes(normalizedKeyword)
      : true;

    const matchLocation = location ? tour.location === location : true;
    const matchType = type ? tour.type === type : true;

    const matchDuration = duration
      ? Number(duration) >= 6
        ? Number(tour.duration) >= 6
        : Number(tour.duration) === Number(duration)
      : true;

    const matchRating = minRating ? Number(tour.rating) >= minRating : true;
    const matchPrice = Number(tour.price) >= minPrice && Number(tour.price) <= maxPrice;
    const matchPromo = isPromoMode ? Number(tour.oldPrice) > Number(tour.price) : true;

    return (
      matchKeyword &&
      matchLocation &&
      matchType &&
      matchDuration &&
      matchRating &&
      matchPrice &&
      matchPromo
    );
  });
}

export function sortTours(tours, sort = "newest") {
  const items = [...tours];
  items.sort((a, b) => {
    if (sort === "price-asc") return Number(a.price) - Number(b.price);
    if (sort === "price-desc") return Number(b.price) - Number(a.price);
    if (sort === "popular") return Number(b.booked) - Number(a.booked);
    return Number(b.id) - Number(a.id);
  });
  return items;
}

export function calcDiscount(subTotal, coupon) {
  if (!coupon) return 0;
  if (!coupon.status || coupon.status !== "Đang hoạt động") return 0;
  if (coupon.type === "percent") return Math.round((subTotal * Number(coupon.value || 0)) / 100);
  return Number(coupon.value || 0);
}

export function calcBookingTotals({ unitPrice, people, coupon = null }) {
  const safePeople = Math.max(1, Number(people || 1));
  const subTotal = Number(unitPrice || 0) * safePeople;
  const discount = calcDiscount(subTotal, coupon);
  const total = Math.max(0, subTotal - discount);
  return {
    people: safePeople,
    subTotal,
    discount,
    total
  };
}
