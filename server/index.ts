import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import {
  entities,
  roleModules,
  modules,
  Field,
  defaultLanguage,
} from "../src/schema";
import { seed } from "./seed";
type Bindings = { ERP_DB: D1Database; ASSETS: Fetcher };
type Auth = {
  id: string;
  name: string;
  email: string;
  tenant_id: string;
  role: string;
  company: string;
  currency: string;
  expires_at: string | null;
};
const app = new Hono<{ Bindings: Bindings; Variables: { auth: Auth } }>();
const id = () => crypto.randomUUID();
const hex = (b: ArrayBuffer) =>
  Array.from(new Uint8Array(b), (v) => v.toString(16).padStart(2, "0")).join(
    "",
  );
const hash = async (s: string) =>
  hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
async function password(p: string, salt: string) {
  const k = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(p),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return hex(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: new TextEncoder().encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      k,
      256,
    ),
  );
}
const fail = (message: string, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
app.onError((e, c) => {
  const status =
    (e as any).status || (e.message.includes("UNIQUE constraint") ? 409 : 500);
  if (status === 500) console.error("Request failed:", e.message);
  return c.json(
    {
      error:
        status === 500
          ? "Could not complete this request. No partial transaction was committed."
          : status === 409 && e.message.includes("UNIQUE constraint")
            ? "A matching record or newer version already exists. Refresh and try again."
            : e.message,
    },
    status as any,
  );
});
app.use(
  "/api/*",
  bodyLimit({
    maxSize: 550000,
    onError: (c) => c.json({ error: "Request too large" }, 413),
  }),
);
app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "same-origin");
  c.header("X-Frame-Options", "DENY");
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    const origin = c.req.header("Origin");
    if (origin && origin !== new URL(c.req.url).origin)
      return c.json({ error: "Cross-origin request rejected" }, 403);
    if (
      Number(c.req.header("Content-Length") || 0) >
      (c.req.path.endsWith("/files") ? 550000 : 100000)
    )
      return c.json({ error: "Request too large" }, 413);
  }
  await next();
});
async function limited(db: D1Database, key: string, max = 12) {
  const now = Date.now(),
    slot = Math.floor(now / 3600000);
  const k = await hash(key + ":" + slot);
  const r = await db
    .prepare(
      "INSERT INTO rate_limits(key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
    )
    .bind(k, now + 3600000)
    .first<{ count: number }>();
  if ((r?.count || 0) > max)
    fail("Too many attempts. Try again in an hour.", 429);
}
async function body(c: any) {
  let b: any;
  try {
    const text = await c.req.text();
    if (text.length > 100000) fail("Request too large", 413);
    b = JSON.parse(text);
  } catch (e: any) {
    if (e.status) throw e;
    fail("Invalid JSON");
  }
  if (!b || typeof b !== "object" || Array.isArray(b)) fail("Invalid request");
  return b;
}
const text = (v: any, max = 200) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const emailValid = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
function audit(
  db: D1Database,
  a: Auth,
  action: string,
  entity: string,
  record: string,
  name: string,
) {
  return db
    .prepare(
      "INSERT INTO audit(id,tenant_id,user_id,actor,action,entity,record_id,name) VALUES (?,?,?,?,?,?,?,?)",
    )
    .bind(id(), a.tenant_id, a.id, a.name, action, entity, record, name);
}
async function session(c: any, uid: string, tid: string) {
  await c.env.ERP_DB.batch([
    c.env.ERP_DB.prepare("DELETE FROM sessions WHERE expires_at<?").bind(
      Date.now(),
    ),
    c.env.ERP_DB.prepare("DELETE FROM rate_limits WHERE expires_at<?").bind(
      Date.now(),
    ),
  ]);
  const token = hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
  await c.env.ERP_DB.prepare(
    "INSERT INTO sessions(hash,user_id,tenant_id,expires_at) VALUES (?,?,?,?)",
  )
    .bind(await hash(token), uid, tid, Date.now() + 7 * 86400000)
    .run();
  setCookie(c, "erp_session", token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Strict",
    path: "/",
    maxAge: 7 * 86400,
  });
}
app.get("/api/public-config", (c) => {
  const country = c.req.raw.cf?.country || c.req.header("CF-IPCountry");
  return c.json({
    suggestedLanguage: defaultLanguage(
      typeof country === "string" ? country : undefined,
      c.req.header("Accept-Language") || "",
    ),
  });
});
app.post("/api/auth/register", async (c) => {
  await limited(
    c.env.ERP_DB,
    "register:" + c.req.header("CF-Connecting-IP"),
    5,
  );
  const b = await body(c);
  const email = text(b.email).toLowerCase(),
    name = text(b.name),
    company = text(b.company);
  if (
    !emailValid(email) ||
    !name ||
    !company ||
    typeof b.password !== "string" ||
    b.password.length < 12 ||
    b.password.length > 128
  )
    fail(
      "Name, company, valid email and a password of 12–128 characters are required.",
    );
  const uid = id(),
    tid = id(),
    salt = id();
  if (
    await c.env.ERP_DB.prepare("SELECT id FROM users WHERE email=?")
      .bind(email)
      .first()
  )
    fail("Unable to create account. If you already have an account, sign in.");
  await c.env.ERP_DB.batch([
    c.env.ERP_DB.prepare(
      "INSERT INTO users(id,email,name,password,salt) VALUES (?,?,?,?,?)",
    ).bind(uid, email, name, await password(b.password, salt), salt),
    c.env.ERP_DB.prepare("INSERT INTO tenants(id,name) VALUES (?,?)").bind(
      tid,
      company,
    ),
    c.env.ERP_DB.prepare("INSERT INTO memberships VALUES (?,?,'owner')").bind(
      tid,
      uid,
    ),
  ]);
  await session(c, uid, tid);
  return c.json({ ok: true }, 201);
});
app.post("/api/auth/login", async (c) => {
  await limited(c.env.ERP_DB, "login:" + c.req.header("CF-Connecting-IP"), 12);
  const b = await body(c),
    email = text(b.email).toLowerCase();
  if (typeof b.password !== "string" || b.password.length > 128)
    fail("Invalid email or password", 401);
  const u = await c.env.ERP_DB.prepare("SELECT * FROM users WHERE email=?")
    .bind(email)
    .first<any>();
  const computed = await password(b.password, u?.salt || "invalid-salt");
  if (!u || computed !== u.password) fail("Invalid email or password", 401);
  const m = await c.env.ERP_DB.prepare(
    "SELECT m.tenant_id FROM memberships m JOIN tenants t ON t.id=m.tenant_id WHERE m.user_id=? AND (t.expires_at IS NULL OR t.expires_at>datetime('now')) ORDER BY t.created_at LIMIT 1",
  )
    .bind(u.id)
    .first<any>();
  if (!m) fail("No active workspace", 403);
  await session(c, u.id, m.tenant_id);
  return c.json({ ok: true });
});
app.post("/api/auth/demo", async (c) => {
  const db = c.env.ERP_DB;
  await limited(db, "demo:" + c.req.header("CF-Connecting-IP"), 3);
  await db
    .prepare(
      "DELETE FROM tenants WHERE expires_at IS NOT NULL AND expires_at<datetime('now')",
    )
    .run();
  const count = await db
    .prepare("SELECT COUNT(*) n FROM tenants WHERE expires_at IS NOT NULL")
    .first<{ n: number }>();
  if ((count?.n || 0) >= 100)
    fail("Demo capacity reached. Create a free workspace instead.", 429);
  const uid = id(),
    tid = id();
  await db.batch([
    db
      .prepare(
        "INSERT INTO users(id,email,name,password,salt) VALUES (?,?,?,?,?)",
      )
      .bind(
        uid,
        "demo-" + uid + "@invalid.local",
        "Alex Morgan",
        "disabled",
        id(),
      ),
    db
      .prepare(
        "INSERT INTO tenants(id,name,expires_at) VALUES (?, ?,datetime('now','+1 day'))",
      )
      .bind(tid, "Northstar Studio"),
    db.prepare("INSERT INTO memberships VALUES (?,?,'owner')").bind(tid, uid),
  ]);
  await db
    .prepare(
      "DELETE FROM users WHERE email LIKE 'demo-%@invalid.local' AND NOT EXISTS (SELECT 1 FROM memberships WHERE memberships.user_id=users.id)",
    )
    .run();
  await seed(db, tid, uid);
  await session(c, uid, tid);
  return c.json({ ok: true, demo: true }, 201);
});
app.post("/api/auth/logout", async (c) => {
  const token = getCookie(c, "erp_session");
  if (token)
    await c.env.ERP_DB.prepare("DELETE FROM sessions WHERE hash=?")
      .bind(await hash(token))
      .run();
  deleteCookie(c, "erp_session", { path: "/" });
  return c.json({ ok: true });
});
app.use("/api/*", async (c, next) => {
  const token = getCookie(c, "erp_session");
  if (!token) return c.json({ error: "Sign in to continue" }, 401);
  const a = await c.env.ERP_DB.prepare(
    "SELECT u.id,u.name,u.email,s.tenant_id,m.role,t.name company,t.currency,t.expires_at FROM sessions s JOIN users u ON u.id=s.user_id JOIN memberships m ON m.user_id=u.id AND m.tenant_id=s.tenant_id JOIN tenants t ON t.id=s.tenant_id WHERE s.hash=? AND s.expires_at>? AND (t.expires_at IS NULL OR t.expires_at>datetime('now'))",
  )
    .bind(await hash(token), Date.now())
    .first<Auth>();
  if (!a) return c.json({ error: "Session expired. Sign in again." }, 401);
  c.set("auth", a);
  await next();
});
const allowed = (a: Auth, module: string, write = false) => {
  if (!roleModules[a.role]?.includes(module) || (write && a.role === "viewer"))
    fail("You do not have permission for this action", 403);
};
const docAllowed = (a: Auth, d: any) =>
  !d.access ||
  d.access === "All members" ||
  ["owner", "admin"].includes(a.role) ||
  (d.access === "HR only" && a.role === "hr") ||
  (d.access === "Finance only" && a.role === "finance");
