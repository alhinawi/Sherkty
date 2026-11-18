import assert from "node:assert/strict";
import { entities } from "./schema.mjs";
const base = "http://localhost:8788/api";
let passes = 0;
const check = (ok, msg) => {
  assert.ok(ok, msg);
  passes++;
  console.log("✓ " + msg);
};
class Client {
  cookie = "";
  ip = "local-test-" + crypto.randomUUID();
  async call(path, method = "GET", body, expected = 200, extra = {}) {
    const r = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: this.cookie,
        "CF-Connecting-IP": this.ip,
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const d = await r.json();
    if (r.headers.get("set-cookie"))
      this.cookie = r.headers.get("set-cookie").split(";")[0];
    assert.equal(r.status, expected, path + ": " + JSON.stringify(d));
    passes++;
    return d;
  }
}
const a = new Client(),
  b = new Client();
await a.call("/me", "GET", undefined, 401);
await a.call("/auth/demo", "POST", {}, 201);
const am = await a.call("/me");
check(
  am.company === "Northstar Studio",
  "Isolated demonstration workspace created",
);
await b.call("/auth/demo", "POST", {}, 201);
const bm = await b.call("/me");
check(am.tenant_id !== bm.tenant_id, "Demo sessions have different tenants");
const lookup = await a.call("/lookups");
check(
  lookup.lookups.employees.length === 8,
  "Scoped reference lookups return actual employees",
);
const loaded = {};
for (const key of Object.keys(entities)) {
  const r = await a.call("/records/" + key);
  loaded[key] = r.records;
  check(Array.isArray(r.records), "Read collection: " + key);
}
let employee = loaded.employees[0];
await b.call(
  "/records/employees/" + employee.id,
  "PUT",
  { ...employee, name: "Cross tenant" },
  404,
);
await a.call(
  "/records/tasks",
  "POST",
  {
    name: "Bad ref",
    assignee: (await b.call("/records/employees")).records[0].id,
  },
  400,
);
await a.call(
  "/records/employees",
  "POST",
  { name: "Bad email", email: "bad" },
  400,
);
await a.call(
  "/records/leave",
  "POST",
  {
    name: "Bad dates",
    employee: employee.id,
    startDate: "2026-02-20",
    endDate: "2026-02-10",
  },
  400,
);
await a.call(
  "/records/transactions",
  "POST",
  { name: "Negative", type: "Expense", amount: -5, date: "2026-11-18" },
  400,
);
await a.call(
  "/records/employees",
  "POST",
  { name: "CSRF", email: "csrf@example.invalid" },
  403,
  { Origin: "https://unrelated.invalid" },
);
for (const [key, spec] of Object.entries(entities)) {
  if (key === "payslips") continue;
  const form = { name: "QA " + spec.singular };
  for (const f of spec.fields) {
    if (f.key === "name") continue;
    if (f.type === "ref") {
      const parent = loaded[f.ref]?.[0];
      if (parent) form[f.key] = parent.id;
      else if (f.required) throw Error("Missing fixture " + f.ref);
    } else if (f.type === "money") form[f.key] = 125.25;
    else if (f.type === "number")
      form[f.key] =
        f.key === "lifeMonths"
          ? 36
          : f.key.toLowerCase().includes("rate")
            ? 5
            : 3;
    else if (f.type === "date") form[f.key] = "2026-11-18";
    else if (f.type === "select") form[f.key] = f.options[0];
    else if (f.type === "email") form[f.key] = "qa@example.invalid";
    else if (f.key === "checkIn" || f.key === "time") form[f.key] = "09:00";
    else if (f.key === "checkOut") form[f.key] = "17:00";
    else form[f.key] = "Quality assurance";
  }
  if (key === "salaries") {
    const e = loaded.employees.find(
      (e) => !loaded.salaries.some((s) => s.employee === e.id),
    );
    form.employee = e.id;
  }
  if (key === "movements") {
    form.type = "In";
    form.quantity = 2;
  }
  if (key === "assets") form.salvage = 10;
  const made = await a.call("/records/" + key, "POST", form, 201);
  const read = (
    await a.call("/records/" + key + "?q=QA&limit=100")
  ).records.find((r) => r.id === made.id);
  check(!!read, "Persistent create: " + key);
  if (!["movements"].includes(key)) {
    await a.call("/records/" + key + "/" + made.id, "PUT", {
      ...read,
      name: read.name + " updated",
    });
    const edited = (
      await a.call("/records/" + key + "?q=QA&limit=100")
    ).records.find((r) => r.id === made.id);
    check(edited.version === 2, "Versioned update: " + key);
    await a.call("/records/" + key + "/" + made.id, "DELETE");
    check(
      !(await a.call("/records/" + key + "?q=QA&limit=100")).records.some(
        (r) => r.id === made.id,
      ),
      "Archive: " + key,
    );
  } else
    await a.call("/records/" + key + "/" + made.id, "DELETE", undefined, 400);
}
// Optimistic locking must reject a stale editor.
const original = (await a.call("/records/employees")).records[0];
await a.call("/records/employees/" + original.id, "PUT", {
  ...original,
  name: "Updated name",
});
await a.call(
  "/records/employees/" + original.id,
  "PUT",
  { ...original, name: "Stale overwrite" },
  409,
);
// Stock must never go negative, and a failed movement must leave no record.
const product = loaded.products[0],
  before = (await a.call("/records/products")).records.find(
    (r) => r.id === product.id,
  ).stock;
