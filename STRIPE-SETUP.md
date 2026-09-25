# DoorGo 付费 PDF 安全交付 · 上线清单

`api/download.js` 已经写好并随仓库部署到 Vercel。要让付费墙真正生效，按下面 5 步操作（约 15 分钟）。

## 1. 找一份最新的 PDF

用仓库里的工具重新生成一份最新的攻略包（内容已更新到 2026 框架）：

```bash
node gen_guides.js > /tmp/guides.json
python gen_pdf.py /tmp/guides.json /tmp/doorgo-guide-pack.pdf
```

> 注意：不要把它放回仓库的 `assets/` 里（`.gitignore` 已忽略）。

## 2. 把 PDF 传到私有存储

在 Vercel Dashboard → Storage → Create Database → **Blob**，建一个 store，
把上一步生成的 PDF 上传，复制它的 Blob URL（形如
`https://xxx.public.blob.vercel-storage.com/doorgo-guide-pack-xxx.pdf`）。
**这个 URL 不要公开**，只用在第 3 步的环境变量里。

## 3. 在 Vercel 配置环境变量

Vercel Dashboard → 你的项目（getdoorgo）→ Settings → Environment Variables，添加：

| 变量名 | 值 | 说明 |
|---|---|---|
| `STRIPE_SECRET_KEY` | `rk_live_...` | Stripe → Developers → API keys → Create **restricted key**，只需要 `Checkout Sessions` 的 **Read** 权限。先用 test key 联调也行 |
| `PDF_URL` | 第 2 步的 Blob URL | 真实文件地址，只存服务端 |

保存后 **Redeploy** 一次让环境变量生效。

## 4. 改 Stripe Payment Link 的付款后跳转

Stripe Dashboard → Payment Links → 找到 `buy.stripe.com/28EcN75K7exG4bP44TbQY01` → After payment →
选择 **Redirect customers to a custom URL**，填：

```
https://getdoorgo.vercel.app/api/download?session_id={CHECKOUT_SESSION_ID}
```

注意 `{CHECKOUT_SESSION_ID}` 照原样写，Stripe 会自动替换成真实订单号。

## 5. 测试 → 上线 → 清理旧漏洞

1. 用 Stripe **test mode** 走一遍：付款 → 跳转 → 能下载 PDF。
2. 切到 live key 再测一笔真实小额（可退款）。
3. 确认新链路工作后，删掉公开的旧文件：
   `gh release delete-asset v1.0 doorgo-guide-pack.pdf --yes`
   （release 本体可以保留，只删附件。）
4. （可选）把旧的付款链接换成新的 Payment Link，避免已泄露的成功页被复用。

## 原理一句话

`/api/download` 拿到 `session_id` 后，用服务端的 Stripe key 去 Stripe
核验"这笔订单真的付过钱"，通过才把 PDF 以附件形式推给买家。
PDF 真实地址永远只存在服务端，买家看到的只是一个一次性核验链接，
伪造订单号会被 Stripe 挡掉。
