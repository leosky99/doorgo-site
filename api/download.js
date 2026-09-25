// DoorGo 付费 PDF 安全下载接口（Vercel Serverless Function）
//
// 流程：
//   Stripe Payment Link 付款成功后跳转到
//   https://getdoorgo.vercel.app/api/download?session_id={CHECKOUT_SESSION_ID}
//   本函数用 STRIPE_SECRET_KEY 向 Stripe 核验该 session 确实已付款，
//   核验通过后把 PDF 以附件形式直接推送给买家。
//   PDF 的真实存放地址只存在服务端环境变量 PDF_URL 里，永远不会暴露给前端。
//
// 需要在 Vercel 项目里配置的环境变量（Settings → Environment Variables）：
//   STRIPE_SECRET_KEY  Stripe 的 Restricted Key（只需 Checkout Sessions 的读取权限）
//                      或 Secret Key；建议用 Restricted Key，最小权限。
//   PDF_URL            攻略包 PDF 的真实下载地址（例如 Vercel Blob 的文件 URL）。
//                      不要把这个地址写在前端代码或公开仓库里。

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method Not Allowed');
  }

  var sessionId = String((req.query && req.query.session_id) || '').trim();
  // Stripe Checkout Session ID 形如 cs_test_... / cs_live_...
  if (!/^cs_(test|live)_/.test(sessionId)) {
    return res.status(400).send('缺少有效的订单号（session_id）。请从 Stripe 付款成功页跳转过来，或联系 leosky995@gmail.com。');
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.PDF_URL) {
    return res.status(500).send('下载服务尚未配置完成，请联系 leosky995@gmail.com。');
  }

  // 1) 向 Stripe 核验订单状态（服务端对服务端，用户伪造不了）
  var verifyRes;
  try {
    verifyRes = await fetch(
      'https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(sessionId),
      { headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY } }
    );
  } catch (e) {
    return res.status(502).send('订单核验服务暂时不可用，请稍后重试或联系 leosky995@gmail.com。');
  }
  if (!verifyRes.ok) {
    return res.status(402).send('订单核验未通过。如果已付款，请联系 leosky995@gmail.com 并提供付款邮箱。');
  }
  var session = await verifyRes.json();
  if (session.payment_status !== 'paid') {
    return res.status(402).send('该订单尚未完成支付。完成支付后请从 Stripe 成功页跳转回来下载。');
  }
  // 可选加强：只放行 US$9.90 的攻略包订单（改价后记得同步改这里）
  // if (session.amount_total !== 990 || session.currency !== 'usd') {
  //   return res.status(402).send('该订单不是攻略包订单，无法下载。');
  // }

  // 2) 核验通过，推送 PDF（文件名可按需改）
  var pdfRes;
  try {
    pdfRes = await fetch(process.env.PDF_URL);
  } catch (e) {
    pdfRes = null;
  }
  if (!pdfRes || !pdfRes.ok) {
    return res.status(500).send('文件获取失败，请联系 leosky995@gmail.com 获取。');
  }
  var buf = Buffer.from(await pdfRes.arrayBuffer());
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', String(buf.length));
  res.setHeader('Content-Disposition', 'attachment; filename="DoorGo-攻略包.pdf"');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(buf);
};