async function row(db: D1Database, a: Auth, entity: string, rid: string) {
  const r = await db
    .prepare(
      "SELECT * FROM records WHERE tenant_id=? AND id=? AND entity=? AND archived=0",
    )
    .bind(a.tenant_id, rid, entity)
    .first<any>();
  if (!r) fail("Record not found", 404);
  if (entity === "documents" && !docAllowed(a, JSON.parse(r.data)))
    fail("Record not found", 404);
  return r;
}
function view(r: any) {
  const d = JSON.parse(r.data);
  for (const f of entities[r.entity]?.fields || [])
    if (f.type === "money" && d[f.key] != null) d[f.key] /= 100;
  return {
    ...d,
    id: r.id,
    status: r.status,
    version: r.version,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}
async function validate(
  db: D1Database,
  a: Auth,
  entity: string,
  b: any,
  existing?: any,
) {
  const e = entities[entity];
  if (!e) fail("Unknown collection", 404);
  const d: any = {};
  for (const f of e.fields) {
    let v = b[f.key];
    if (v == null || v === "") {
      if (f.required) fail(f.en + " is required");
      continue;
    }
    if (["money", "number"].includes(f.type || "")) {
      if (
        typeof v !== "number" ||
        !Number.isFinite(v) ||
        v < (f.min ?? -Infinity) ||
        v > (f.max ?? Infinity)
      )
        fail("Invalid " + f.en);
      if (f.type === "number" && !f.step && !Number.isInteger(v))
        fail(f.en + " must be a whole number");
      d[f.key] = f.type === "money" ? Math.round(v * 100) : v;
    } else {
      if (
        typeof v !== "string" ||
        v.length > (f.type === "textarea" ? 20000 : 500)
      )
        fail("Invalid " + f.en);
      v = v.trim();
      if (f.required && !v) fail(f.en + " is required");
      if (f.type === "email" && !emailValid(v)) fail("Invalid email");
      if (
        f.type === "date" &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(v) ||
          new Date(v).toISOString().slice(0, 10) !== v)
      )
        fail("Invalid date");
      if (f.options && !f.options.includes(v)) fail("Invalid " + f.en);
      if (f.type === "ref") {
        const target = await db
          .prepare(
            "SELECT id FROM records WHERE tenant_id=? AND id=? AND entity=? AND archived=0",
          )
          .bind(a.tenant_id, v, f.ref)
          .first();
        if (!target) fail("Invalid " + f.en + " reference");
      }
      d[f.key] = v;
    }
  }
  if (d.endDate && d.startDate && d.endDate < d.startDate)
    fail("End date must be after start date");
  if (
    (d.checkIn && !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.checkIn)) ||
    (d.checkOut && !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.checkOut)) ||
    (d.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time))
  )
    fail("Time must use HH:MM");
  if (entity === "orders" && Boolean(d.product) !== Boolean(d.quantity))
    fail(
      "Choose both a product and quantity for inventory orders, or neither for services.",
    );
  if (entity === "assets" && (d.salvage || 0) > d.cost)
    fail("Residual value cannot exceed acquisition cost");
  if (entity === "movements" && !["In", "Out"].includes(d.type))
    fail("Choose a stock direction");
  if (entity === "transactions" && !["Income", "Expense"].includes(d.type))
    fail("Choose income or expense");
  if (entity === "documents" && !docAllowed(a, d))
    fail("You cannot create a document outside your access scope", 403);
  if (entity === "salaries") {
    const duplicate = await db
      .prepare(
        "SELECT id FROM records WHERE tenant_id=? AND entity='salaries' AND archived=0 AND json_extract(data,'$.employee')=? AND id<>?",
      )
      .bind(a.tenant_id, d.employee, existing?.id || "")
      .first();
    if (duplicate) fail("This employee already has a salary structure");
  }
  return d;
}
function insert(
  db: D1Database,
  a: Auth,
  entity: string,
  d: any,
  status?: string,
  rid = id(),
): { id: string; statements: D1PreparedStatement[] } {
  const s = status ?? entities[entity].states?.[0] ?? "";
  const encoded = JSON.stringify(d);
  return {
    id: rid,
    statements: [
      db
        .prepare(
          "INSERT INTO records(id,tenant_id,entity,name,status,data,created_by) VALUES (?,?,?,?,?,?,?)",
        )
        .bind(rid, a.tenant_id, entity, d.name, s, encoded, a.id),
      db
        .prepare(
          "INSERT INTO versions(tenant_id,record_id,version,data) VALUES (?,?,1,?)",
        )
        .bind(a.tenant_id, rid, JSON.stringify({ ...d, status: s })),
      ...entities[entity].fields
        .filter((f) => f.type === "ref" && d[f.key])
        .map((f) =>
          db
            .prepare("INSERT INTO record_links VALUES (?,?,?,?)")
            .bind(a.tenant_id, rid, f.key, d[f.key]),
        ),
      audit(db, a, "created", entity, rid, d.name),
    ],
  };
}
function update(
  db: D1Database,
  a: Auth,
  entity: string,
  r: any,
  d: any,
  status: string,
  action = "updated",
) {
  const version = r.version + 1;
  return [
    db
      .prepare(
        "INSERT INTO versions(tenant_id,record_id,version,data) VALUES (?,?,?,?)",
      )
      .bind(a.tenant_id, r.id, version, JSON.stringify({ ...d, status })),
    db
      .prepare(
        "UPDATE records SET name=?,status=?,data=?,version=?,updated_at=datetime('now') WHERE tenant_id=? AND id=? AND version=?",
      )
      .bind(
        d.name,
        status,
        JSON.stringify(d),
        version,
        a.tenant_id,
        r.id,
        r.version,
      ),
    db
      .prepare("DELETE FROM record_links WHERE tenant_id=? AND source_id=?")
      .bind(a.tenant_id, r.id),
    ...entities[entity].fields
      .filter((f) => f.type === "ref" && d[f.key])
      .map((f) =>
        db
          .prepare("INSERT INTO record_links VALUES (?,?,?,?)")
          .bind(a.tenant_id, r.id, f.key, d[f.key]),
      ),
    audit(db, a, action, entity, r.id, d.name),
  ];
}
app.get("/api/me", async (c) => {
  const a = c.get("auth");
  const memberships = await c.env.ERP_DB.prepare(
    "SELECT t.id,t.name,m.role FROM memberships m JOIN tenants t ON t.id=m.tenant_id WHERE m.user_id=?",
  )
    .bind(a.id)
    .all();
  return c.json({
    ...a,
    modules: roleModules[a.role],
    workspaces: memberships.results,
  });
});
app.patch("/api/workspace", async (c) => {
  const a = c.get("auth");
  allowed(a, "admin", true);
  const b = await body(c);
  const name = text(b.name),
    currency = text(b.currency);
  if (!name || !["EGP", "USD", "EUR", "GBP", "SAR", "AED"].includes(currency))
    fail("Valid company name and supported currency required");
  if (currency !== a.currency) {
    const count = await c.env.ERP_DB.prepare(
      "SELECT 1 FROM records WHERE tenant_id=? LIMIT 1",
    )
      .bind(a.tenant_id)
      .first();
    if (count)
      fail(
        "Currency cannot be changed after records exist. No currency conversion is performed.",
      );
  }
  await c.env.ERP_DB.batch([
    c.env.ERP_DB.prepare(
      "UPDATE tenants SET name=?,currency=? WHERE id=?",
    ).bind(name, currency, a.tenant_id),
    audit(
      c.env.ERP_DB,
      a,
      "updated company settings",
      "settings",
      a.tenant_id,
      name,
    ),
  ]);
  return c.json({ ok: true });
});
app.post("/api/workspaces", async (c) => {
  const a = c.get("auth"),
    b = await body(c);
  if (!text(b.name)) fail("Workspace name is required");
  const tid = id();
  await c.env.ERP_DB.batch([
    c.env.ERP_DB.prepare("INSERT INTO tenants(id,name) VALUES (?,?)").bind(
      tid,
      text(b.name),
    ),
    c.env.ERP_DB.prepare("INSERT INTO memberships VALUES (?,?,'owner')").bind(
      tid,
      a.id,
    ),
  ]);
  await session(c, a.id, tid);
  return c.json({ ok: true }, 201);
});
app.post("/api/workspaces/switch", async (c) => {
  const a = c.get("auth"),
    b = await body(c);
  if (
    !(await c.env.ERP_DB.prepare(
      "SELECT 1 FROM memberships WHERE tenant_id=? AND user_id=?",
    )
      .bind(text(b.id), a.id)
      .first())
  )
    fail("Workspace not found", 404);
  await session(c, a.id, b.id);
  return c.json({ ok: true });
});
app.get("/api/records/:entity", async (c) => {
  const a = c.get("auth"),
    entity = c.req.param("entity"),
    e = entities[entity];
  if (!e) fail("Unknown collection", 404);
  allowed(a, e.module);
  const page = Math.max(1, Math.min(10000, Number(c.req.query("page")) || 1)),
    limit = Math.max(1, Math.min(100, Number(c.req.query("limit")) || 25));
  const q = (c.req.query("q") || "").slice(0, 40),
    status = c.req.query("status") || "";
  let where = "tenant_id=? AND entity=? AND archived=0";
  const params: any[] = [a.tenant_id, entity];
  if (q) {
    where += " AND name LIKE ? ESCAPE '\\'";
    params.push("%" + q.replace(/[\\%_]/g, "\\$&") + "%");
  }
  if (status) {
    where += " AND status=?";
    params.push(status);
  }
  if (entity === "documents" && !["admin", "owner"].includes(a.role)) {
    where +=
      " AND (json_extract(data,'$.access') IS NULL OR json_extract(data,'$.access') IN (?,?))";
    params.push(
      "All members",
      a.role === "hr"
        ? "HR only"
        : a.role === "finance"
          ? "Finance only"
          : "All members",
    );
  }
  const [rows, n] = await c.env.ERP_DB.batch([
    c.env.ERP_DB.prepare(
      "SELECT * FROM records WHERE " +
        where +
        " ORDER BY updated_at DESC,id LIMIT ? OFFSET ?",
    ).bind(...params, limit, (page - 1) * limit),
    c.env.ERP_DB.prepare("SELECT COUNT(*) n FROM records WHERE " + where).bind(
      ...params,
    ),
  ]);
  let results = rows.results.map(view);
  if (entity === "products") {
    const balances = await c.env.ERP_DB.prepare(
      "SELECT product_id,quantity FROM stock_balances WHERE tenant_id=?",
    )
      .bind(a.tenant_id)
      .all<any>();
    const b = new Map(balances.results.map((r) => [r.product_id, r.quantity]));
    results = results.map((r) => ({ ...r, stock: b.get(r.id) || 0 }));
  }
  if (entity === "assets")
    results = results.map((r) => {
      const months = Math.max(
        0,
        (new Date().getFullYear() - new Date(r.acquiredDate).getFullYear()) *
          12 +
          new Date().getMonth() -
          new Date(r.acquiredDate).getMonth(),
      );
      return {
        ...r,
        bookValue: Math.max(
          r.salvage || 0,
          r.cost -
            (r.cost - (r.salvage || 0)) * Math.min(months / r.lifeMonths, 1),
        ),
      };
    });
  return c.json({
    records: results,
    total: (n.results[0] as any).n,
    page,
    limit,
  });
});
app.post("/api/records/:entity", async (c) => {
  const a = c.get("auth"),
    entity = c.req.param("entity"),
    e = entities[entity];
  if (!e) fail("Unknown collection", 404);
  allowed(a, e.module, true);
  if (entity === "payslips")
    fail("Use monthly payroll processing to create payslips");
  const b = await body(c),
    d = await validate(c.env.ERP_DB, a, entity, b);
  let status = e.states?.[0] || "";
  if (!e.transitions && b.status) {
    if (!e.states?.includes(b.status)) fail("Invalid status");
    status = b.status;
  }
  const op = insert(c.env.ERP_DB, a, entity, d, status);
  if (entity === "products")
    op.statements.push(
      c.env.ERP_DB.prepare("INSERT INTO stock_balances VALUES (?,?,0)").bind(
        a.tenant_id,
        op.id,
      ),
    );
  if (entity === "movements")
    op.statements.push(
      c.env.ERP_DB.prepare(
        "UPDATE stock_balances SET quantity=quantity+? WHERE tenant_id=? AND product_id=?",
      ).bind(
        d.type === "In" ? d.quantity : -d.quantity,
        a.tenant_id,
        d.product,
      ),
    );
  try {
    await c.env.ERP_DB.batch(op.statements);
  } catch (e: any) {
    if (entity === "movements" && e.message.includes("CHECK"))
      fail("Insufficient stock. Movement was not saved.", 409);
    throw e;
  }
  return c.json({ id: op.id }, 201);
});
app.put("/api/records/:entity/:id", async (c) => {
  const a = c.get("auth"),
    entity = c.req.param("entity"),
    e = entities[entity];
  if (!e) fail("Unknown collection", 404);
  allowed(a, e.module, true);
  if (["movements", "payslips"].includes(entity))
    fail("Posted records are immutable. Create a correcting movement instead.");
  const r = await row(c.env.ERP_DB, a, entity, c.req.param("id")),
    b = await body(c);
  if (b.version !== r.version)
    fail("This record changed. Refresh before saving.", 409);
  if (e.transitions && r.status !== e.states?.[0])
    fail("This record has entered an approval workflow and cannot be edited.");
  const d = await validate(c.env.ERP_DB, a, entity, b, r);
  const s = e.transitions
    ? r.status
    : e.states?.includes(b.status)
      ? b.status
      : r.status;
  try {
    await c.env.ERP_DB.batch(update(c.env.ERP_DB, a, entity, r, d, s));
  } catch (e: any) {
    if (e.message.includes("UNIQUE"))
      fail("This record changed. Refresh before saving.", 409);
    throw e;
  }
  return c.json({ ok: true });
});
app.delete("/api/records/:entity/:id", async (c) => {
  const a = c.get("auth"),
    entity = c.req.param("entity"),
    e = entities[entity];
  if (!e) fail("Unknown collection", 404);
  allowed(a, e.module, true);
  if (["movements", "payslips"].includes(entity))
    fail("Posted records cannot be removed");
  const r = await row(c.env.ERP_DB, a, entity, c.req.param("id"));
  if (e.transitions && r.status !== e.states?.[0])
    fail("Posted or approved records cannot be removed");
  const link = await c.env.ERP_DB.prepare(
    "SELECT source_id FROM record_links l JOIN records r ON r.tenant_id=l.tenant_id AND r.id=l.source_id WHERE l.tenant_id=? AND l.target_id=? AND r.archived=0 LIMIT 1",
  )
    .bind(a.tenant_id, r.id)
    .first();
  if (link)
    fail(
      "This record is used by another record. Remove its references first.",
      409,
    );
  const d = JSON.parse(r.data);
  await c.env.ERP_DB.batch([
    ...update(c.env.ERP_DB, a, entity, r, d, r.status, "archived"),
    c.env.ERP_DB.prepare(
      "UPDATE records SET archived=1 WHERE tenant_id=? AND id=?",
    ).bind(a.tenant_id, r.id),
  ]);
  return c.json({ ok: true });
});
app.post("/api/records/:entity/:id/transition", async (c) => {
  const a = c.get("auth"),
    entity = c.req.param("entity"),
    e = entities[entity];
  if (!e?.transitions) fail("No approval workflow for this collection");
  allowed(a, e.module, true);
  const db = c.env.ERP_DB,
    r = await row(db, a, entity, c.req.param("id")),
    b = await body(c);
  if (b.version !== r.version)
    fail("This record changed. Refresh before continuing.", 409);
  if (!e.transitions?.[r.status]?.includes(b.status))
    fail("Invalid workflow transition");
  const policies = await db
    .prepare(
      "SELECT data FROM records WHERE tenant_id=? AND entity='workflows' AND archived=0",
    )
    .bind(a.tenant_id)
    .all<any>();
  const d = JSON.parse(r.data);
  for (const p of policies.results.map((r) => JSON.parse(r.data))) {
    if (
      p.entity === entity &&
      (d.amount || 0) >= (p.threshold || 0) &&
      !["owner", "admin", p.approver].includes(a.role)
    )
      fail("This amount requires approval by " + p.approver, 403);
  }
  if (entity === "requests" && b.status === "Approved" && !d.vendor)
    fail("Select a vendor before approving the purchase request.");
  if (
    entity === "payslips" &&
    b.status === "Paid" &&
    !["owner", "admin", "finance"].includes(a.role)
  )
    fail(
      "Only finance or workspace administrators can record payroll as paid.",
      403,
    );
  let ops = update(db, a, entity, r, d, b.status, "marked " + b.status);
  if (entity === "applicants" && b.status === "Hired") {
    const employee = insert(
      db,
      a,
      "employees",
      {
        name: d.name,
        email: d.email,
        phone: d.phone || "",
        employment: "Full-time",
        startDate: new Date().toISOString().slice(0, 10),
      },
      "Active",
    );
    ops.push(...employee.statements);
  }
  if (
    entity === "orders" &&
    b.status === "Received" &&
    d.product &&
    d.quantity
  ) {
    const movement = insert(db, a, "movements", {
      name: "Received " + d.name,
      product: d.product,
      type: "In",
      quantity: d.quantity,
      date: new Date().toISOString().slice(0, 10),
      reference: r.id,
    });
    ops.push(
      ...movement.statements,
      db
        .prepare(
          "UPDATE stock_balances SET quantity=quantity+? WHERE tenant_id=? AND product_id=?",
        )
        .bind(d.quantity, a.tenant_id, d.product),
    );
  }
  if (entity === "invoices" && b.status === "Paid") {
    const tx = insert(
      db,
      a,
      "transactions",
      {
        name: "Payment · " + d.name,
        type: d.type === "Receivable" ? "Income" : "Expense",
        amount: d.amount,
        date: new Date().toISOString().slice(0, 10),
        category: d.type === "Receivable" ? "Receivables" : "Payables",
        reference: r.id,
        notes: "Recorded from invoice " + d.name,
      },
      "Approved",
    );
    ops.push(...tx.statements);
  }
  if (entity === "payslips" && b.status === "Paid") {
    const tx = insert(
      db,
      a,
      "transactions",
      {
        name: "Payroll paid · " + d.name,
        type: "Expense",
        amount: d.net,
        date: new Date().toISOString().slice(0, 10),
        category: "Payroll",
        reference: r.id,
        notes: "Bookkeeping record only. No bank transfer is initiated.",
      },
      "Approved",
    );
    ops.push(...tx.statements);
  }
  if (entity === "requests" && b.status === "Ordered") {
    if (!d.vendor)
      fail("Select a vendor before approving the purchase request.");
    const order = insert(
      db,
      a,
      "orders",
      {
        name: "PO · " + d.name,
        vendor: d.vendor,
        request: r.id,
        amount: d.amount,
      },
      "Draft",
    );
    ops.push(...order.statements);
  }
  try {
    await db.batch(ops);
  } catch (err: any) {
    if (err.message.includes("UNIQUE"))
      fail("This record changed. Refresh before continuing.", 409);
    throw err;
  }
  return c.json({ ok: true });
});
app.post("/api/payroll/process", async (c) => {
  const a = c.get("auth");
  allowed(a, "payroll", true);
  const b = await body(c);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(b.period || ""))
    fail("Choose a period using YYYY-MM");
  const db = c.env.ERP_DB;
  const salaries = await db
    .prepare(
      "SELECT data FROM records WHERE tenant_id=? AND entity='salaries' AND archived=0 AND json_extract(data,'$.employee') IN (SELECT id FROM records WHERE tenant_id=? AND entity='employees' AND archived=0 AND status='Active') LIMIT 101",
    )
    .bind(a.tenant_id, a.tenant_id)
    .all<any>();
  if (!salaries.results.length)
    fail("Add salary structures for active employees first");
  if (salaries.results.length > 100)
    fail("Payroll is limited to 100 employees per workspace in this edition.");
  const ops: D1PreparedStatement[] = [];
  for (const s of salaries.results) {
    const d = JSON.parse(s.data),
      tax = Math.round(((d.base + (d.bonus || 0)) * (d.taxRate || 0)) / 100),
      insurance = Math.round((d.base * (d.insuranceRate || 0)) / 100);
    const net = d.base + (d.bonus || 0) - (d.deduction || 0) - tax - insurance;
    if (net < 0) fail("Deductions exceed salary for " + d.name);
    const slip = insert(
      db,
      a,
      "payslips",
      {
        name: d.name + " · " + b.period,
        employee: d.employee,
        period: b.period,
        base: d.base,
        bonus: d.bonus || 0,
        deduction: d.deduction || 0,
        tax,
        insurance,
        net,
      },
      "Processed",
    );
    ops.push(
      ...slip.statements,
      db
        .prepare("INSERT INTO payroll_runs VALUES (?,?,?,?)")
        .bind(a.tenant_id, b.period, d.employee, slip.id),
    );
  }
  try {
    await db.batch(ops);
  } catch (e: any) {
    if (e.message.includes("UNIQUE"))
      fail(
        "Payroll for this period has already been processed. No duplicate payslips were created.",
        409,
      );
    throw e;
  }
  return c.json({ count: salaries.results.length });
});
app.get("/api/documents/:id/files", async (c) => {
  const a = c.get("auth");
  allowed(a, "documents");
  await row(c.env.ERP_DB, a, "documents", c.req.param("id"));
  const files = await c.env.ERP_DB.prepare(
    "SELECT version,name,mime,size,created_at FROM document_files WHERE tenant_id=? AND document_id=? ORDER BY version DESC LIMIT 30",
  )
    .bind(a.tenant_id, c.req.param("id"))
    .all();
  return c.json({ files: files.results });
});
app.post("/api/documents/:id/files", async (c) => {
  const a = c.get("auth");
  allowed(a, "documents", true);
  const r = await row(c.env.ERP_DB, a, "documents", c.req.param("id"));
  const bytes = await c.req.arrayBuffer();
  if (bytes.byteLength > 524288 || bytes.byteLength === 0)
    fail("Files must be 1 byte to 512 KB.");
  const mime = c.req.header("Content-Type") || "";
  if (
    ![
      "application/pdf",
      "image/png",
      "image/jpeg",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ].includes(mime)
  )
    fail("Allowed file types: PDF, PNG, JPEG, TXT, DOCX and XLSX.");
  const name = text(
    decodeURIComponent(c.req.header("X-Filename") || "document"),
    200,
  ).replace(/[\\/\r\n]/g, "_");
  const latest = await c.env.ERP_DB.prepare(
    "SELECT MAX(version) n FROM document_files WHERE tenant_id=? AND document_id=?",
  )
    .bind(a.tenant_id, r.id)
    .first<{ n: number | null }>();
  const version = (latest?.n || 0) + 1;
  await c.env.ERP_DB.batch([
    c.env.ERP_DB.prepare(
      "INSERT INTO document_files(tenant_id,document_id,version,name,mime,size,content,uploaded_by) VALUES (?,?,?,?,?,?,?,?)",
    ).bind(
      a.tenant_id,
      r.id,
      version,
      name,
      mime,
      bytes.byteLength,
      bytes,
      a.id,
    ),
    audit(
      c.env.ERP_DB,
      a,
      "uploaded file version " + version,
      "documents",
      r.id,
      r.name,
    ),
  ]);
  return c.json({ version }, 201);
});
app.get("/api/documents/:id/files/:version", async (c) => {
  const a = c.get("auth");
  allowed(a, "documents");
  const r = await row(c.env.ERP_DB, a, "documents", c.req.param("id"));
  const file = await c.env.ERP_DB.prepare(
    "SELECT name,mime,content FROM document_files WHERE tenant_id=? AND document_id=? AND version=?",
  )
    .bind(a.tenant_id, r.id, Number(c.req.param("version")))
    .first<any>();
  if (!file) fail("File not found", 404);
  await audit(
    c.env.ERP_DB,
    a,
    "downloaded file",
    "documents",
    r.id,
    r.name,
  ).run();
  return new Response(
    Array.isArray(file.content) ? new Uint8Array(file.content) : file.content,
    {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition":
          "attachment; filename*=UTF-8''" + encodeURIComponent(file.name),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'",
      },
    },
  );
});
app.get("/api/documents/:id/versions", async (c) => {
  const a = c.get("auth");
  allowed(a, "documents");
  await row(c.env.ERP_DB, a, "documents", c.req.param("id"));
  const rows = await c.env.ERP_DB.prepare(
    "SELECT version,data,created_at FROM versions WHERE tenant_id=? AND record_id=? ORDER BY version DESC LIMIT 50",
  )
    .bind(a.tenant_id, c.req.param("id"))
    .all<any>();
  return c.json({
    versions: rows.results.map((r) => ({ ...r, data: JSON.parse(r.data) })),
  });
});
app.get("/api/audit", async (c) => {
  const a = c.get("auth");
  allowed(a, "admin");
  const rows = await c.env.ERP_DB.prepare(
    "SELECT actor,action,entity,name,created_at FROM audit WHERE tenant_id=? ORDER BY created_at DESC,rowid DESC LIMIT 100",
  )
    .bind(a.tenant_id)
    .all();
  return c.json({ records: rows.results });
});
app.get("/api/members", async (c) => {
  const a = c.get("auth");
  allowed(a, "admin");
  const r = await c.env.ERP_DB.prepare(
    "SELECT u.id,u.name,u.email,m.role FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.tenant_id=?",
  )
    .bind(a.tenant_id)
    .all();
  const invitations = await c.env.ERP_DB.prepare(
    "SELECT id,email,role,expires_at FROM invitations WHERE tenant_id=? AND expires_at>?",
  )
    .bind(a.tenant_id, Date.now())
    .all();
  return c.json({ members: r.results, invitations: invitations.results });
});
app.post("/api/members/invite", async (c) => {
  const a = c.get("auth");
  allowed(a, "admin", true);
  const b = await body(c),
    email = text(b.email).toLowerCase(),
    role = text(b.role);
  if (
    !emailValid(email) ||
    !["admin", "hr", "finance", "operations", "sales", "viewer"].includes(role)
  )
    fail("Valid email and role required");
  if (a.role !== "owner" && role === "admin")
    fail("Only the owner can assign administrators", 403);
  const invite = id();
  await c.env.ERP_DB.batch([
    c.env.ERP_DB.prepare(
      "INSERT INTO invitations VALUES (?,?,?,?,?,?) ON CONFLICT(tenant_id,email) DO UPDATE SET id=excluded.id,role=excluded.role,expires_at=excluded.expires_at",
    ).bind(invite, a.tenant_id, email, role, Date.now() + 7 * 86400000, a.id),
    audit(c.env.ERP_DB, a, "created invitation", "admin", invite, email),
  ]);
  return c.json({ ok: true, inviteId: invite });
});
app.post("/api/invitations/accept", async (c) => {
  const a = c.get("auth"),
    b = await body(c);
  const inv = await c.env.ERP_DB.prepare(
    "SELECT * FROM invitations WHERE id=? AND email=? AND expires_at>?",
  )
    .bind(text(b.id), a.email, Date.now())
    .first<any>();
  if (!inv) fail("Invitation not found or expired", 404);
  await c.env.ERP_DB.batch([
    c.env.ERP_DB.prepare(
      "INSERT INTO memberships VALUES (?,?,?) ON CONFLICT DO NOTHING",
    ).bind(inv.tenant_id, a.id, inv.role),
    c.env.ERP_DB.prepare("DELETE FROM invitations WHERE id=?").bind(inv.id),
  ]);
  return c.json({ ok: true });
});
app.patch("/api/members/:id", async (c) => {
  const a = c.get("auth");
  if (a.role !== "owner")
    fail("Only the workspace owner can change roles", 403);
  const b = await body(c);
  if (
    c.req.param("id") === a.id ||
    !["admin", "hr", "finance", "operations", "sales", "viewer"].includes(
      b.role,
    )
  )
    fail("Invalid role change");
  await c.env.ERP_DB.batch([
    c.env.ERP_DB.prepare(
      "UPDATE memberships SET role=? WHERE tenant_id=? AND user_id=? AND role<>'owner'",
    ).bind(b.role, a.tenant_id, c.req.param("id")),
    audit(c.env.ERP_DB, a, "changed role", "admin", c.req.param("id"), b.role),
  ]);
  return c.json({ ok: true });
});
app.get("/api/overview", async (c) => {
  const a = c.get("auth"),
    db = c.env.ERP_DB,
    can = (m: string) => roleModules[a.role].includes(m);
  const visible = Object.keys(entities).filter((k) => can(entities[k].module));
  const stats = (
    await db
      .prepare(
        "SELECT entity,status,COUNT(*) n FROM records WHERE tenant_id=? AND archived=0 GROUP BY entity,status",
      )
      .bind(a.tenant_id)
      .all<any>()
  ).results.filter((r) => visible.includes(r.entity));
  const financial = can("finance")
    ? (
        await db
          .prepare(
            "SELECT substr(json_extract(data,'$.date'),1,7) month,json_extract(data,'$.type') type,SUM(json_extract(data,'$.amount')) amount FROM records WHERE tenant_id=? AND entity='transactions' AND status='Approved' AND archived=0 GROUP BY 1,2",
          )
          .bind(a.tenant_id)
          .all<any>()
      ).results
    : [];
  const monthMap = new Map<
    string,
    { month: string; income: number; expense: number }
  >();
  for (let i = 5; i >= 0; i--) {
    const dt = new Date();
    dt.setUTCMonth(dt.getUTCMonth() - i, 1);
    const key = dt.toISOString().slice(0, 7);
    monthMap.set(key, { month: key, income: 0, expense: 0 });
  }
  let income = 0,
    expense = 0;
  for (const item of financial) {
    if (!Number.isSafeInteger(item.amount))
      fail(
        "Financial totals exceed safe reporting limits. Export a narrower period.",
        422,
      );
    if (item.type === "Income") income += item.amount;
    else expense += item.amount;
    const month = monthMap.get(item.month);
    if (month) {
      if (item.type === "Income") month.income = item.amount / 100;
      else month.expense = item.amount / 100;
    }
  }
  if (!Number.isSafeInteger(income) || !Number.isSafeInteger(expense))
    fail("Financial totals exceed safe reporting limits.", 422);
  const projects = can("projects")
    ? (
        await db
          .prepare(
            "SELECT * FROM records WHERE tenant_id=? AND entity='projects' AND archived=0 ORDER BY updated_at DESC LIMIT 5",
          )
          .bind(a.tenant_id)
          .all<any>()
      ).results.map(view)
    : [];
  const taskProgress = can("projects")
    ? (
        await db
          .prepare(
            "SELECT json_extract(data,'$.project') project,COUNT(*) total,SUM(CASE WHEN status='Done' THEN 1 ELSE 0 END) done FROM records WHERE tenant_id=? AND entity='tasks' AND archived=0 GROUP BY 1",
          )
          .bind(a.tenant_id)
          .all<any>()
      ).results
    : [];
  for (const project of projects) {
    const p = taskProgress.find((t) => t.project === project.id);
    project.taskTotal = p?.total || 0;
    project.taskDone = p?.done || 0;
    project.progress = p?.total ? Math.round((p.done / p.total) * 100) : 0;
  }
  const tasks = can("projects")
    ? (
        await db
          .prepare(
            "SELECT * FROM records WHERE tenant_id=? AND entity='tasks' AND archived=0 AND status<>'Done' ORDER BY json_extract(data,'$.dueDate') ASC LIMIT 6",
          )
          .bind(a.tenant_id)
          .all<any>()
      ).results.map(view)
    : [];
  const activities = (
    await db
      .prepare(
        "SELECT actor,action,entity,name,created_at FROM audit WHERE tenant_id=? ORDER BY created_at DESC,rowid DESC LIMIT 15",
      )
      .bind(a.tenant_id)
      .all<any>()
  ).results
    .filter(
      (r) =>
        entities[r.entity] &&
        can(entities[r.entity].module) &&
        (r.entity !== "documents" || ["owner", "admin"].includes(a.role)),
    )
    .slice(0, 8);
  let departments: any[] = [];
  if (can("hr") && can("projects")) {
    departments = (
      await db
        .prepare(
          "SELECT d.id,d.name,(SELECT COUNT(*) FROM records e WHERE e.tenant_id=d.tenant_id AND e.entity='employees' AND e.archived=0 AND json_extract(e.data,'$.department')=d.id) employees,(SELECT COUNT(*) FROM records p WHERE p.tenant_id=d.tenant_id AND p.entity='projects' AND p.archived=0 AND json_extract(p.data,'$.department')=d.id) projects,(SELECT COUNT(*) FROM records task JOIN records p ON p.tenant_id=task.tenant_id AND p.id=json_extract(task.data,'$.project') WHERE task.tenant_id=d.tenant_id AND task.entity='tasks' AND task.archived=0 AND p.archived=0 AND json_extract(p.data,'$.department')=d.id) totalTasks,(SELECT COUNT(*) FROM records task JOIN records p ON p.tenant_id=task.tenant_id AND p.id=json_extract(task.data,'$.project') WHERE task.tenant_id=d.tenant_id AND task.entity='tasks' AND task.archived=0 AND task.status='Done' AND p.archived=0 AND json_extract(p.data,'$.department')=d.id) doneTasks FROM records d WHERE d.tenant_id=? AND d.entity='departments' AND d.archived=0 LIMIT 30",
        )
        .bind(a.tenant_id)
        .all<any>()
    ).results;
  }
  return c.json({
    counts: stats,
    income: income / 100,
    expense: expense / 100,
    trend: [...monthMap.values()],
    projects,
    tasks,
    activities,
    departments,
    financeVisible: can("finance"),
  });
});
app.get("/api/lookups", async (c) => {
  const a = c.get("auth");
  const refs = [
    ...new Set(
      Object.values(entities)
        .filter((e) => roleModules[a.role].includes(e.module))
        .flatMap((e) =>
          e.fields.filter((f) => f.type === "ref").map((f) => f.ref!),
        ),
    ),
  ];
  if (!refs.length) return c.json({ lookups: {} });
  const r = await c.env.ERP_DB.prepare(
    "SELECT id,entity,name FROM records WHERE tenant_id=? AND archived=0 AND entity IN (" +
      refs.map(() => "?").join(",") +
      ") ORDER BY name LIMIT 2000",
  )
    .bind(a.tenant_id, ...refs)
    .all<any>();
  const lookups: Record<string, any[]> = {};
  for (const row of r.results)
    (lookups[row.entity] ??= []).push({ id: row.id, name: row.name });
  return c.json({ lookups });
});
app.get("/api/search", async (c) => {
  const a = c.get("auth"),
    q = (c.req.query("q") || "").slice(0, 40);
  const available = Object.keys(entities).filter((k) =>
    roleModules[a.role].includes(entities[k].module),
  );
  if (!q) return c.json({ results: [] });
  const r = await c.env.ERP_DB.prepare(
    "SELECT id,entity,name,data FROM records WHERE tenant_id=? AND archived=0 AND entity IN (" +
      available.map(() => "?").join(",") +
      ") AND instr(lower(name),lower(?))>0 ORDER BY updated_at DESC LIMIT 100",
  )
    .bind(a.tenant_id, ...available, q)
    .all<any>();
  return c.json({
    results: r.results
      .filter(
        (r) => r.entity !== "documents" || docAllowed(a, JSON.parse(r.data)),
      )
      .map(({ data, ...r }) => r),
  });
});
app.get("/api/notifications", async (c) => {
  const a = c.get("auth");
  const visible = Object.keys(entities).filter((k) =>
    roleModules[a.role].includes(entities[k].module),
  );
  const r = await c.env.ERP_DB.prepare(
    "SELECT id,entity,name,status,data FROM records WHERE tenant_id=? AND archived=0 AND entity IN (" +
      visible.map(() => "?").join(",") +
      ") AND (status IN ('Pending','Overdue') OR (entity='tasks' AND status<>'Done' AND json_extract(data,'$.dueDate')<=date('now','+3 day')) OR (entity='leads' AND status NOT IN ('Won','Lost') AND json_extract(data,'$.followUp')<=date('now','+3 day')) OR (entity='announcements' AND status='Published' AND (json_extract(data,'$.expires') IS NULL OR json_extract(data,'$.expires')>=date('now')))) ORDER BY updated_at DESC LIMIT 30",
  )
    .bind(a.tenant_id, ...visible)
    .all<any>();
  return c.json({
    items: r.results.map((r) => ({
      id: r.id,
      name: r.name,
      entity: r.entity,
      module: entities[r.entity].module,
      status: r.status,
      date: JSON.parse(r.data).dueDate || JSON.parse(r.data).followUp || "",
    })),
  });
});
app.get("/api/health", (c) => c.json({ ok: true }));
app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));
export default app;
