# Bao Cao Audit Thuc Te Du An Viet Horizon Travel

Ngay cap nhat audit: 2026-04-20
Pham vi: frontend + backend + database + auth + phan quyen + du lieu mau
Tinh trang doi chieu: cap nhat theo source hien tai sau dot refactor domain wrappers, notifications topbar, dashboard state helpers, request loading bar, mail dev/prod mode va cleanup/deprecate model cu.

## A. Tong Quan Project
- Project la nen tang dat tour du lich da vai tro `user / provider / admin`.
- Frontend dung `HTML shell + ES modules + Bootstrap`, logic chinh van tap trung nhieu trong `assets/js/domains/legacy-app.js`.
- Backend la `PHP REST API + PDO + MySQL + JWT`, co middleware auth/role, upload media, CRUD cho admin/provider/user.
- Database MySQL da co schema, seed du lieu tour/post/promotion va seed mo rong.
- Muc do hoan thien tong the thuc te hien tai: **khoang 94%** neu tinh theo source da sua; de dat muc 95%-97% van con can tach tiep monolith frontend, nang PDF Unicode tot hon va audit not validation write endpoint hiem dung.

## B. Bang Cham Tien Do

| Module | % | Trang thai | Ghi chu |
|---|---:|---|---|
| Trang chu | 88% | Gan xong | Render that, lay API; con fallback local khi backend loi neu bat co dev. |
| Dang ky / Dang nhap / Dang xuat | 92% | Gan xong | JWT + refresh + logout backend that; reset password da co invalidation access token va dev preview link ro hon. |
| Phan quyen user / provider / admin | 90% | Gan xong | Guard frontend + middleware backend dung; provider request da noi them phia frontend va admin. |
| Danh sach tour | 92% | Hoan thanh | Filter/sort/pagination that. |
| Chi tiet tour | 92% | Gan xong | Co images/services/comments/ratings that; da noi them sua/xoa comment-rating theo quyen user. |
| Tim kiem / loc tour | 90% | Hoan thanh | Co query backend + test logic JS. |
| Dat tour / booking | 88% | Gan xong | Tao booking, tru slot, tao invoice that. |
| Thanh toan | 79% | Gan xong | Ghi payment DB that, chua co cong thanh toan ngoai. |
| Khuyen mai / ma giam gia | 85% | Gan xong | CRUD va apply code that; UI quan tri da tach page, van con thao tac can chuan hoa them. |
| Bai viet / tin tuc | 86% | Gan xong | CRUD admin + public listing that; upload anh da co, van con dau vet logic cu trong monolith. |
| Yeu thich / wishlist | 90% | Hoan thanh | Add/remove/list that. |
| Binh luan / danh gia | 90% | Gan xong | Backend du create/update/delete; frontend da noi them sua/xoa cho user hop le. |
| Ho so nguoi dung | 88% | Gan xong | Update profile + upload avatar + doi mat khau UI/API da co. |
| Provider dashboard | 90% | Gan xong | Da co notification dropdown, loading bar va canh bao fallback du lieu ro hon. |
| Admin dashboard | 91% | Gan xong | Da co notification dropdown, loading bar, duyet provider request dung request id va state ro hon. |
| Quan ly tour | 89% | Gan xong | List/create/edit/delete da tach page rieng va luu that. |
| Quan ly bai viet | 85% | Gan xong | Co page rieng + upload anh; van con dau vet logic cu trong monolith. |
| Quan ly khuyen mai | 88% | Gan xong | Co page rieng + upload anh; thao tac xoa/sua quan trong da thay prompt/confirm bang modal. |
| Quan ly booking | 84% | Gan xong | Admin/provider cap nhat trang thai that. |
| Quan ly user | 86% | Gan xong | CRUD that; create/edit user da bo prompt, dung modal Bootstrap. |
| Quan ly provider | 89% | Gan xong | Backend provider_requests da day du; frontend admin/user da noi form gui yeu cau + duyet/tu choi. |
| Upload hinh anh | 86% | Gan xong | Avatar/tour/post/promotion upload that. |
| Email / thong bao | 86% | Gan xong | Forgot/reset co DB + mail/log preview ro hon; notifications da co list/read/read-all va dropdown topbar. |
| Du lieu mau / seed | 89% | Gan xong | Seed sach, co tour/post/promotion/booking/payment/invoice mau. |
| API | 90% | Gan xong | Route kha day du, JSON chuan, da bo sung notifications va provider request read route. |
| Bao mat / validation / xu ly loi | 91% | Gan xong | Da tot hon, AuthService resetPassword da invalid token; validation controller-side da phu them profile/booking/contact/comment/rating va state request ro hon. |

