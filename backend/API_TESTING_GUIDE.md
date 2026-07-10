# SRMS Backend API Testing Guide

File nay danh cho nguoi moi backend. Muc tieu la giup ban biet:

- Backend nay gom nhung phan nao.
- Chay backend nhu the nao.
- Test API theo thu tu nao de it bi loi.
- Khi gap loi 400/401/403/404/500 thi hieu sao.

## 1. Backend nay dang dung gi?

Du an backend hien tai dung:

```txt
Express.js  -> tao API server
Prisma      -> lam viec voi database
PostgreSQL  -> database
JWT         -> dang nhap va bao ve API
Swagger     -> giao dien test API tren browser
```

File quan trong:

```txt
src/server.ts                       noi khoi dong server va gan route
src/routes/*.route.ts               noi khai bao duong dan API
src/controllers/*.controller.ts     noi xu ly logic API
src/middlewares/auth.middleware.ts  noi kiem tra token va role
prisma/schema.prisma                cau truc database
prisma/seed.ts                      du lieu mau de test
.env                                cau hinh database, JWT secret
```

## 2. Chay backend

Mo terminal tai thu muc project, chay:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

Neu PowerShell chan `npm`, dung:

```bash
npm.cmd run dev
```

API local:

```txt
http://localhost:5000/api/v1
```

Swagger docs:

```txt
http://localhost:5000/api/v1/docs
```

## 3. Tai khoan seed de test

Mat khau chung:

```txt
Password123@
```

Tai khoan:

```txt
Admin:       admin@srms.com
Recruiter:   recruiter@fpt.com
Candidate:   nguyenvana@gmail.com
Interviewer: interviewer1@srms.com
```

Luu y: `npx prisma db seed` se tao lai du lieu mau. Neu database co cascade delete, profile/job/application/interview cu co the bi mat.

## 4. Cach dung token

Sau khi login, API tra ve `token`.

Voi cac API can dang nhap, them header:

```txt
Authorization: Bearer YOUR_TOKEN_HERE
```

Neu test tren Swagger:

1. Bam nut `Authorize` o goc tren.
2. Nhap:

```txt
Bearer YOUR_TOKEN_HERE
```

3. Bam `Authorize`.
4. Sau do moi bam `Execute` o cac API can dang nhap.

## 5. Flow test de bao phu tinh nang chinh

Hay test theo dung thu tu nay.

### Buoc 1: Kiem tra server

```http
GET /api/v1/health
```

Thanh cong neu tra ve `status: OK`.

### Buoc 2: Login Candidate

```http
POST /api/v1/auth/login
```

Body:

```json
{
  "email": "nguyenvana@gmail.com",
  "password": "Password123@"
}
```

Luu token thanh:

```txt
CANDIDATE_TOKEN
```

### Buoc 3: Tao ho so Candidate

```http
PUT /api/v1/candidate/profile
Authorization: Bearer CANDIDATE_TOKEN
```

Body:

```json
{
  "skills": ["React", "Node.js", "TypeScript"],
  "experience": {
    "years": 2,
    "position": "Frontend Developer"
  },
  "education": {
    "school": "Demo University",
    "major": "Software Engineering"
  },
  "resumeUrl": "https://example.com/resume.pdf"
}
```

Sau do test:

```http
GET /api/v1/candidate/profile
Authorization: Bearer CANDIDATE_TOKEN
```

Neu chua tao profile ma goi GET, API tra ve `404`. Day khong phai loi login.

### Buoc 4: Login Recruiter

```http
POST /api/v1/auth/login
```

Body:

```json
{
  "email": "recruiter@fpt.com",
  "password": "Password123@"
}
```

Luu token thanh:

```txt
RECRUITER_TOKEN
```

### Buoc 5: Recruiter tao job

```http
POST /api/v1/job/create
Authorization: Bearer RECRUITER_TOKEN
```

Body:

```json
{
  "title": "Frontend Developer",
  "description": "Build web UI for SRMS platform",
  "requirements": "React, TypeScript, REST API",
  "salaryRange": "15M - 25M",
  "location": "Ho Chi Minh City",
  "companyName": "FPT Software"
}
```

Luu `job.id` thanh:

```txt
JOB_ID
```

### Buoc 6: Xem danh sach job

```http
GET /api/v1/job
```

API nay khong can token.

### Buoc 7: Candidate nop don ung tuyen

```http
POST /api/v1/application/apply
Authorization: Bearer CANDIDATE_TOKEN
```

Body:

```json
{
  "jobId": "JOB_ID",
  "resumeUrl": "https://example.com/resume.pdf"
}
```

