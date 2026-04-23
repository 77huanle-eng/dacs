# Viet Horizon Travel - Huong dan deploy hosting/cPanel

Tai lieu nay dung cho project hien tai: frontend HTML/CSS/JS modules nam o thu muc goc, backend PHP REST API nam trong `backend/`, API entrypoint la `backend/public/index.php`, database MySQL import tu `backend/database/schema.sql` va `backend/database/seed.sql`.

## 1. Kien truc deploy khuyen nghi

Phuong an de nhat cho project nay:

- Hosting co cPanel ho tro PHP 8.1+ va MySQL.
- Source code lay tu GitHub: `https://github.com/77huanle-eng/dacs`.
- Frontend va backend nam chung mot hosting.
- Frontend chay o domain chinh, vi du: `https://your-domain.com`.
- Backend API chay o: `https://your-domain.com/backend/public/api`.

Khong nen dung GitHub Pages cho full project nay vi GitHub Pages chi host duoc static HTML/CSS/JS, khong chay duoc PHP API, khong co MySQL, khong xu ly upload/JWT/booking/payment that.

Phuong an thay the neu can nang cap sau:

- VPS: linh hoat nhat, can biet cau hinh Nginx/Apache/PHP-FPM/MySQL.
- Render/Fly/Railway: phu hop app co backend rieng, nhung PHP + MySQL shared hosting thuong de hon cho nguoi moi.

## 2. Thu muc can dua len hosting

Neu document root domain la `public_html`, dat source nhu sau:

```text
public_html/
  index.html
  pages/
  assets/
  backend/
    app/
    config/
    database/
    public/
      index.php
      .htaccess
      uploads/
    routes/
    storage/
    .env
```

URL can test sau khi upload:

- Website: `https://your-domain.com/`
- API health: `https://your-domain.com/backend/public/api/health`

Neu muon API dep hon la `https://your-domain.com/api`, can cau hinh rewrite rieng o root hosting. Cach mac dinh an toan nhat la dung `/backend/public/api`.

## 3. Tao database tren cPanel

1. Vao cPanel.
2. Mo `MySQL Database Wizard`.
3. Tao database, vi du: `cpuser_viet_horizon`.
4. Tao user database, vi du: `cpuser_vht_user`.
5. Gan user vao database voi quyen `ALL PRIVILEGES`.
6. Mo `phpMyAdmin`.
7. Chon database vua tao.
8. Import lan luot:
   - `backend/database/schema.sql`
   - `backend/database/seed.sql`
9. Neu can bo sung migration da co trong project, import tiep cac file SQL migrate/cleanup phu hop:
   - `backend/database/migrate_security_media_profile.sql`
   - `backend/database/migrate_posts_metadata.sql`
   - `backend/database/cleanup_bad_data.sql`
   - `backend/database/fix_bad_utf8_data.sql`

## 4. Cau hinh backend `.env` production

Tao/sua file `backend/.env` tren hosting. Khong commit file `.env` production len GitHub.

Mau production:

```env
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=Asia/Ho_Chi_Minh
APP_URL=https://your-domain.com/backend/public

DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=cpuser_viet_horizon
DB_USERNAME=cpuser_vht_user
DB_PASSWORD=your_strong_db_password
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci

JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
JWT_ISSUER=viet-horizon.travel
JWT_AUDIENCE=viet-horizon.clients
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=2592000

CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
FRONTEND_URL=https://your-domain.com

MAIL_FROM_ADDRESS=no-reply@your-domain.com
MAIL_FROM_NAME=Viet Horizon Travel
MAIL_TRANSPORT=mail
MAIL_SMTP_HOST=localhost
MAIL_SMTP_PORT=25
MAIL_SMTP_USER=
MAIL_SMTP_PASS=
MAIL_SMTP_SECURE=
MAIL_LOG_PREVIEW=false
```

Neu hosting bat buoc SMTP:

```env
MAIL_TRANSPORT=smtp
MAIL_SMTP_HOST=mail.your-domain.com
MAIL_SMTP_PORT=465
MAIL_SMTP_USER=no-reply@your-domain.com
MAIL_SMTP_PASS=your_mail_password
MAIL_SMTP_SECURE=ssl
MAIL_LOG_PREVIEW=false
```

## 5. Cau hinh API base frontend

Project da uu tien doc API base theo thu tu:

1. `window.__VHT_API_BASE__`
2. `localStorage.vh_api_base`
3. Gia tri mac dinh/dev fallback

Cach khuyen nghi tren production la gan `window.__VHT_API_BASE__` truoc khi load `assets/js/main.js`.

Voi `index.html`:

```html
<script>
  window.__VHT_API_BASE__ = "https://your-domain.com/backend/public/api";
</script>
<script type="module" src="assets/js/main.js"></script>
```

Voi cac file trong `pages/`:

```html
<script>
  window.__VHT_API_BASE__ = "https://your-domain.com/backend/public/api";
</script>
<script type="module" src="../assets/js/main.js"></script>
```

Neu khong muon sua tung file HTML, frontend hien tai se tu thu cac duong dan cung domain nhu:

- `https://your-domain.com/backend/public/api`
- `https://your-domain.com/api`

Tuy nhien, cach gan `window.__VHT_API_BASE__` van on dinh nhat khi deploy that.

## 6. Clone/upload code tu GitHub len cPanel

Cach A - Git Version Control trong cPanel:

1. Vao cPanel -> `Git Version Control`.
2. Chon `Create`.
3. Repository URL: `https://github.com/77huanle-eng/dacs.git`.
4. Repository Path: thu muc tam, vi du `/home/cpuser/repositories/dacs`.
5. Sau khi clone, copy noi dung repo vao `public_html`.
6. Dam bao `backend/.env` production da duoc tao rieng tren hosting.

Cach B - File Manager:

1. Tai source zip tu GitHub.
2. Vao cPanel -> `File Manager` -> `public_html`.
3. Upload zip.
4. Extract.
5. Neu zip extract ra thu muc con, move toan bo file/thumuc ben trong ra `public_html`.
6. Tao/sua `backend/.env`.

## 7. Quyen thu muc upload/log

Can dam bao PHP ghi duoc vao:

```text
backend/public/uploads/
backend/storage/logs/
```

Tren cPanel thuong dung permission:

- Folder: `755`
- File: `644`

Neu upload anh loi, thu tam `775` cho `backend/public/uploads` va `backend/storage/logs`, sau do quay lai quyen an toan hon neu hosting cho phep.

## 8. Bat SSL/domain

1. Tro domain ve hosting bang nameserver hoac DNS A record.
2. Vao cPanel -> `SSL/TLS Status` hoac `Let's Encrypt SSL`.
3. Cap SSL cho domain va `www`.
4. Bat redirect HTTP -> HTTPS neu hosting co tuy chon.
5. Cap nhat `.env` dung `https://`.

## 9. Checklist test sau deploy

Test theo thu tu:

1. Mo `https://your-domain.com/`.
2. Mo `https://your-domain.com/backend/public/api/health` phai tra JSON success.
3. Mo DevTools -> Network, dam bao khong con goi `localhost`.
4. Dang nhap bang tai khoan seed user/admin/provider.
5. Trang danh sach tour load du lieu tu API.
6. Tour detail load du lieu, comment/rating hien dung.
7. Wishlist add/remove luu DB that.
8. Booking tao duoc don, payment cap nhat trang thai, invoice xem duoc.
9. Profile update va avatar upload duoc.
10. Admin dashboard load card/chart/list.
11. Admin CRUD tour/bai viet/khuyen mai tao-sua-xoa duoc.
12. Provider dashboard va provider CRUD tour/khuyen mai/dich vu hoat dong.
13. Logout xong khong vao lai duoc trang bao ve.
14. Forgot/reset password hoat dong theo mail config.
15. Kiem tra Console khong co loi JS nghiem trong.
16. Kiem tra Network khong co API 404/500.

## 10. Loi thuong gap va cach sua nhanh

### API 404

Nguyen nhan hay gap:

- Chua upload `backend/public/.htaccess`.
- Hosting chua bat Apache rewrite.
- Sai URL API base.

Cach sua:

- Kiem tra file `backend/public/.htaccess` con ton tai.
- Test truc tiep `https://your-domain.com/backend/public/api/health`.
- Neu van 404, hoi hosting bat `mod_rewrite` hoac cau hinh AllowOverride.

### API 500

Nguyen nhan hay gap:

- Sai `.env`.
- Sai DB credential.
- PHP version qua cu.
- Thieu quyen ghi log/upload.

Cach sua:

- Tam thoi set `APP_DEBUG=true` de xem loi, sua xong doi lai `false`.
- Kiem tra `backend/storage/logs/`.
- Kiem tra PHP version >= 8.1.

### Khong ket noi database

Kiem tra:

- `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` trong `backend/.env`.
- Database da import `schema.sql` chua.
- User DB da duoc gan quyen vao database chua.

### Frontend van goi localhost

Cach sua nhanh trong browser:

```js
localStorage.removeItem("vh_api_base");
```

Sau do them script production vao HTML:

```html
<script>
  window.__VHT_API_BASE__ = "https://your-domain.com/backend/public/api";
</script>
```

### CORS loi

Neu frontend va API cung domain thi thuong khong loi. Neu tach domain/subdomain, sua `.env`:

```env
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com,https://api.your-domain.com
FRONTEND_URL=https://your-domain.com
```

### Upload anh loi

Kiem tra:

- Folder `backend/public/uploads` co quyen ghi.
- PHP `upload_max_filesize` va `post_max_size` du lon.
- File la JPG/PNG/WEBP dung validation hien co.

## 11. Ghi chu production quan trong

- Khong dua `backend/.env` production len GitHub.
- Doi `JWT_SECRET` that dai va ngau nhien.
- Doi password tai khoan seed sau khi deploy.
- Tat `APP_DEBUG=false` sau khi test xong.
- Backup database truoc khi import seed/migration moi.
- Neu deploy lai tu GitHub, can giu lai `backend/.env` va `backend/public/uploads` tren hosting.