await a.call(
  "/records/movements",
  "POST",
  {
    name: "Impossible withdrawal",
    product: product.id,
    type: "Out",
    quantity: before + 100,
    date: "2026-11-18",
  },
  409,
);
check(
  (await a.call("/records/products")).records.find((r) => r.id === product.id)
    .stock === before,
  "Insufficient stock rolls back balance",
);
check(
  (await a.call("/records/movements?q=Impossible")).total === 0,
  "Insufficient stock rolls back movement",
);
let order = loaded.orders[0];
await a.call(
  "/records/orders/" + order.id + "/transition",
  "POST",
  { version: order.version, status: "Received" },
  400,
);
await a.call("/records/orders/" + order.id + "/transition", "POST", {
  version: order.version,
  status: "Approved",
});
order = (await a.call("/records/orders")).records.find(
  (r) => r.id === order.id,
);
const orderedProduct = order.product,
  stock = (await a.call("/records/products")).records.find(
    (r) => r.id === orderedProduct,
  ).stock;
await a.call("/records/orders/" + order.id + "/transition", "POST", {
  version: order.version,
  status: "Received",
});
check(
  (await a.call("/records/products")).records.find(
    (r) => r.id === orderedProduct,
  ).stock ===
    stock + order.quantity,
  "Receiving a purchase order posts inventory atomically",
);
await a.call(
  "/records/orders/" + order.id + "/transition",
  "POST",
  { version: order.version, status: "Received" },
  409,
);
await a.call("/payroll/process", "POST", { period: "2026-11" });
let slips = await a.call("/records/payslips");
check(slips.total === 2, "Payroll generates one payslip per active employee");
const maya = slips.records.find((r) => r.name.includes("Maya"));
check(
  maya.net === 21750,
  "Payroll minor-unit arithmetic and tax/insurance snapshot",
);
await a.call("/payroll/process", "POST", { period: "2026-11" }, 409);
check(
  (await a.call("/records/payslips")).total === 2,
  "Repeated payroll cannot duplicate payouts",
);
await a.call("/records/payslips/" + maya.id, "PUT", { ...maya, net: 1 }, 400);
let candidate = loaded.applicants[0];
await a.call("/records/applicants/" + candidate.id + "/transition", "POST", {
  version: candidate.version,
  status: "Offer",
});
candidate = (await a.call("/records/applicants")).records.find(
  (r) => r.id === candidate.id,
);
const headcount = (await a.call("/records/employees")).total;
await a.call("/records/applicants/" + candidate.id + "/transition", "POST", {
  version: candidate.version,
  status: "Hired",
});
check(
  (await a.call("/records/employees")).total === headcount + 1,
  "Hiring creates an employee in the same transaction",
);
let doc = loaded.documents[0];
await a.call("/records/documents/" + doc.id, "PUT", {
  ...doc,
  content: "A revised policy",
});
const history = await a.call("/documents/" + doc.id + "/versions");
check(
  history.versions.length === 2 &&
    history.versions[1].data.content !== history.versions[0].data.content,
  "Document versions retain previous content",
);
// Invitation possession and matching account email are both required.
const inv = await a.call("/members/invite", "POST", {
  email: bm.email,
  role: "viewer",
});
check(
  !!inv.inviteId,
  "Private invitation token created without silently adding an unverified email",
);
await b.call("/invitations/accept", "POST", { id: inv.inviteId });
await b.call("/workspaces/switch", "POST", { id: am.tenant_id });
check(
  (await b.call("/me")).role === "viewer",
  "Accepted membership is scoped to invited tenant",
);
await b.call("/records/transactions", "GET", undefined, 403);
await b.call("/records/employees", "GET", undefined, 403);
await b.call("/records/tasks", "POST", { name: "Denied mutation" }, 403);
await b.call("/members", "GET", undefined, 403);
check(
  (await b.call("/overview")).financeVisible === false,
  "Viewer overview does not disclose finance",
);
await a.call("/members/" + bm.id, "PATCH", { role: "hr" });
await b.call("/records/employees");
await b.call("/records/transactions", "GET", undefined, 403);
const hidden = await a.call(
  "/records/documents",
  "POST",
  {
    name: "Private finance only",
    category: "Company",
    access: "Finance only",
    content: "Sensitive finance text",
  },
  201,
);
check(
  !(await b.call("/records/documents")).records.some((r) => r.id === hidden.id),
  "Document list enforces access",
);
await b.call("/documents/" + hidden.id + "/versions", "GET", undefined, 404);
check(
  !(await b.call("/search?q=Private")).results.some((r) => r.id === hidden.id),
  "Global search enforces document access",
);
check(
  !(await b.call("/overview")).activities.some(
    (r) => r.name === "Private finance only",
  ),
  "Activity summary does not disclose private document titles",
);
await a.call("/members/" + bm.id, "PATCH", { role: "operations" });
await a.call(
  "/records/workflows",
  "POST",
  {
    name: "Owner purchase review",
    entity: "requests",
    threshold: 100,
    approver: "owner",
  },
  201,
);
const purchase = loaded.requests[0];
await b.call(
  "/records/requests/" + purchase.id + "/transition",
  "POST",
  { version: purchase.version, status: "Approved" },
  403,
);
await a.call("/records/requests/" + purchase.id + "/transition", "POST", {
  version: purchase.version,
  status: "Approved",
});
await a.call(
  "/records/departments/" + loaded.departments[0].id,
  "DELETE",
  undefined,
  409,
); // Cross-module finance posting is bookkeeping, never a bank transfer.
const invoice = loaded.invoices.find((r) => r.type === "Receivable");
const txBefore = (await a.call("/records/transactions")).total;
await a.call("/records/invoices/" + invoice.id + "/transition", "POST", {
  version: invoice.version,
  status: "Paid",
});
check(
  (await a.call("/records/transactions")).total === txBefore + 1,
  "Marking an invoice paid creates one approved cash transaction",
);
await a.call(
  "/records/invoices/" + invoice.id + "/transition",
  "POST",
  { version: invoice.version, status: "Paid" },
  409,
);
await a.call("/records/payslips/" + maya.id + "/transition", "POST", {
  version: maya.version,
  status: "Paid",
});
check(
  (await a.call("/records/transactions?q=Payroll%20paid")).total === 1,
  "Payroll paid status creates an expense record without external payment",
);
const approvedRequest = (await a.call("/records/requests")).records.find(
  (r) => r.id === purchase.id,
);
const poBefore = (await a.call("/records/orders")).total;
await a.call("/records/requests/" + purchase.id + "/transition", "POST", {
  version: approvedRequest.version,
  status: "Ordered",
});
check(
  (await a.call("/records/orders")).total === poBefore + 1,
  "Approved purchase request converts into a draft purchase order",
);
// Versioned binary storage, exact bytes, access control and type limits.
const fileBody = "A fictional contract file.\nVersion 1.";
let r = await fetch(base + "/documents/" + doc.id + "/files", {
  method: "POST",
  headers: {
    Cookie: a.cookie,
    "Content-Type": "text/plain",
    "X-Filename": "contract.txt",
  },
  body: fileBody,
});
check(r.status === 201, "Document file upload succeeds");
const uploaded = await r.json();
r = await fetch(base + "/documents/" + doc.id + "/files/" + uploaded.version, {
  headers: { Cookie: a.cookie },
});
check(
  (await r.text()) === fileBody,
  "Downloaded attachment bytes exactly match upload",
);
check(
  r.headers.get("content-disposition").includes("attachment"),
  "Files always download as attachments",
);
r = await fetch(base + "/documents/" + doc.id + "/files", {
  method: "POST",
  headers: {
    Cookie: a.cookie,
    "Content-Type": "text/html",
    "X-Filename": "bad.html",
  },
  body: "<p>blocked</p>",
});
check(r.status === 400, "Active HTML attachment type rejected");
r = await fetch(base + "/documents/" + doc.id + "/files", {
  method: "POST",
  headers: {
    Cookie: a.cookie,
    "Content-Type": "text/plain",
    "X-Filename": "big.txt",
  },
  body: "x".repeat(524289),
});
check(r.status === 400, "Attachment size cap enforced");
await b.call("/workspaces/switch", "POST", { id: bm.tenant_id });
await b.call("/documents/" + doc.id + "/files", "GET", undefined, 404);
await b.call("/workspaces/switch", "POST", { id: am.tenant_id });
const c = new Client(),
  testEmail = "qa-" + crypto.randomUUID() + "@example.invalid";
await c.call(
  "/auth/register",
  "POST",
  {
    name: "QA User",
    company: "Empty Company",
    email: testEmail,
    password: "Local-Fixture-Only-1234",
  },
  201,
);
check(
  (await c.call("/records/employees")).total === 0,
  "New real workspaces start empty, with no fictional company data",
);
await c.call("/workspace", "PATCH", {
  name: "Updated Company",
  currency: "USD",
});
check(
  (await c.call("/me")).currency === "USD",
  "Company currency setting persists before records exist",
);
await c.call("/records/departments", "POST", { name: "First department" }, 201);
await c.call(
  "/workspace",
  "PATCH",
  { name: "Updated Company", currency: "EUR" },
  400,
);
await c.call("/auth/logout", "POST");
await c.call(
  "/auth/login",
  "POST",
  { email: testEmail, password: "wrong-local-password" },
  401,
);
await c.call("/auth/login", "POST", {
  email: testEmail,
  password: "Local-Fixture-Only-1234",
});
check(
  (await c.call("/me")).company === "Updated Company",
  "Password sign-in restores the right company membership",
);
await a.call("/auth/logout", "POST");
await a.call("/me", "GET", undefined, 401);
console.log("\n" + passes + " assertions passed.");
