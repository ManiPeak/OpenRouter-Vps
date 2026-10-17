# راهنمای فارسی استقرار امن 9Router روی Railway

> این راهنما برای نسخهٔ توزیعی [`ManiPeak/OpenRouter-Vps`](https://github.com/ManiPeak/OpenRouter-Vps) نوشته شده است. سورس آن از نسخهٔ رسمی [`decolua/9router`](https://github.com/decolua/9router) در `v0.5.104` (کامیت `87a74e1bda3677193c6f71a7e2100c90311f0689`) ممیزی و آماده شده است. تاریخ بازبینی: ۱۷ اکتبر ۲۰۲۶.
>
> **جریان صحیح نصب:** ابتدا `ManiPeak/OpenRouter-Vps` را در حساب GitHub خودتان Fork کنید؛ سپس Fork شخصی و شاخهٔ `main` همان Fork را به Railway وصل کنید. Railway را مستقیماً به Repository اصلی `ManiPeak` وصل نکنید، مگر اینکه مالک همان Repository باشید.
>
> تاریخچهٔ انتشار به‌صورت snapshot امن نگه‌داری می‌شود، چون بعضی کامیت‌های قدیمی upstream شامل OAuth credential عمومی بودند و GitHub Push Protection انتشار آن تاریخچه را مسدود می‌کند. سورس کامل، `LICENSE` و attribution حفظ شده‌اند؛ کنترل امنیتی GitHub را غیرفعال یا bypass نکنید.
>
> همهٔ عبارت‌هایی مانند `YOUR_GITHUB_USER`، `YOUR_RAILWAY_DOMAIN` و `YOUR_9ROUTER_KEY` **جای‌نگهدار** هستند. آن‌ها را با مقدار واقعی خودتان عوض کنید و هیچ کلید یا رمز واقعی را در Git، Issue، اسکرین‌شات عمومی یا لاگ قرار ندهید.

## فهرست

- [9Router چیست و چه فرقی با OpenRouter دارد؟](#9router-چیست-و-چه-فرقی-با-openrouter-دارد)
- [پیش‌نیازها و هزینه‌ها](#پیشنیازها-و-هزینهها)
- [مرحلهٔ ۱: Fork کردن مخزن و بررسی main](#مرحلهٔ-۱-fork-کردن-مخزن-و-بررسی-main)
- [مرحلهٔ ۲: ایجاد سرویس GitHub-connected در Railway](#مرحلهٔ-۲-ایجاد-سرویس-github-connected-در-railway)
- [مرحلهٔ ۳: Volume و متغیرهای امن](#مرحلهٔ-۳-volume-و-متغیرهای-امن)
- [مرحلهٔ ۴: Domain، Health Check و اولین ورود](#مرحلهٔ-۴-domain-health-check-و-اولین-ورود)
- [مرحلهٔ ۵: افزودن Provider](#مرحلهٔ-۵-افزودن-provider)
- [مرحلهٔ ۶: ساخت کلید 9Router و استفاده از API](#مرحلهٔ-۶-ساخت-کلید-9router-و-استفاده-از-api)
- [بررسی لاگ، اتصال GitHub و ماندگاری داده](#بررسی-لاگ-اتصال-github-و-ماندگاری-داده)
- [Auto-deploy و به‌روزرسانی امن Fork](#auto-deploy-و-بهروزرسانی-امن-fork)
- [Backup و Restore](#backup-و-restore)
- [امنیت و چرخش Secretها](#امنیت-و-چرخش-secretها)
- [رفع اشکال](#رفع-اشکال)
- [Rollback](#rollback)
- [چک‌لیست نهایی](#چکلیست-نهایی)

## 9Router چیست و چه فرقی با OpenRouter دارد؟

**9Router** یک دروازهٔ self-hosted و داشبورد مدیریت است. برنامه یا ابزار شما به API سازگار با OpenAI در 9Router درخواست می‌دهد و 9Router آن را به حساب Provider انتخاب‌شده می‌فرستد، فرمت‌ها را تبدیل می‌کند، مصرف را ثبت می‌کند و در صورت تنظیم، fallback انجام می‌دهد.

**OpenRouter** یک سرویس ثالث و تجمیع‌کنندهٔ مدل است. OpenRouter می‌تواند فقط **یکی از Providerهای بالادستی** 9Router باشد.

بنابراین چهار نوع اعتبارنامه را با هم اشتباه نگیرید:

1. حساب GitHub و Railway برای استقرار؛
2. رمز داشبورد 9Router برای ورود مدیر؛
3. کلید API ساخته‌شده در خود 9Router برای کلاینت شما؛
4. کلید یا OAuth مربوط به Provider بالادستی، مانند OpenAI یا OpenRouter.

Railway فقط برنامهٔ 9Router را اجرا می‌کند؛ مدل هوش مصنوعی یا اعتبار رایگان Provider را فراهم نمی‌کند.

## پیش‌نیازها و هزینه‌ها

- یک حساب GitHub که بتواند Repository عمومی `ManiPeak/OpenRouter-Vps` را به حساب یا Organization تحت کنترل شما Fork کند؛
- حساب Railway با امکان اتصال GitHub و ساخت Project، Service و Volume؛
- در صورت نیاز، حساب و کلید Provider؛
- `git` و ترجیحاً [GitHub CLI (`gh`)](https://cli.github.com/) برای بررسی دقیق شاخه‌ها؛
- `openssl` برای تولید Secretهای قوی.

هزینه‌ها ممکن است از سه محل ایجاد شوند:

- مصرف CPU، RAM، شبکه و Volume در Railway؛
- درخواست‌های مدل در Provider؛
- امکانات پولی یا نگه‌داری Backup در سرویس‌های مربوط.

قیمت‌ها را از صفحهٔ Billing هر سرویس ببینید؛ این راهنما قیمت ثابتی فرض نمی‌کند. آزمایش `/api/health`، ورود به داشبورد و معمولاً فهرست مدل‌ها هزینهٔ مدل ایجاد نمی‌کند، اما درخواست chat ممکن است پولی باشد. بدون مجوز و اعتبار کافی درخواست آزمایشی پولی نفرستید.

## مرحلهٔ ۱: Fork کردن مخزن و بررسی `main`

منبع توزیع این است:

```text
https://github.com/ManiPeak/OpenRouter-Vps
```

### ۱.۱ ساخت Fork شخصی

روش ساده در رابط GitHub:

1. لینک بالا را باز کنید و **Fork** را بزنید.
2. Owner را حساب یا Organization خودتان انتخاب کنید.
3. نام Repository را `OpenRouter-Vps` نگه دارید؛ در صورت نیاز نام دیگری انتخاب کنید و همان نام را در مراحل بعد جایگزین کنید.
4. ساخت Fork را تأیید کنید و منتظر بمانید تا GitHub شاخهٔ `main` را کپی کند.
5. URL نهایی باید شبیه این باشد:

   ```text
   https://github.com/YOUR_GITHUB_USER/OpenRouter-Vps
   ```

روش معادل با GitHub CLI:

```bash
gh repo fork ManiPeak/OpenRouter-Vps --clone --remote
cd OpenRouter-Vps
```

اگر قبلاً Fork ساخته‌اید، فقط Fork خودتان را clone کنید:

```bash
git clone https://github.com/YOUR_GITHUB_USER/OpenRouter-Vps.git
cd OpenRouter-Vps
git remote add distribution https://github.com/ManiPeak/OpenRouter-Vps.git 2>/dev/null || true
```

### ۱.۲ بررسی Fork، شاخه و فایل‌های کامل

```bash
git switch main
git pull --ff-only origin main

gh repo view YOUR_GITHUB_USER/OpenRouter-Vps \
  --json url,isFork,defaultBranchRef,parent,viewerPermission

# فایل‌های ضروری snapshot توزیعی
test -f Dockerfile
test -f package.json
test -f LICENSE
test -f INSTALL_FA.md
git rev-parse HEAD
git remote -v
```

خروجی مورد انتظار:

- `url` به Fork شخصی شما اشاره کند؛
- `defaultBranchRef.name` برابر `main` باشد؛
- `isFork` برابر `true` و `parent` برابر `ManiPeak/OpenRouter-Vps` باشد؛
- `viewerPermission` برای Fork خودتان `ADMIN` باشد؛
- فایل‌های `Dockerfile`، `package.json`، `LICENSE` و `INSTALL_FA.md` در ریشه موجود باشند.

اگر Default Branch در Fork شما اشتباه بود:

```bash
gh repo edit YOUR_GITHUB_USER/OpenRouter-Vps --default-branch main
```

`LICENSE` و attribution را حذف نکنید. از `git push --force` استفاده نکنید و کنترل GitHub Push Protection را خاموش نکنید. برای تغییرات خودتان branch و Pull Request بسازید.

## مرحلهٔ ۲: ایجاد سرویس GitHub-connected در Railway

> از Template عمومی که فقط image آمادهٔ `decolua/9router:latest` را اجرا می‌کند استفاده نکنید. Railway باید مستقیماً به **Fork شخصی شما** (`YOUR_GITHUB_USER/OpenRouter-Vps`) و شاخهٔ `main` وصل باشد.

1. وارد Dashboard Railway شوید و **New Project** را انتخاب کنید.
2. گزینهٔ استقرار از **GitHub Repository** را بزنید.
3. اگر خواسته شد، Railway GitHub App را فقط برای Repository موردنیاز یا مجموعهٔ مورد اعتماد مجاز کنید.
4. Repository زیر را انتخاب کنید:

   ```text
   YOUR_GITHUB_USER/OpenRouter-Vps
   ```

5. پس از ساخته‌شدن Service، وارد **Service Settings** شوید.
6. در بخش **Source** بررسی کنید:
   - Repository دقیقاً `YOUR_GITHUB_USER/OpenRouter-Vps` (Fork شخصی شما) است؛
   - Branch یا Trigger Branch برابر `main` است؛
   - اتصال GitHub فعال است؛
   - Auto-deploy برای تغییرات `main` روشن است، مگر اینکه عمداً آن را برای تعمیر موقت متوقف کرده باشید.
7. Root Directory را خالی یا `/` نگه دارید. `Dockerfile` در ریشهٔ Repository قرار دارد و Railway باید آن را خودکار تشخیص دهد.

فایل `railway.toml` یا `railway.json` قدیمی اضافه نکنید. برای سرویس‌های جدید، تنظیم Build، Health Check، Volume و Domain را در Dashboard Railway انجام دهید.

### بررسی Build

در Deployment، تب **Build Logs** را باز کنید. باید مشخص باشد که Dockerfile ریشه استفاده شده است و مراحل نصب، `npm run build` و ساخت image موفق بوده‌اند. خطا را صرفاً با تغییر Builder به یک image نامرتبط دور نزنید.

`Dockerfile` برنامه به‌طور پیش‌فرض این موارد را دارد:

- پورت داخلی `20128`؛
- گوش‌دادن روی `0.0.0.0`؛
- `DATA_DIR=/app/data`؛
- اجرای کاربر غیر root پس از آماده‌سازی دسترسی Volume.

Railway متغیر `PORT` را هنگام اجرا تزریق می‌کند؛ معمولاً **نباید** آن را دستی ثابت کنید.

## مرحلهٔ ۳: Volume و متغیرهای امن

### ۳.۱ ساخت Volume

1. در Project یک Volume بسازید و آن را به Service 9Router متصل کنید.
2. **Mount Path** را دقیقاً برابر زیر قرار دهید:

   ```text
   /app/data
   ```

3. فقط یک replica از سرویس اجرا کنید. SQLite روی یک Volume مشترک برای scale افقی چند replica طراحی نشده است.

Database، machine ID، Secret داخلی JWT در صورت عدم تنظیم متغیر، Providerها، تنظیمات و کلیدهای 9Router زیر `/app/data` قرار می‌گیرند. Mount روی مسیر دیگری باعث از دست رفتن ظاهری تنظیمات بعد از Redeploy می‌شود.

### ۳.۲ تولید Secret

برای هر مورد یک مقدار **جداگانه** تولید کنید؛ مقدارها را دوباره استفاده نکنید:

```bash
# برای JWT_SECRET، API_KEY_SECRET و MACHINE_ID_SALT؛ هر بار جدا اجرا کنید
openssl rand -hex 32

# برای رمز اولیهٔ داشبورد
openssl rand -base64 24
```

خروجی را مستقیماً در Railway Variables وارد کنید. آن را در `.env` قابل commit، README، چت یا لاگ قرار ندهید.

### ۳.۳ متغیرهای لازم/پیشنهادی

در **Service → Variables** این مقادیر را تنظیم کنید:

| نام | مقدار | دلیل |
|---|---|---|
| `INITIAL_PASSWORD` | رمز قوی و یکتا | اولین ورود از راه دور؛ مقدار پیش‌فرض ضعیف قابل قبول نیست |
| `JWT_SECRET` | خروجی مستقل `openssl rand -hex 32` | امضای Session داشبورد و پایداری آن بین Deployها |
| `API_KEY_SECRET` | خروجی مستقل `openssl rand -hex 32` | HMAC کلیدهای ساخته‌شده توسط 9Router |
| `MACHINE_ID_SALT` | خروجی مستقل `openssl rand -hex 32` | Salt شناسهٔ پایدار ماشین |
| `AUTH_COOKIE_SECURE` | `true` | ارسال Cookie ورود فقط روی HTTPS |
| `TRUST_PROXY` | `true` | تشخیص IP واقعی برای محدودکنندهٔ Login پشت Proxy مورد اعتماد Railway |

این موارد در Dockerfile موجودند و معمولاً لازم نیست در Variables تکرار شوند:

- `DATA_DIR=/app/data`
- `HOSTNAME=0.0.0.0`
- `NODE_ENV=production`
- `PORT`؛ Railway آن را تزریق می‌کند.

متغیرهای اختیاری مرتبط با حریم خصوصی:

| نام | مقدار پیشنهادی اولیه | توضیح |
|---|---|---|
| `ENABLE_REQUEST_LOGS` | `false` | ذخیرهٔ Request/Response log را غیرفعال می‌کند |
| `OBSERVABILITY_ENABLED` | `false` | ذخیرهٔ جزئیات Prompt/Response در Database را غیرفعال می‌کند؛ اگر عمداً به جزئیات Usage نیاز دارید، پس از بررسی سیاست حریم خصوصی فعال کنید |

فقط اگر می‌خواهید OAuth مربوط به Antigravity یا Gemini CLI را استفاده کنید، client متعلق به Google Cloud Project خودتان را بسازید و این متغیرها را در Railway قرار دهید:

| نام | کاربرد |
|---|---|
| `ANTIGRAVITY_OAUTH_CLIENT_ID` و `ANTIGRAVITY_OAUTH_CLIENT_SECRET` | OAuth مربوط به Antigravity |
| `GOOGLE_OAUTH_CLIENT_ID` و `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth مربوط به Gemini CLI |

این چهار متغیر برای Gemini با API Key و سایر Providerها لازم نیستند. Repository هیچ Google OAuth secret پیش‌فرضی منتشر نمی‌کند؛ credential یک برنامهٔ ثالث را کپی نکنید. Secretهای client خودتان را فقط در Railway Variables نگه دارید و در Git commit نکنید.

`BASE_URL` فقط برای قابلیت‌هایی مانند SSO که URL بازگشت ثابت لازم دارند ضروری است. در آن صورت پس از ساخت Domain مقدار کامل HTTPS را وارد کنید، برای نمونه:

```text
BASE_URL=https://YOUR_RAILWAY_DOMAIN
```

Secretهای Provider را به‌عنوان Environment Variable عمومی پروژه اضافه نکنید؛ آن‌ها را از بخش **Providers** خود 9Router وارد کنید، مگر اینکه سورس مشخصاً متغیر خاصی را برای Provider موردنظر مستند کرده باشد.

## مرحلهٔ ۴: Domain، Health Check و اولین ورود

### ۴.۱ Health Check

در **Service Settings → Deploy**، مسیر Health Check را این‌گونه تنظیم کنید:

```text
/api/health
```

Railway هنگام Deploy باید پاسخ `2xx` دریافت کند. Timeout معقول، مثلاً ۳۰ تا ۶۰ ثانیه، برای اولین startup انتخاب کنید.

### ۴.۲ Domain عمومی

در **Service Settings → Networking → Public Networking** گزینهٔ **Generate Domain** را بزنید. Railway گواهی HTTPS را مدیریت می‌کند. Domain را یادداشت کنید:

```text
https://YOUR_RAILWAY_DOMAIN
```

نیازی به فعال‌کردن Cloudflare Tunnel داخلی 9Router برای Domain Railway ندارید.

### ۴.۳ تست بدون هزینه

```bash
curl -i https://YOUR_RAILWAY_DOMAIN/api/health
```

باید status برابر `200` باشد. سپس آدرس زیر را باز کنید:

```text
https://YOUR_RAILWAY_DOMAIN/login
```

با مقدار `INITIAL_PASSWORD` وارد شوید. بلافاصله:

1. به **Settings → Security** بروید.
2. **Require login** را روشن نگه دارید.
3. با **Update Password** رمز داشبورد را به یک رمز قوی دیگر تغییر دهید.
4. از مرورگر دیگری بررسی کنید که Dashboard بدون Login باز نمی‌شود.

رمز جدید به‌صورت hash در SQLite روی Volume ذخیره می‌شود و بر `INITIAL_PASSWORD` اولویت دارد. پس از اطمینان از Backup و ورود با رمز جدید، می‌توانید مقدار `INITIAL_PASSWORD` را با یک مقدار اضطراری قویِ تازه جایگزین کنید؛ حذف عجولانهٔ آن پیش از اطمینان از وضعیت Database توصیه نمی‌شود.

## مرحلهٔ ۵: افزودن Provider

1. در Sidebar روی **Providers** بزنید.
2. Provider موردنظر را انتخاب کنید.
3. بسته به Provider یکی از روش‌های API Key یا OAuth را کامل کنید.
4. نام حساب را واضح انتخاب کنید و Connection را فعال نگه دارید.
5. در صورت وجود دکمهٔ Test، اتصال و مدل را آزمایش کنید.

برای API سازگار با OpenAI که در فهرست آماده نیست:

1. در **Providers**، بخش **Custom Providers (OpenAI/Anthropic Compatible)** را پیدا کنید.
2. **Add OpenAI Compatible** را بزنید.
3. Name، Prefix یکتا، نوع `Chat Completions` یا `Responses API` و Base URL رسمی Provider را وارد کنید.
4. سپس API Key حساب را در Connection همان Provider اضافه کنید.

نکات مهم:

- کلید Provider فقط برای ارتباط 9Router با Provider است؛ آن را به کلاینت ندهید.
- بعضی Providerها پولی یا دارای سقف مصرف‌اند. Billing و quota را در خود Provider کنترل کنید.
- OAuth یا روش‌های غیررسمی ممکن است محدودیت Terms of Service داشته باشند؛ مستندات و شرایط Provider را بررسی کنید.
- برای Antigravity یا Gemini CLI OAuth باید متغیرهای client متعلق به خودتان را مطابق مرحلهٔ ۳ در Railway تنظیم و Redeploy کنید؛ credential پیش‌فرضی در سورس وجود ندارد.
- اگر فقط OpenRouter می‌خواهید، کارت **OpenRouter** را در Providers انتخاب کنید و کلید OpenRouter را همان‌جا وارد کنید. این کار 9Router را به OpenRouter تبدیل نمی‌کند؛ OpenRouter یک upstream آن است.

## مرحلهٔ ۶: ساخت کلید 9Router و استفاده از API

1. در Sidebar به **Endpoint & Key** بروید.
2. در کارت **API Keys**، گزینهٔ **Require API key** را روشن کنید.
3. روی **Create Key** بزنید و یک نام مانند `laptop-main` وارد کنید.
4. کلید را در Password Manager ذخیره کنید.
5. برای کمترین دسترسی، محدودیت Provider/Model همان کلید را در UI تنظیم کنید؛ برای هر دستگاه یا برنامه کلید جدا بسازید.

Base URL سازگار با OpenAI:

```text
https://YOUR_RAILWAY_DOMAIN/v1
```

ابتدا مدل‌های قابل مشاهده را بدون درخواست inference بررسی کنید:

```bash
curl --fail-with-body \
  https://YOUR_RAILWAY_DOMAIN/v1/models \
  -H "Authorization: Bearer YOUR_9ROUTER_KEY"
```

نام دقیق model را از همین خروجی یا Dashboard بردارید. قالب معمول آن `PROVIDER_PREFIX/MODEL_ID` است؛ برای مثال، فقط در صورت پیکربندی OpenAI، ممکن است `openai/gpt-4o-mini` باشد.

### نمونهٔ curl

```bash
curl --fail-with-body \
  https://YOUR_RAILWAY_DOMAIN/v1/chat/completions \
  -H "Authorization: Bearer YOUR_9ROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "PROVIDER_PREFIX/MODEL_ID",
    "messages": [
      {"role": "user", "content": "سلام؛ فقط کلمه OK را پاسخ بده."}
    ],
    "stream": false
  }'
```

این درخواست می‌تواند هزینهٔ Provider ایجاد کند. ابتدا یک مدل رایگان/محلیِ مجاز انتخاب کنید یا تأیید هزینه بگیرید.

### نمونهٔ Python با OpenAI SDK

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://YOUR_RAILWAY_DOMAIN/v1",
    api_key="YOUR_9ROUTER_KEY",
)

response = client.chat.completions.create(
    model="PROVIDER_PREFIX/MODEL_ID",
    messages=[{"role": "user", "content": "Reply with OK only."}],
)
print(response.choices[0].message.content)
```

بهتر است کلید را از Environment Variable بخوانید، نه اینکه در فایل کد بنویسید:

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url=os.environ["NINEROUTER_BASE_URL"],
    api_key=os.environ["NINEROUTER_API_KEY"],
)
```

### نمونهٔ JavaScript

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.NINEROUTER_BASE_URL,
  apiKey: process.env.NINEROUTER_API_KEY,
});

const response = await client.chat.completions.create({
  model: "PROVIDER_PREFIX/MODEL_ID",
  messages: [{ role: "user", content: "Reply with OK only." }],
});

console.log(response.choices[0].message.content);
```

## بررسی لاگ، اتصال GitHub و ماندگاری داده

### Build و Runtime Logs

در Railway، Build Logs و Deploy Logs را بررسی کنید. نشانه‌های سالم شامل موارد زیر است:

- Build با Dockerfile ریشه انجام شده است؛
- برنامه روی `0.0.0.0` و پورت تزریق‌شده Railway آماده است؛
- لاگ Database مسیر زیر را نشان می‌دهد:

  ```text
  /app/data/db/data.sqlite
  ```

- Health Check برابر `200` است؛
- restart loop، خطای permission و خطای مداوم SQLite وجود ندارد.

Secret یا متن Prompt را در گزارش عمومی کپی نکنید. پیش از اشتراک‌گذاری لاگ آن را sanitize کنید.

### مدرک اتصال به Repository و Commit

1. در **Service Settings → Source** از Repository و Branch یادداشت یا اسکرین‌شات خصوصی بگیرید؛ باید Fork خودتان (`YOUR_GITHUB_USER/OpenRouter-Vps`) و `main` باشد، نه Repository اصلی `ManiPeak`.
2. SHA شاخهٔ Fork خودتان را بگیرید:

   ```bash
   git switch main
   git pull --ff-only origin main
   git rev-parse HEAD
   ```

3. در جزئیات Deployment Railway، Commit SHA باید با SHA بالا یکسان باشد.
4. در GitHub بررسی کنید `main` شاخهٔ پیش‌فرض Fork شما است و بالای صفحه عبارت forked from `ManiPeak/OpenRouter-Vps` دیده می‌شود.

### تست واقعی ماندگاری و Redeploy

1. در **Endpoint & Key** یک کلید با نام `persistence-check` بسازید.
2. در صورت امکان یک Provider آزمایشی بدون هزینه تنظیم کنید.
3. از **Settings → Download Backup** یک Backup امن بگیرید.
4. در Railway روی Deployment جاری **Redeploy** بزنید یا یک commit مستنداتی کوچک را به `main` merge کنید.
5. بعد از سالم‌شدن Health Check دوباره Login کنید.
6. بررسی کنید:
   - رمز تغییرکرده هنوز معتبر است؛
   - کلید `persistence-check` هنوز وجود دارد؛
   - Provider و تنظیمات باقی مانده‌اند؛
   - `/v1/models` با همان کلید پاسخ معتبر می‌دهد.

اگر داده ناپدید شد، قبل از افزودن مجدد اطلاعات، Mount Path و لاگ مسیر Database را اصلاح کنید.

## Auto-deploy و به‌روزرسانی امن Fork

### Auto-deploy

در Source Settings، Branch را `main` نگه دارید و Auto-deploy را روشن کنید. در صورت پشتیبانی حساب، گزینهٔ صبر برای CI را فعال کنید تا Deploy فقط پس از موفقیت Checkها آغاز شود.

هر merge به `main` در Fork شما می‌تواند Build و مصرف Railway ایجاد کند. تغییرات آزمایشی را ابتدا در یک branch و Pull Request انجام دهید؛ تغییر مستقیم `main` را به حداقل برسانید.

### دریافت نسخهٔ جدید از مخزن توزیع

منبع Update برای نصب‌کننده‌ها `ManiPeak/OpenRouter-Vps` است. مستقیماً `decolua/9router` را داخل Fork خود merge نکنید؛ نسخهٔ توزیعی علاوه بر سورس ممیزی‌شده، اصلاحات امنیتی و راهنمای Railway را دارد و تاریخچهٔ upstream نیز ممکن است دوباره GitHub Push Protection را فعال کند.

قبل از Update:

1. Backup داخلی 9Router را دانلود و خارج از Git نگه دارید.
2. وضعیت Deployment سالم و SHA فعلی را ثبت کنید.
3. Auto-deploy را در نظر بگیرید؛ merge نهایی به `main` فوراً Build جدید می‌سازد.
4. Update را در branch جدا تست کنید.

```bash
git clone https://github.com/YOUR_GITHUB_USER/OpenRouter-Vps.git
cd OpenRouter-Vps

git remote add distribution https://github.com/ManiPeak/OpenRouter-Vps.git 2>/dev/null || true
git fetch origin distribution --prune
git switch main
git pull --ff-only origin main

git switch -c sync-distribution-YYYYMMDD
git merge --no-ff distribution/main

# تعارض‌ها را با دقت حل کنید و سپس حداقل Build را اجرا کنید.
git status
npm install
npm run build

git push -u origin sync-distribution-YYYYMMDD
```

تست‌های مشخص‌شده در workflowهای `.github/workflows` نسخهٔ فعلی را نیز اجرا یا منتظر نتیجهٔ CI بمانید؛ شکست تست را نادیده نگیرید. سپس در **Fork خودتان** یک Pull Request از `sync-distribution-YYYYMMDD` به `main` بسازید، تغییرات را review کنید و فقط پس از موفقیت تست‌ها merge کنید. از `git push --force` استفاده نکنید.

گزینهٔ **Sync fork** در رابط GitHub نیز ممکن است موجود باشد، اما چون می‌تواند `main` را مستقیم جلو ببرد و Auto-deploy را شروع کند، روش branch و Pull Request بالا برای production امن‌تر است.

بعد از Deploy، Health، Login، API key، Provider و persistence را دوباره بررسی کنید. اگر نسخهٔ جدید migration Database دارد، Backup قبل از Update برای Rollback ضروری است.

## Backup و Restore

### روش پیشنهادی: Backup داخلی 9Router

1. وارد Dashboard شوید.
2. به **Settings** بروید.
3. در کارت اول روی **Download Backup** بزنید.
4. رمز داشبورد را در پنجرهٔ **Confirm Password** وارد کنید.
5. فایل JSON را در فضای رمزگذاری‌شده و خارج از Git نگه دارید.

Backup ممکن است شامل تنظیمات حساس، کلیدهای 9Router و اعتبارنامه‌های Provider باشد؛ آن را مانند Secret اصلی محافظت کنید.

برای Restore:

1. از وضعیت فعلی یک Backup دیگر بگیرید.
2. در **Settings** روی **Import Backup** بزنید.
3. فایل معتبر را انتخاب و رمز را تأیید کنید.
4. پس از موفقیت، Health، Login، Providerها و یک درخواست بدون هزینه را بررسی کنید.
5. یک Redeploy انجام دهید و ماندگاری را دوباره تأیید کنید.

### Snapshot یا کپی Volume

قابلیت Backup/Snapshot Volume به Plan و امکانات فعلی Railway بستگی دارد. اگر از ابزار فایل Volume یا Snapshot استفاده می‌کنید، هنگام کپی مستقیم SQLite سرویس را متوقف کنید تا Database و فایل‌های WAL در وضعیت سازگار باشند. برای کاربران مبتدی، Export داخلی 9Router امن‌تر از کپی زندهٔ `data.sqlite` است.

هیچ‌گاه Backup production را در Repository commit نکنید.

## امنیت و چرخش Secretها

- Dashboard باید همیشه Login اجباری و رمز قوی داشته باشد.
- `AUTH_COOKIE_SECURE=true` را در HTTPS نگه دارید.
- **Require API key** را در **Endpoint & Key** روشن نگه دارید.
- برای هر کلاینت کلید 9Router جدا بسازید و کلید گم‌شده را Delete/Disable کنید.
- Provider key را فقط در Dashboard وارد کنید؛ در برنامهٔ کلاینت از کلید 9Router استفاده کنید.
- دسترسی Repository، Railway Project و Backupها را به کمترین افراد محدود کنید.
- برای Promptهای حساس، `ENABLE_REQUEST_LOGS=false` و `OBSERVABILITY_ENABLED=false` را نگه دارید یا retention را آگاهانه تنظیم کنید.
- لاگ و Backup را قبل از اشتراک‌گذاری sanitize کنید.

### ترتیب پیشنهادی Rotation

1. **Dashboard password:** از **Settings → Security → Update Password** تغییر دهید و Login جدید را آزمایش کنید.
2. **کلید 9Router:** کلید جدید بسازید، کلاینت‌ها را منتقل کنید، سپس کلید قدیمی را Disable/Delete کنید.
3. **Provider key:** در Provider کلید جدید صادر کنید، Connection را Update/Test کنید، سپس کلید قدیمی را در سایت Provider لغو کنید.
4. **JWT_SECRET:** مقدار Railway را عوض و Redeploy کنید؛ همهٔ Sessionها خارج می‌شوند و باید دوباره Login کنند.
5. **API_KEY_SECRET:** ابتدا Backup بگیرید. پس از تغییر، کلیدهای 9Router جدید بسازید و همهٔ کلاینت‌ها را آزمایش کنید؛ قالب و HMAC کلیدهای جدید به این Secret وابسته است.
6. **MACHINE_ID_SALT:** فقط با برنامهٔ مهاجرت و Backup تغییر دهید؛ تغییر آن می‌تواند شناسهٔ ماشین و کلیدهای وابسته را تغییر دهد.

Secretهای Railway را هرگز با مقدار قبلی در commit «همگام» نکنید. Rotation باید همراه Redeploy، Smoke Test و ثبت زمان باشد.

## رفع اشکال

### Build شکست می‌خورد

- در Build Logs تأیید کنید Railway از `Dockerfile` ریشه استفاده می‌کند.
- Root Directory را خالی یا `/` بگذارید.
- خطای شبکهٔ موقت npm یا font را یک بار Retry کنید؛ workaround آزمایشی را وارد production نکنید.
- upstream lockfile متعهدشده ندارد؛ تغییر نسخهٔ dependency ممکن است Build آینده را متفاوت کند. SHA و زمان Build را ثبت کنید.

### Health Check، 502 یا 503

```bash
curl -i https://YOUR_RAILWAY_DOMAIN/api/health
```

- Health Check path باید `/api/health` باشد.
- `PORT` را به پورت دیگری hard-code نکنید.
- برنامه باید روی `0.0.0.0` گوش کند؛ Dockerfile رسمی این کار را انجام می‌دهد.
- Deploy Logs را برای crash، permission و SQLite بررسی کنید.

### ورود به Dashboard ممکن نیست

- از `INITIAL_PASSWORD` فعلی Railway فقط برای Database بدون رمز ذخیره‌شده استفاده می‌شود.
- اگر قبلاً **Update Password** انجام شده، رمز ذخیره‌شده روی Volume اولویت دارد.
- `AUTH_COOKIE_SECURE=true` نیازمند HTTPS است؛ از Domain HTTPS Railway استفاده کنید.
- پس از چند رمز اشتباه، Login limiter موقتاً قفل می‌کند؛ تا پایان زمان اعلام‌شده صبر کنید.
- حذف Volume برای بازیابی رمز، همهٔ داده‌ها را از بین می‌برد؛ ابتدا از Backup/Restore استفاده کنید.

### API پاسخ `401` می‌دهد

- Header باید دقیقاً `Authorization: Bearer YOUR_9ROUTER_KEY` باشد.
- از کلید Provider به جای کلید ساخته‌شده در **Endpoint & Key** استفاده نکنید.
- کلید باید Active باشد و دسترسی آن Model/Provider را مجاز کند.

### پاسخ `404` یا «provider/model پیدا نشد»

- Connection Provider را Active کنید.
- نام دقیق model را از `/v1/models` بگیرید.
- Prefix را حذف یا حدس نزنید؛ از `PROVIDER_PREFIX/MODEL_ID` نمایش‌داده‌شده استفاده کنید.

### پاسخ `429` یا `503`

- `429` معمولاً quota/rate limit بالادستی است.
- 9Router ممکن است حساب را برای زمان کوتاه cooldown کند و اگر fallback دیگری نباشد `503` برگرداند.
- Billing، quota و وضعیت Provider را بررسی کنید؛ با Retry سریع و بی‌نهایت هزینه/فشار ایجاد نکنید.

### داده بعد از Redeploy ناپدید شده است

- Volume باید به همان Service و دقیقاً `/app/data` mount باشد.
- Deploy Logs باید Database را در `/app/data/db/data.sqlite` نشان دهد.
- بیش از یک replica اجرا نکنید.
- قبل از هر اقدام تخریبی، Restore از Backup را بررسی کنید.

### اتصال GitHub یا Auto-deploy کار نمی‌کند

- در Railway Source باید Repository دقیق Fork خودتان (`YOUR_GITHUB_USER/OpenRouter-Vps`) و Branch دقیق `main` باشد، نه مخزن اصلی `ManiPeak`.
- دسترسی Railway GitHub App به Fork شخصی خودتان را بررسی کنید.
- SHA Deployment را با `git rev-parse HEAD` مقایسه کنید.
- اگر Repository rename یا منتقل شده، Source را دوباره وصل کنید؛ صرفاً Deploy دستی image انجام ندهید.

## Rollback

Rollback برنامه و Rollback داده دو موضوع جدا هستند.

### Rollback کد

روش قابل ردیابی در Git:

```bash
git switch main
git pull --ff-only origin main
git revert BAD_COMMIT_SHA
git push origin main
```

این کار تاریخچه را حفظ می‌کند و Auto-deploy یک نسخهٔ اصلاحی می‌سازد. force-push نکنید.

در Railway نیز می‌توانید از Deployment History نسخهٔ موفق قبلی را Redeploy/Rollback کنید. بعد از آن حتماً SHA، Health و Login را تأیید کنید.

### Rollback داده

Rollback image معمولاً Volume را به گذشته برنمی‌گرداند. اگر نسخهٔ جدید migration ناسازگار انجام داده باشد:

1. سرویس را متوقف یا دسترسی نوشتن را قطع کنید؛
2. نسخهٔ کد سازگار را Deploy کنید؛
3. Backup قبل از Update را از **Import Backup** یا Snapshot معتبر بازیابی کنید؛
4. Health، Login، کلیدها و Providerها را دوباره تست کنید.

## چک‌لیست نهایی

- [ ] `ManiPeak/OpenRouter-Vps` را در حساب خود Fork کرده‌اید؛ parent Fork همان مخزن و Default Branch برابر `main` است.
- [ ] سورس کامل، `Dockerfile`، `package.json`، `LICENSE`، attribution و `INSTALL_FA.md` در Fork شما وجود دارند.
- [ ] Railway Source دقیقاً Fork شخصی `YOUR_GITHUB_USER/OpenRouter-Vps` و Branch برابر `main` است.
- [ ] Build از Dockerfile ریشه انجام شده است، نه فقط از image آماده.
- [ ] Volume روی `/app/data` mount است و فقط یک replica اجرا می‌شود.
- [ ] Secretهای قوی و یکتا تنظیم شده‌اند و هیچ‌کدام در Git نیستند.
- [ ] اگر Antigravity/Gemini CLI OAuth لازم است، فقط Google OAuth client متعلق به خودتان در Railway تنظیم شده است.
- [ ] `AUTH_COOKIE_SECURE=true`، Login اجباری و رمز Dashboard تغییرکرده است.
- [ ] Domain HTTPS و Health Check `/api/health` سالم است.
- [ ] **Require API key** روشن و برای هر کلاینت کلید جدا ساخته شده است.
- [ ] Provider با کمترین دسترسی لازم تنظیم و quota/cost آن فهمیده شده است.
- [ ] SHA در Railway با `main` Fork شخصی شما یکسان است.
- [ ] Redeploy انجام شده و رمز، کلید و Provider باقی مانده‌اند.
- [ ] Auto-deploy از `main` Fork شما فعال است.
- [ ] Backup رمزگذاری‌شده دانلود و Restore آن آزمایش شده است.
- [ ] روش Sync از `ManiPeak/OpenRouter-Vps` و Rollback بدون force-push مستند شده است.
