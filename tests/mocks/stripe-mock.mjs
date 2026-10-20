// Minimal stand-in for the Stripe API used only by local E2E tests.
// Checkout redirects to /pay on this server; "paying" there fires signed webhooks at the worker.
import { createServer } from "node:http";
import { createHmac } from "node:crypto";

const PORT = Number(process.env.STRIPE_MOCK_PORT ?? 12111);
const WORKER = process.env.WORKER_ORIGIN ?? "http://localhost:8787";
const SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_e2e";
const sessions = new Map();

function sign(payload) {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", SECRET).update(`${t}.${payload}`).digest("hex");
  return `t=${t},v1=${v1}`;
}

async function sendEvent(type, object) {
  const payload = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type, data: { object } });
  const res = await fetch(`${WORKER}/api/stripe/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": sign(payload) },
    body: payload,
  });
  return res.status;
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(new URLSearchParams(data)));
  });
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === "POST" && url.pathname === "/v1/checkout/sessions") {
    if (!req.headers.authorization?.startsWith("Bearer sk_test_")) {
      res.writeHead(401).end("{}");
      return;
    }
    const body = await readBody(req);
    const id = `cs_test_${Math.random().toString(36).slice(2)}`;
    sessions.set(id, Object.fromEntries(body));
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ id, url: `http://localhost:${PORT}/pay/${id}` }));
    return;
  }
  if (req.method === "POST" && url.pathname === "/v1/billing_portal/sessions") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ url: `http://localhost:${PORT}/portal` }));
    return;
  }
  const pay = url.pathname.match(/^\/pay\/(cs_test_\w+)$/);
  if (req.method === "GET" && pay) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(`<!doctype html><title>Mock Checkout</title><link rel="icon" href="data:,"><form method="post"><p>Mock Checkout</p><button id="pay">支払う</button></form>`);
    return;
  }
  if (req.method === "POST" && pay) {
    const s = sessions.get(pay[1]);
    if (!s) {
      res.writeHead(404).end();
      return;
    }
    const customer = `cus_${Math.random().toString(36).slice(2)}`;
    await sendEvent("checkout.session.completed", { id: pay[1], client_reference_id: s.client_reference_id, customer });
    await sendEvent("customer.subscription.created", {
      id: `sub_${customer}`,
      customer,
      status: "active",
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      metadata: { user_id: s.client_reference_id },
    });
    res.writeHead(303, { location: s.success_url }).end();
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, () => console.log(`stripe mock on ${PORT}`));