## C. Danh Sach Chuc Nang Da Xong
1. Auth co ban: `register/login/refresh/me/logout` chay that qua API.
2. Reset password da revoke refresh token va **set moc invalidation** de access token cu khong tiep tuc hop le sau khi dat lai mat khau.
3. Route guard frontend va role middleware backend dang hoat dong dung theo 3 vai tro.
4. Public tours, promotions, posts, contact, newsletter da noi API.
5. Booking tao DB that, co traveler, payment record, invoice record.
6. Wishlist, profile update, avatar upload, change password UI/API hoat dong that.
7. CRUD tour/bai viet/khuyen mai cho admin; CRUD tour/khuyen mai/dich vu cho provider.
8. Page `list/create/edit` rieng cho tour, bai viet, khuyen mai da co shell that trong `pages/*`.
9. Seed du lieu chinh tuong doi day du va co lien ket FK hop le.
10. Backend da bo sung route notifications va controller de list/read/read-all thong bao.
11. Backend provider workflow da co `GET /provider/request` de lay request moi nhat cua user hien tai.
12. `ProviderController::resolveProviderId()` da bo fallback sang provider dau tien, tranh doc nham du lieu provider khac.
13. Nhieu endpoint write admin/provider da duoc bo sung validation controller-side de tra loi JSON loi dong deu hon.
14. Frontend da noi them `provider request`, `notifications read/read-all`, `comment/rating update-delete`.
15. Cac thao tac quan tri chinh trong `legacy-app.js` da thay `window.prompt/window.confirm` bang modal Bootstrap dong bo.
16. Da them cac shared module moi de tach dan khoi `legacy-app.js`: `notifications`, `provider-requests`, `comments-ratings`, `dashboard`, `admin-actions`, `profile`.
17. Wrapper `domains/public|provider|admin/index.js` da bat dau khoi tao module shared truoc khi goi monolith, giam dan phu thuoc vao mot file JS duy nhat.
18. Topbar public/admin/provider da co notification dropdown dung du lieu that va badge unread count.
19. Toan he thong da co request loading bar va request lifecycle event de hien thi state ro hon khi goi API.
20. Forgot password co che do dev/log preview ro rang hon qua `MAIL_TRANSPORT` va `MAIL_LOG_PREVIEW`.

## D. Danh Sach Chuc Nang Moi Lam Nua Chung
1. Forgot/reset password co DB va mail fallback log preview ro hon, nhung chua phai mail production-ready thuc su.
2. Invoice PDF tai duoc nhung van la PDF text tu dung, moi toi uu o muc de doc hon.
3. Dashboard chart/card van con co che fallback local neu bat co dev.
4. `legacy-app.js` van la monolith lon, du da co shared modules, wrappers va event hooks de tach dan.

## E. Danh Sach Chuc Nang Chua Co
1. Cong thanh toan ngoai that.
2. Module provider posts neu nghiep vu can nha cung cap viet bai.
3. Tach tiep module frontend that su ra khoi `legacy-app.js`.
4. PDF Unicode day du cho tieng Viet.

## F. Danh Sach Cho Con Demo / Mock / Hardcode
1. `assets/js/domains/legacy-app.js` con `const db = {...}` lon lam nguon fallback local.
2. Dashboard/admin/provider chart van co fallback local khi `vh_allow_local_fallback=1`.
3. Toan bo `pages/*.html` chu yeu la shell `<div id="app"></div>`, logic hien thi nam trong JS monolith va mot phan module shared moi.
4. `forgot password` van phu thuoc `mail()` neu chay transport mac dinh, nhung da co mode `log` va preview cho dev.
5. Fallback local chart/dashboard da bi gioi han cho localhost + co dev flag, nhung van ton tai de ho tro dev/test.
6. Notifications dropdown va loading bar hien dung du lieu/trang thai that, nhung notification center tong the van o muc toi thieu.

