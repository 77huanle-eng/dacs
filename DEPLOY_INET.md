# Deploy iNET Hosting - 77huanle.id.vn

Tai lieu nay danh rieng cho hosting iNET cua domain `77huanle.id.vn`.

Portal ban cung cap:

```text
https://portal.inet.vn/list-service/hosting/77huanle.id.vn/4834384
```

Luu y: khong gui mat khau portal/cPanel/database cho bat ky ai. Hay tu dang nhap va lam theo checklist ben duoi.

## 1. Thong tin deploy khuyen nghi

- Domain frontend: `https://77huanle.id.vn`
- Backend API: `https://77huanle.id.vn/backend/public/api`
- API health check: `https://77huanle.id.vn/backend/public/api/health`
- Document root thuong gap tren cPanel: `public_html`
- PHP yeu cau: PHP 8.1+ hoac 8.2
- Database: MySQL/MariaDB tren hosting iNET

## 2. Viec can lam trong portal iNET

1. Dang nhap portal iNET.
2. Chon goi hosting cua `77huanle.id.vn`.
3. Mo muc quan tri hosting/cPanel.
4. Tim cac muc sau:
   - `File Manager`
   - `Git Version Control` neu hosting co ho tro clone Git
   - `MySQL Database Wizard`
   - `phpMyAdmin`
   - `SSL/TLS` hoac `Let's Encrypt SSL`
   - `MultiPHP Manager` hoac `Select PHP Version`

## 3. Cau hinh PHP

Trong cPanel/iNET:

1. Mo `MultiPHP Manager` hoac `Select PHP Version`.
2. Chon PHP 8.1+.
3. Bat cac extension pho bien neu co tuy chon:
   - `pdo`
   - `pdo_mysql`
   - `mbstring`
   - `fileinfo`
   - `json`
   - `openssl`
   - `curl`
4. Luu cau hinh.

## 4. Upload source code

### Cach A - Dung Git Version Control neu iNET co ho tro

1. Vao `Git Version Control`.
2. Clone repo:

```text
https://github.com/77huanle-eng/dacs.git
```

3. Neu clone vao thu muc rieng, copy toan bo noi dung repo vao `public_html`.
4. Dam bao trong `public_html` co truc tiep:

```text
index.html
pages/
assets/
backend/
```

### Cach B - Upload ZIP bang File Manager

1. Tai ZIP repo tu GitHub.
2. Vao `File Manager` -> `public_html`.
3. Upload ZIP.
4. Extract.
5. Neu bi long thu muc, move file ben trong ra truc tiep `public_html`.

Ket qua dung:

```text
public_html/index.html
public_html/pages/
public_html/assets/
public_html/backend/public/index.php
public_html/backend/public/.htaccess
```

## 5. Tao database MySQL

Trong cPanel/iNET:

1. Mo `MySQL Database Wizard`.
2. Tao database, vi du:

```text
<cpanel_user>_viet_horizon
```

3. Tao database user, vi du:

```text
<cpanel_user>_vht_user
```

4. Dat password manh.
5. Gan user vao database voi `ALL PRIVILEGES`.
6. Ghi lai 4 thong tin:
   - database name
   - database username
   - database password
   - database host, thuong la `localhost`

## 6. Import database

1. Mo `phpMyAdmin`.
2. Chon database vua tao.
3. Import file:

```text
backend/database/schema_hosting.sql
```

4. Import tiep:

```text
backend/database/seed_hosting.sql
```

5. Neu database da co tu ban cu, can import them migration phu hop:

```text
backend/database/migrate_security_media_profile_hosting.sql
backend/database/migrate_posts_metadata_hosting.sql
backend/database/fix_bad_utf8_data_hosting.sql
```

Khong nen import `seed_1000.sql` tren hosting that neu database hosting nho. File nay chi nen dung khi can test load/pagination.


## Loi #1044 khi import SQL

Neu phpMyAdmin bao loi:

```text
#1044 - Access denied ... to database 'viet_horizon_travel'
```

Nguyen nhan: hosting shared da tao san database, user MySQL khong co quyen `CREATE DATABASE` va khong duoc `USE viet_horizon_travel`.

Cach xu ly: trong phpMyAdmin, chon database `zkjlpwjhosting_huanleidvn` o cot trai, sau do import cac file hosting-safe:

```text
backend/database/schema_hosting.sql
backend/database/seed_hosting.sql
```

Khong import `schema.sql`/`seed.sql` goc tren hosting iNET neu chung con dong `CREATE DATABASE` hoac `USE viet_horizon_travel`.

## 7. Tao file backend/.env production

Tao file:

```text
public_html/backend/.env
```

Noi dung mau cho `77huanle.id.vn`:

```env
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=Asia/Ho_Chi_Minh
APP_URL=https://77huanle.id.vn/backend/public

DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=YOUR_CPANEL_DATABASE_NAME
DB_USERNAME=YOUR_CPANEL_DATABASE_USER
DB_PASSWORD=YOUR_DATABASE_PASSWORD
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci

JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_32_CHARS_MINIMUM
JWT_ISSUER=viet-horizon.travel
JWT_AUDIENCE=viet-horizon.clients
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=2592000

CORS_ALLOWED_ORIGINS=https://77huanle.id.vn,https://www.77huanle.id.vn
FRONTEND_URL=https://77huanle.id.vn

MAIL_FROM_ADDRESS=no-reply@77huanle.id.vn
MAIL_FROM_NAME=Viet Horizon Travel
MAIL_TRANSPORT=mail
MAIL_SMTP_HOST=localhost
MAIL_SMTP_PORT=25
MAIL_SMTP_USER=
MAIL_SMTP_PASS=
MAIL_SMTP_SECURE=
MAIL_LOG_PREVIEW=false
```

