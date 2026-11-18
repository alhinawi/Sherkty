import { entities } from "../src/schema";
export async function seed(db: D1Database, tid: string, uid: string) {
  const rows: { id: string; entity: string; status: string; data: any }[] = [];
  const add = (entity: string, data: any, status?: string) => {
    const id = crypto.randomUUID();
    rows.push({
      id,
      entity,
      status: status ?? entities[entity].states?.[0] ?? "",
      data,
    });
    return id;
  };
  const dep = add("departments", {
    name: "Design & Product",
    description: "Building thoughtful digital products",
    budget: 240000000,
  });
  const ops = add("departments", {
    name: "Operations",
    description: "Keeping every team moving",
    budget: 180000000,
  });
  const sales = add("departments", {
    name: "Sales & Growth",
    description: "Long-term customer relationships",
    budget: 120000000,
  });
  const role = add("positions", { name: "Product Designer", department: dep });
  const a = add("employees", {
    name: "Maya Hassan",
    email: "maya@example.invalid",
    department: dep,
    position: role,
    employment: "Full-time",
    startDate: "2026-02-01",
    location: "Cairo",
  });
  const b = add("employees", {
    name: "Omar Khaled",
    email: "omar@example.invalid",
    department: ops,
    employment: "Full-time",
    startDate: "2025-06-14",
    location: "Alexandria",
  });
  const d = add("employees", {
    name: "Lina Farouk",
    email: "lina@example.invalid",
    department: sales,
    employment: "Full-time",
    startDate: "2026-01-03",
    location: "Cairo",
  });
  for (const [name, department] of [
    ["Adam Nasser", dep],
    ["Salma Adel", dep],
    ["Youssef Ali", ops],
    ["Nour Ibrahim", sales],
    ["Karim Tarek", ops],
  ] as string[][])
    add("employees", {
      name,
      email: name.toLowerCase().replace(" ", ".") + "@example.invalid",
      department,
      employment: "Full-time",
      startDate: "2026-03-01",
      location: "Cairo",
    });
  const now = new Date(),
    iso = (days: number) =>
      new Date(now.getTime() + days * 86400000).toISOString().slice(0, 10);
  add(
    "attendance",
    { name: "Maya · " + iso(0), employee: a, date: iso(0), checkIn: "09:00" },
    "Present",
  );
  add("leave", {
    name: "Annual leave · Omar",
    employee: b,
    type: "Annual",
    startDate: iso(5),
    endDate: iso(8),
    reason: "Family time",
  });
  add("evaluations", {
    name: "Q3 review · Maya",
    employee: a,
    date: iso(-12),
    score: 94,
    notes: "Excellent cross-team collaboration.",
  });
  add(
    "contracts",
    {
      name: "Maya · Employment agreement",
      employee: a,
      startDate: "2026-02-01",
      terms: "Fictional demonstration contract.",
    },
    "Active",
  );
  add("salaries", {
    name: "Maya Hassan",
    employee: a,
    base: 2400000,
    bonus: 150000,
    deduction: 0,
    taxRate: 10,
    insuranceRate: 5,
  });
  add("salaries", {
    name: "Omar Khaled",
    employee: b,
    base: 2200000,
    bonus: 100000,
    deduction: 0,
    taxRate: 10,
    insuranceRate: 5,
  });
  const job = add("vacancies", {
    name: "Senior Product Designer",
    department: dep,
    location: "Cairo · Hybrid",
    salary: 3200000,
    description: "Help us make complex work feel simple.",
  });
  const candidate = add(
    "applicants",
    {
      name: "Sara Mahmoud",
      email: "sara@example.invalid",
      vacancy: job,
      notes: "Strong portfolio and systems thinking.",
    },
    "Interview",
  );
  add("interviews", {
    name: "Portfolio review · Sara",
    candidate,
    date: iso(2),
    time: "13:30",
    interviewer: "Maya Hassan",
  });
  const p1 = add(
    "projects",
    {
      name: "Website redesign",
      department: dep,
      manager: a,
      budget: 18500000,
      startDate: iso(-30),
      dueDate: iso(18),
      description: "A clearer digital experience for our customers.",
    },
    "Active",
  );
  const p2 = add(
    "projects",
    {
      name: "Regional expansion",
      department: sales,
      manager: d,
      budget: 42000000,
      startDate: iso(-20),
      dueDate: iso(45),
      description: "Launch our next chapter across the region.",
    },
    "Active",
  );
  const p3 = add(
    "projects",
    {
      name: "Operations playbook",
      department: ops,
      manager: b,
      budget: 7500000,
      startDate: iso(-12),
      dueDate: iso(28),
      description: "One source of truth for how we work.",
    },
    "Active",
  );
  add(
    "projects",
    {
      name: "Customer insights program",
      department: sales,
      manager: d,
      budget: 12000000,
      startDate: iso(-7),
      dueDate: iso(60),
    },
    "Planning",
  );
  add(
    "milestones",
    { name: "Design sign-off", project: p1, dueDate: iso(5) },
    "In progress",
  );
  add(
    "tasks",
    {
      name: "Review homepage wireframes",
      project: p1,
      assignee: a,
      priority: "High",
      dueDate: iso(0),
    },
    "In review",
  );
  add(
    "tasks",
    {
      name: "Finalize supplier shortlist",
      project: p2,
      assignee: d,
      priority: "Medium",
      dueDate: iso(1),
    },
    "In progress",
  );
  add(
    "tasks",
    {
      name: "Publish onboarding checklist",
      project: p3,
      assignee: b,
      priority: "High",
      dueDate: iso(2),
    },
    "To do",
  );
  add(
    "tasks",
    {
      name: "Update brand guidelines",
      project: p1,
      assignee: a,
      priority: "Medium",
      dueDate: iso(4),
    },
    "In progress",
  );
  for (let i = 0; i < 6; i++)
    add(
      "tasks",
      {
        name: [
          "Discovery interviews",
          "Content audit",
          "Research synthesis",
          "Team workshop",
          "Kickoff meeting",
          "Baseline metrics",
        ][i],
        project: [p1, p2, p3][i % 3],
        assignee: [a, b, d][i % 3],
        priority: "Medium",
        dueDate: iso(-10 + i),
      },
      "Done",
    );
  add("comments", {
    name: "Design review notes",
    project: p1,
    message:
      "The team agreed to simplify navigation and improve accessibility.",
  });
  const incomes = [580000, 640000, 610000, 790000, 825000, 912000],
    expenses = [370000, 410000, 385000, 460000, 492000, 521000];
  for (let i = 0; i < 6; i++) {
    const dt = new Date(now);
    dt.setUTCMonth(dt.getUTCMonth() - 5 + i, 10);
    const date = dt.toISOString().slice(0, 10);
    add(
      "transactions",
      {
        name: "Client services · " + date.slice(0, 7),
        type: "Income",
        amount: incomes[i] * 100,
        date,
        category: "Services",
        department: sales,
      },
      "Approved",
    );
    add(
      "transactions",
      {
        name: "Operations · " + date.slice(0, 7),
        type: "Expense",
        amount: expenses[i] * 100,
        date,
        category: "Operations",
        department: ops,
      },
      "Approved",
    );
  }
  add(
    "transactions",
    {
      name: "Team equipment",
      type: "Expense",
      amount: 2450000,
      date: iso(0),
      category: "Equipment",
      department: dep,
    },
    "Pending",
  );
  add(
    "invoices",
    {
      name: "INV-2026-048",
      type: "Receivable",
      counterparty: "Atlas Group",
      amount: 7800000,
      dueDate: iso(7),
    },
    "Issued",
  );
  add(
    "invoices",
    {
      name: "BILL-2026-019",
      type: "Payable",
      counterparty: "Cairo Office Supply",
      amount: 2450000,
      dueDate: iso(10),
    },
    "Issued",
  );
  add("budgets", {
    name: "Product · Q4",
    department: dep,
    amount: 60000000,
    startDate: "2026-10-01",
    endDate: "2026-12-31",
  });
  const warehouse = add("warehouses", {
    name: "Cairo main office",
    location: "New Cairo",
  });
  const product = add("products", {
    name: "27-inch monitor",
    sku: "MON-27-PRO",
    warehouse,
    reorderLevel: 5,
    unitCost: 850000,
    unit: "piece",
  });
  const product2 = add("products", {
    name: "Ergonomic office chair",
    sku: "CHR-ERG-01",
    warehouse,
    reorderLevel: 3,
    unitCost: 620000,
    unit: "piece",
  });
  add("movements", {
    name: "Opening stock · Monitors",
    product,
    type: "In",
    quantity: 18,
    date: iso(-15),
    reference: "DEMO-OPENING",
  });
  add("movements", {
    name: "Opening stock · Chairs",
    product: product2,
    type: "In",
    quantity: 8,
    date: iso(-15),
    reference: "DEMO-OPENING",
  });
  add("assets", {
    name: "MacBook Pro · Design team",
    serial: "DEMO-MBP-001",
    department: dep,
    cost: 12500000,
    salvage: 2500000,
    lifeMonths: 36,
    acquiredDate: "2026-01-01",
  });
  const vendor = add("vendors", {
    name: "Cairo Office Supply",
    email: "orders@example.invalid",
    phone: "+20 100 000 0000",
    address: "Cairo, Egypt",
  });
  const req = add("requests", {
    name: "Design team workstations",
    vendor,
    department: dep,
    amount: 3400000,
    reason: "Equipment for new team members",
  });
  add("orders", {
    name: "PO-2026-032",
    vendor,
    request: req,
    product,
    quantity: 4,
    amount: 3400000,
    dueDate: iso(7),
  });
  const customer = add("customers", {
    name: "Nadia Mostafa",
    company: "Atlas Group",
    email: "nadia@example.invalid",
    phone: "+20 100 000 0001",
    address: "Cairo",
  });
  add("customers", {
    name: "Ahmed Samir",
    company: "Horizon Labs",
    email: "ahmed@example.invalid",
  });
  add(
    "leads",
    {
      name: "Atlas · Annual partnership",
      customer,
      value: 68000000,
      owner: "Lina Farouk",
      followUp: iso(2),
    },
    "Negotiation",
  );
  add(
    "leads",
    {
      name: "Horizon · Product discovery",
      value: 14500000,
      owner: "Lina Farouk",
      followUp: iso(4),
    },
    "Qualified",
  );
  add("interactions", {
    name: "Atlas kickoff call",
    customer,
    type: "Call",
    date: iso(-2),
    notes: "Discussed timeline, outcomes and team structure.",
  });
  add(
    "documents",
    {
      name: "Team handbook",
      category: "Policy",
      access: "All members",
      content:
        "Welcome to Northstar Studio.\n\nWe work with care, communicate clearly and respect each other.\n\nThis is fictional demonstration content.",
    },
    "Published",
  );
  add(
    "announcements",
    {
      name: "A little space for big ideas",
      message:
        "Our monthly team gathering is this Thursday. Bring one idea that could make work better for everyone.",
      priority: "Normal",
      expires: iso(10),
    },
    "Published",
  );
  add("settings", {
    name: "Financial year starts",
    value: "January",
    description: "Used for planning and internal reporting.",
  });
  const statements: D1PreparedStatement[] = [];
  for (const r of rows) {
    statements.push(
      db
        .prepare(
          "INSERT INTO records(id,tenant_id,entity,name,status,data,created_by) VALUES (?,?,?,?,?,?,?)",
        )
        .bind(
          r.id,
          tid,
          r.entity,
          r.data.name,
          r.status,
          JSON.stringify(r.data),
          uid,
        ),
      db
        .prepare(
          "INSERT INTO versions(tenant_id,record_id,version,data) VALUES (?,?,1,?)",
        )
        .bind(tid, r.id, JSON.stringify({ ...r.data, status: r.status })),
    );
  }
  // Insert all records before links so every referenced parent exists.
  for (const r of rows)
    for (const f of entities[r.entity].fields)
      if (f.type === "ref" && r.data[f.key])
        statements.push(
          db
            .prepare("INSERT INTO record_links VALUES (?,?,?,?)")
            .bind(tid, r.id, f.key, r.data[f.key]),
        );
  statements.push(
    db.prepare("INSERT INTO stock_balances VALUES (?,?,18)").bind(tid, product),
    db.prepare("INSERT INTO stock_balances VALUES (?,?,8)").bind(tid, product2),
  );
  for (const r of rows.slice(-8))
    statements.push(
      db
        .prepare(
          "INSERT INTO audit(id,tenant_id,user_id,actor,action,entity,record_id,name) VALUES (?,?,?,?,?,?,?,?)",
        )
        .bind(
          crypto.randomUUID(),
          tid,
          uid,
          "Alex Morgan",
          "created",
          r.entity,
          r.id,
          r.data.name,
        ),
    );
  await db.batch(statements);
}