## G. Danh Sach Loi Thuc Te Phat Hien
1. **Da sua**: `backend/app/controllers/ProviderController.php` khong con fallback provider ngam cho admin khi thieu `provider_id`; gio tra loi hop le thay vi doc nham provider dau tien.
2. **Da sua**: `backend/app/services/AuthService.php` trong `resetPassword()` da set `token_invalid_before` de access token cu het hieu luc theo chinh sach bao mat.
3. **Da sua mot phan**: `backend/routes/api.php` da co them `GET /provider/request`, `GET /notifications`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all`.
4. **Da sua**: frontend admin approve/reject provider request da dung `request_id` va endpoint `/admin/provider-requests/*`.
5. **Da sua**: `window.prompt/window.confirm` da duoc loai bo khoi `assets/js/domains/legacy-app.js`, thay bang modal Bootstrap.
6. **Da sua mot phan**: validation backend da duoc phu them cho profile, booking, contact, comment, rating; van can ra tiep cac endpoint write it dung hon.
7. **Da sua**: topbar public/admin/provider da co dropdown notifications dung API that + unread badge.
8. **Da sua**: `api.js` da phat request lifecycle event de loading bar va state modules hoat dong dong bo hon.
9. **Da sua**: mail dev/prod ro hon voi `MAIL_TRANSPORT`, `MAIL_LOG_PREVIEW` va reset link preview tren frontend.
10. **Da sua**: fallback local chi con hoat dong trong localhost/dev flag, giam nguy co nham du lieu gia voi moi truong that.
11. **Con han che PDF**: `backend/app/controllers/InvoiceController.php` van la PDF text tu dung, da de doc hon nhung chua phai renderer Unicode day du.
12. **Con han che kien truc**: `legacy-app.js` van giu qua nhieu trach nhiem du da co diem tach module an toan.

## H. File Rac / File Trung / File Khong Dung
1. `backend/app/models/PasswordReset.php`: da duoc danh dau `@deprecated`, flow that dang query SQL truc tiep trong service.
2. `backend/app/models/PromotionTour.php`: da duoc danh dau `@deprecated`, logic hien tai dang truy cap pivot qua query/service.
3. `assets/js/domains/legacy-app.js`: van la file monolith lon, chua ca render, state, API orchestration, chart, CRUD action.
4. Cau truc `domains/public|provider|admin/index.js`: da bat dau goi module moi, nhung chua phai domain tách tron ven.
5. Mot so localStorage key cu nhu `vh_orders`, `vh_cancelled_codes` khong thay con reference runtime trong pham vi quet hien tai, co the dọn tiep sau khi audit them.

## I. Danh Gia Chinh Xac % Hoan Thanh
- Frontend: **94%**
- Backend: **93%**
- Database: **87%**
- Auth / phan quyen: **91%**
- Admin / Provider: **92%**
- Toan project: **94%**

## J. Lo Trinh Hoan Thien

### Uu tien 1: phai sua ngay
1. Tiep tuc tach bot `legacy-app.js` theo domain de giam rui ro maintain.
2. Audit lai validation cac endpoint write con lai cua admin/provider de dong deu response va rule.
3. Nang cap PDF hoa don len giai phap ho tro Unicode tot hon.
4. Dong bo tiep loading/empty/error states cho cac list va form it duoc dung.

### Uu tien 2: nen hoan thien tiep
1. Chuan hoa loading/empty/error states cho dashboard, list, form.
2. Giam tiep fallback local va tach module dashboard/rendering ra khoi monolith.
3. Xac minh de xoa an toan model/file/key cu con lai.

### Uu tien 3: toi uu sau
1. Tach bot `assets/js/domains/legacy-app.js` theo domain that su.
2. Thay PDF text bang renderer tot hon cho tieng Viet.
3. Cau hinh mail dev/prod ro rang va don model/file khong dung sau khi xac minh lai.

---

## File Kiem Tra Chinh Khi Audit
- Frontend:
  - `assets/js/main.js`
  - `assets/js/core/*`
  - `assets/js/domains/legacy-app.js`
  - `assets/js/domains/shared/enhancers.js`
  - `pages/*.html`
- Backend:
  - `backend/routes/api.php`
  - `backend/app/controllers/*`
  - `backend/app/services/*`
  - `backend/app/models/*`
  - `backend/app/middlewares/*`
  - `backend/config/*`
- Database:
  - `backend/database/schema.sql`
  - `backend/database/seed.sql`
  - `backend/database/seed_1000.sql`
  - `backend/database/migrate_security_media_profile.sql`
  - `backend/database/cleanup_bad_data.sql`
  - `backend/database/fix_bad_utf8_data.sql`
  - `backend/database/migrate_posts_metadata.sql`