Luu `application.id` thanh:

```txt
APPLICATION_ID
```

### Buoc 8: Recruiter xem don ung tuyen

```http
GET /api/v1/application/recruiter
Authorization: Bearer RECRUITER_TOKEN
```

Dung API nay de copy `application.id` that.

### Buoc 9: Recruiter cap nhat trang thai don

```http
PUT /api/v1/application/update-stage
Authorization: Bearer RECRUITER_TOKEN
```

Body:

```json
{
  "applicationId": "APPLICATION_ID",
  "stage": "INTERVIEW"
}
```

Stage hop le:

```txt
APPLIED
SCREENING
INTERVIEW
OFFER
HIRED
REJECTED
```

Khong dung `REVIEWING` hoac `OFFERED`, vi schema Prisma hien tai khong co 2 stage nay.

### Buoc 10: Recruiter tao lich phong van

```http
POST /api/v1/interview
Authorization: Bearer RECRUITER_TOKEN
```

Body:

```json
{
  "applicationId": "APPLICATION_ID",
  "scheduledAt": "2026-07-15T09:00:00.000Z",
  "locationOrLink": "https://meet.google.com/demo",
  "interviewerName": "Nguyen Van A"
}
```

Luu `interview.id` thanh:

```txt
INTERVIEW_ID
```

Quan trong:

- Phai dung token cua recruiter da tao job.
- `applicationId` phai la id that lay tu `GET /api/v1/application/recruiter`.
- Neu dung token candidate de tao interview se bi `403`.

### Buoc 11: Xem lich phong van

```http
GET /api/v1/interview/application/APPLICATION_ID
Authorization: Bearer RECRUITER_TOKEN
```

### Buoc 12: Cap nhat lich phong van

```http
PUT /api/v1/interview/INTERVIEW_ID
Authorization: Bearer RECRUITER_TOKEN
```

Body:

```json
{
  "scheduledAt": "2026-07-16T10:00:00.000Z",
  "locationOrLink": "Room 301",
  "interviewerName": "Tran Thi B"
}
```

### Buoc 13: Xem dashboard

Candidate:

```http
GET /api/v1/dashboard
Authorization: Bearer CANDIDATE_TOKEN
```

Recruiter:

```http
GET /api/v1/dashboard
Authorization: Bearer RECRUITER_TOKEN
```

### Buoc 14: Test quyen Admin

Login admin:

```http
POST /api/v1/auth/login
```

Body:

```json
{
  "email": "admin@srms.com",
  "password": "Password123@"
}
```

Dung token admin goi:

```http
GET /api/v1/auth/admin-only
Authorization: Bearer ADMIN_TOKEN
```

## 6. Loi thuong gap

### 400 Bad Request

Thuong la gui thieu body hoac sai field.

Vi du tao interview ma thieu:

```txt
applicationId
scheduledAt
locationOrLink
interviewerName
```

### 401 Unauthorized

Thuong la:

- Chua login.
- Quen header Authorization.
- Token sai format.

Dung format:

```txt
Authorization: Bearer TOKEN
```

### 403 Forbidden

Ban da login, nhung khong co quyen.

Vi du:

- Candidate tao interview.
- Recruiter A sua don ung tuyen cua Recruiter B.

### 404 Not Found

Khong tim thay du lieu.

Vi du:

- Candidate chua co profile ma goi GET profile.
- Dung sai `jobId`.
- Dung sai `applicationId`.
- Dung sai `interviewId`.

### 500 Internal Server Error

Day moi la loi backend that su.

Can xem terminal dang chay `npm run dev` de biet stack trace.

## 7. Khi sua code backend can nho

Sau khi sua route/controller:

```txt
Restart server
Refresh Swagger
Test lai flow lien quan
```

Sau khi sua `prisma/schema.prisma`:

```bash
npx prisma generate
npx prisma db push
```

Neu can du lieu mau:

```bash
npx prisma db seed
```

## 8. Git workflow de de kiem soat

Moi task nen lam tren mot nhanh rieng:

```bash
git switch staging
git switch -c ten-nhanh-moi
```

Khi lam xong:

```bash
git status
git add FILE_CAN_COMMIT
git commit -m "Mo ta ngan gon"
git push -u origin ten-nhanh-moi
```

Khong nen commit `.env`.

## 9. Tom tat ngan nhat

Neu ban chi muon nho flow test:

```txt
Health
-> Login candidate
-> Tao candidate profile
-> Login recruiter
-> Tao job
-> Candidate apply job
-> Recruiter xem application
-> Recruiter update stage
-> Recruiter tao interview
-> Xem dashboard
```