Can thay 4 dong sau bang thong tin hosting that:

```env
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
JWT_SECRET=...
```

Tao JWT secret nhanh bang may local:

```powershell
php -r "echo bin2hex(random_bytes(32));"
```

Hoac dung password generator tao chuoi dai 64 ky tu.

## 8. Cau hinh API base frontend

Code hien tai da tu uu tien API production cung domain:

```text
https://77huanle.id.vn/backend/public/api
```

Neu muon co dinh tuyet doi, chen script nay vao truoc `assets/js/main.js` trong `index.html`:

```html
<script>
  window.__VHT_API_BASE__ = "https://77huanle.id.vn/backend/public/api";
</script>
```

Voi cac file trong `pages/`, chen truoc `../assets/js/main.js`:

```html
<script>
  window.__VHT_API_BASE__ = "https://77huanle.id.vn/backend/public/api";
</script>
```

Neu deploy dung cau truc `public_html/backend/public/api`, thuong khong can chen tay vi code da auto nhan cung domain.

## 9. Quyen thu muc upload/log

Kiem tra cac folder co ton tai:

```text
backend/public/uploads
backend/public/uploads/avatars
backend/public/uploads/tours
backend/storage/logs
```

Neu upload anh loi, set permission:

```text
folders: 755 hoac 775 neu hosting yeu cau
files: 644
```

## 10. SSL

1. Vao `SSL/TLS Status` hoac `Let's Encrypt SSL`.
2. Cap SSL cho:

```text
77huanle.id.vn
www.77huanle.id.vn
```

3. Neu co tuy chon Force HTTPS, bat len.
4. Sau khi bat SSL, toan bo `.env` va API base phai dung `https://`.

## 11. Test sau deploy

Test theo thu tu nay:

1. Mo trang chu:

```text
https://77huanle.id.vn/
```

2. Test API:

```text
https://77huanle.id.vn/backend/public/api/health
```

3. Mo DevTools -> Network, refresh trang, kiem tra khong co request nao goi:

```text
localhost
127.0.0.1
```

4. Dang nhap tai khoan seed:

```text
admin@viethorizon.vn / 123456
provider@viethorizon.vn / 123456
user@viethorizon.vn / 123456
```

5. Test user:
   - xem tour
   - xem chi tiet tour
   - wishlist
   - booking
   - payment
   - invoice
   - update profile/avatar

6. Test provider:
   - dashboard provider
   - quan ly tour
   - them/sua tour
   - upload anh tour
   - quan ly booking
   - khuyen mai

7. Test admin:
   - dashboard admin
   - user/category/tour/post/promotion CRUD
   - duyet provider request
   - comment/rating
   - invoice/payment

## 12. Loi thuong gap tren iNET/cPanel

### Trang chu vao duoc nhung API 404

Kiem tra:

- `backend/public/.htaccess` co duoc upload khong.
- URL test co dung khong: `/backend/public/api/health`.
- Hosting co ho tro rewrite khong.

### API 500

Tam thoi doi trong `backend/.env`:

```env
APP_DEBUG=true
```

Sau do test lai API de xem loi. Sua xong doi lai:

```env
APP_DEBUG=false
```

Nguyen nhan thuong gap:

- Sai DB name/user/password.
- Chua import database.
- PHP version thap hon 8.0/8.1.
- Thieu extension `pdo_mysql` hoac `fileinfo`.

### Login bao loi he thong

Kiem tra:

- API health co chay khong.
- Console/Network co goi dung `https://77huanle.id.vn/backend/public/api/auth/login` khong.
- DB co bang `users`, `roles`, `refresh_tokens` khong.
- `JWT_SECRET` da set chua.

### Upload anh loi

Kiem tra:

- `backend/public/uploads` co quyen ghi.
- PHP `upload_max_filesize` va `post_max_size` du lon.
- File upload la JPG/PNG/WEBP.

### CORS loi

Neu frontend va backend cung domain thi thuong khong loi. Neu van bi, kiem tra `.env`:

```env
CORS_ALLOWED_ORIGINS=https://77huanle.id.vn,https://www.77huanle.id.vn
FRONTEND_URL=https://77huanle.id.vn
```

### Frontend van goi localhost

Mo Console tren browser va chay:

```js
localStorage.removeItem("vh_api_base");
location.reload();
```

Neu van goi localhost, chen `window.__VHT_API_BASE__` nhu muc 8.

## 13. Checklist truoc khi xem la deploy xong

- [ ] `https://77huanle.id.vn/` mo duoc.
- [ ] `https://77huanle.id.vn/backend/public/api/health` tra JSON.
- [ ] Khong co request localhost trong Network.
- [ ] Login user/provider/admin duoc.
- [ ] Booking/payment/invoice chay duoc.
- [ ] Admin CRUD chay duoc.
- [ ] Provider CRUD chay duoc.
- [ ] Upload avatar/tour image chay duoc.
- [ ] Logout xong khong vao lai trang bao ve.
- [ ] `APP_DEBUG=false`.
- [ ] SSL dang hoat dong.
- [ ] Da doi mat khau/secret mac dinh neu can.

