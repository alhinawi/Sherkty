export type Field = {
  key: string;
  en: string;
  ar: string;
  type?:
    | "text"
    | "number"
    | "money"
    | "date"
    | "email"
    | "textarea"
    | "select"
    | "ref";
  required?: boolean;
  options?: string[];
  ref?: string;
  min?: number;
  max?: number;
  step?: number;
};
export type Entity = {
  en: string;
  ar: string;
  singular: string;
  module: string;
  fields: Field[];
  states?: string[];
  transitions?: Record<string, string[]>;
};
const f = (
  key: string,
  en: string,
  ar: string,
  type: Field["type"] = "text",
  extra: Partial<Field> = {},
): Field => ({ key, en, ar, type, ...extra });
const name = f("name", "Name", "الاسم", "text", { required: true });
const ref = (
  key: string,
  en: string,
  ar: string,
  entity: string,
  required = false,
) => f(key, en, ar, "ref", { ref: entity, required });
const money = (key: string, en: string, ar: string, required = false) =>
  f(key, en, ar, "money", { min: 0, max: 100000000000, required });
const date = (key: string, en: string, ar: string, required = false) =>
  f(key, en, ar, "date", { required });
const select = (key: string, en: string, ar: string, options: string[]) =>
  f(key, en, ar, "select", { options });
export const modules = [
  { id: "dashboard", en: "Overview", ar: "نظرة عامة", group: "WORKSPACE" },
  { id: "hr", en: "People & HR", ar: "الموظفين", group: "WORKSPACE" },
  { id: "payroll", en: "Payroll", ar: "المرتبات", group: "WORKSPACE" },
  { id: "recruitment", en: "Recruitment", ar: "التوظيف", group: "WORKSPACE" },
  { id: "finance", en: "Finance", ar: "الحسابات", group: "OPERATIONS" },
  { id: "projects", en: "Projects", ar: "المشاريع", group: "OPERATIONS" },
  {
    id: "inventory",
    en: "Inventory & assets",
    ar: "المخزون والأصول",
    group: "OPERATIONS",
  },
  {
    id: "procurement",
    en: "Procurement",
    ar: "المشتريات",
    group: "OPERATIONS",
  },
  {
    id: "crm",
    en: "Customers & sales",
    ar: "العملاء والمبيعات",
    group: "OPERATIONS",
  },
  { id: "documents", en: "Documents", ar: "المستندات", group: "ORGANIZATION" },
  {
    id: "communication",
    en: "Announcements",
    ar: "الإعلانات",
    group: "ORGANIZATION",
  },
  {
    id: "reports",
    en: "Reports & analytics",
    ar: "التقارير",
    group: "ORGANIZATION",
  },
  { id: "admin", en: "Administration", ar: "الإدارة", group: "ORGANIZATION" },
];
export const entities: Record<string, Entity> = {
  departments: {
    en: "Departments",
    ar: "الأقسام",
    singular: "department",
    module: "hr",
    fields: [
      name,
      f("description", "Description", "الوصف", "textarea"),
      money("budget", "Annual budget", "الميزانية السنوية"),
    ],
  },
  positions: {
    en: "Positions",
    ar: "الوظايف",
    singular: "position",
    module: "hr",
    fields: [
      name,
      ref("department", "Department", "القسم", "departments"),
      f("description", "Description", "الوصف", "textarea"),
    ],
  },
  employees: {
    en: "Employees",
    ar: "الموظفين",
    singular: "employee",
    module: "hr",
    states: ["Active", "On leave", "Inactive"],
    fields: [
      name,
      f("email", "Work email", "إيميل الشغل", "email", { required: true }),
      f("phone", "Phone", "التليفون"),
      ref("department", "Department", "القسم", "departments"),
      ref("position", "Position", "الوظيفة", "positions"),
      date("startDate", "Start date", "تاريخ البداية"),
      select("employment", "Employment", "نوع التعيين", [
        "Full-time",
        "Part-time",
        "Contract",
      ]),
      f("location", "Location", "المكان"),
    ],
  },
  contracts: {
    en: "Contracts",
    ar: "العقود",
    singular: "contract",
    module: "hr",
    states: ["Draft", "Active", "Expired"],
    fields: [
      name,
      ref("employee", "Employee", "الموظف", "employees", true),
      date("startDate", "Start date", "بداية العقد", true),
      date("endDate", "End date", "نهاية العقد"),
      f("terms", "Terms", "البنود", "textarea"),
    ],
  },
  attendance: {
    en: "Attendance",
    ar: "الحضور",
    singular: "attendance record",
    module: "hr",
    states: ["Present", "Absent", "Late", "Remote"],
    fields: [
      name,
      ref("employee", "Employee", "الموظف", "employees", true),
      date("date", "Date", "التاريخ", true),
      f("checkIn", "Check in (HH:MM)", "ميعاد الحضور"),
      f("checkOut", "Check out (HH:MM)", "ميعاد الانصراف"),
    ],
  },
  leave: {
    en: "Leave requests",
    ar: "طلبات الإجازة",
    singular: "leave request",
    module: "hr",
    states: ["Pending", "Approved", "Rejected"],
    transitions: { Pending: ["Approved", "Rejected"] },
    fields: [
      name,
      ref("employee", "Employee", "الموظف", "employees", true),
      select("type", "Leave type", "نوع الإجازة", [
        "Annual",
        "Sick",
        "Unpaid",
        "Other",
      ]),
      date("startDate", "From", "من", true),
      date("endDate", "Until", "لحد", true),
      f("reason", "Reason", "السبب", "textarea"),
    ],
  },
  evaluations: {
    en: "Evaluations",
    ar: "التقييمات",
    singular: "evaluation",
    module: "hr",
    fields: [
      name,
      ref("employee", "Employee", "الموظف", "employees", true),
      date("date", "Review date", "تاريخ التقييم"),
      f("score", "Score / 100", "التقييم من 100", "number", {
        min: 0,
        max: 100,
        step: 0.01,
      }),
      f("notes", "Feedback", "الملاحظات", "textarea"),
    ],
  },
  salaries: {
    en: "Salary structures",
    ar: "تفاصيل المرتبات",
    singular: "salary structure",
    module: "payroll",
    fields: [
      name,
      ref("employee", "Employee", "الموظف", "employees", true),
      money("base", "Monthly base", "الأساسي الشهري", true),
      money("bonus", "Bonus", "المكافأة"),
      money("deduction", "Deduction", "الخصم"),
      f(
        "taxRate",
        "Tax % (configured, not statutory)",
        "نسبة الضريبة المحددة",
        "number",
        { min: 0, max: 100, step: 0.01 },
      ),
      f("insuranceRate", "Insurance %", "نسبة التأمين", "number", {
        min: 0,
        max: 100,
        step: 0.01,
      }),
    ],
  },
  payslips: {
    en: "Payslips",
    ar: "قسائم المرتبات",
    singular: "payslip",
    module: "payroll",
    states: ["Processed", "Paid"],
    transitions: { Processed: ["Paid"] },
    fields: [
      name,
      ref("employee", "Employee", "الموظف", "employees", true),
      f("period", "Period (YYYY-MM)", "الشهر"),
      money("base", "Base", "الأساسي"),
      money("bonus", "Bonus", "المكافأة"),
      money("deduction", "Deduction", "الخصم"),
      money("tax", "Tax", "الضريبة"),
      money("insurance", "Insurance", "التأمين"),
      money("net", "Net pay", "الصافي"),
    ],
  },
  vacancies: {
    en: "Vacancies",
    ar: "الوظايف المفتوحة",
    singular: "vacancy",
    module: "recruitment",
    states: ["Open", "Closed"],
    fields: [
      name,
      ref("department", "Department", "القسم", "departments"),
      f("location", "Location", "المكان"),
      money("salary", "Budget", "الميزانية"),
      f("description", "Description", "الوصف", "textarea"),
    ],
  },
  applicants: {
    en: "Candidates",
    ar: "المتقدمين",
    singular: "candidate",
    module: "recruitment",
    states: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"],
    transitions: {
      Applied: ["Screening", "Rejected"],
      Screening: ["Interview", "Rejected"],
      Interview: ["Offer", "Rejected"],
      Offer: ["Hired", "Rejected"],
    },
    fields: [
      name,
      f("email", "Email", "الإيميل", "email", { required: true }),
      ref("vacancy", "Vacancy", "الوظيفة", "vacancies"),
      f("phone", "Phone", "التليفون"),
      f("notes", "Notes", "الملاحظات", "textarea"),
    ],
  },
  interviews: {
    en: "Interviews",
    ar: "الإنترفيوهات",
    singular: "interview",
    module: "recruitment",
    states: ["Scheduled", "Completed", "Cancelled"],
    fields: [
      name,
      ref("candidate", "Candidate", "المتقدم", "applicants", true),
      date("date", "Date", "التاريخ", true),
      f("time", "Time (HH:MM)", "الميعاد"),
      f("interviewer", "Interviewer", "المسؤول"),
      f("feedback", "Feedback", "الملاحظات", "textarea"),
    ],
  },
  transactions: {
    en: "Transactions",
    ar: "الحركات المالية",
    singular: "transaction",
    module: "finance",
    states: ["Pending", "Approved", "Rejected"],
    transitions: { Pending: ["Approved", "Rejected"] },
    fields: [
      name,
      select("type", "Type", "النوع", ["Income", "Expense"]),
      money("amount", "Amount", "المبلغ", true),
      date("date", "Date", "التاريخ", true),
      f("category", "Category", "التصنيف"),
      ref("department", "Department", "القسم", "departments"),
      f("reference", "Reference", "المرجع"),
      f("notes", "Notes", "الملاحظات", "textarea"),
    ],
  },
  invoices: {
    en: "Payables & receivables",
    ar: "المستحقات والفواتير",
    singular: "invoice",
    module: "finance",
    states: ["Draft", "Issued", "Paid", "Overdue", "Cancelled"],
    transitions: {
      Draft: ["Issued", "Cancelled"],
      Issued: ["Paid", "Overdue", "Cancelled"],
      Overdue: ["Paid", "Cancelled"],
    },
    fields: [
      name,
      select("type", "Type", "النوع", ["Receivable", "Payable"]),
      f("counterparty", "Customer / supplier", "العميل أو المورد"),
      money("amount", "Amount", "المبلغ", true),
      date("dueDate", "Due date", "آخر ميعاد للسداد", true),
      f("notes", "Notes", "الملاحظات", "textarea"),
    ],
  },
  budgets: {
    en: "Budgets",
    ar: "الميزانيات",
    singular: "budget",
    module: "finance",
    fields: [
      name,
      ref("department", "Department", "القسم", "departments"),
      money("amount", "Budget", "الميزانية", true),
      date("startDate", "From", "من"),
      date("endDate", "Until", "لحد"),
    ],
  },
  projects: {
    en: "Projects",
    ar: "المشاريع",
    singular: "project",
    module: "projects",
    states: ["Planning", "Active", "On hold", "Completed", "Cancelled"],
    fields: [
      name,
      ref("manager", "Manager", "المسؤول", "employees"),
      ref("department", "Department", "القسم", "departments"),
      money("budget", "Budget", "الميزانية"),
      date("startDate", "Start date", "البداية"),
      date("dueDate", "Deadline", "آخر ميعاد"),
      f("description", "Description", "الوصف", "textarea"),
    ],
  },
  milestones: {
    en: "Milestones",
    ar: "مراحل المشروع",
    singular: "milestone",
    module: "projects",
    states: ["Planned", "In progress", "Completed"],
    fields: [
      name,
      ref("project", "Project", "المشروع", "projects", true),
      date("dueDate", "Deadline", "آخر ميعاد"),
    ],
  },
  tasks: {
    en: "Tasks",
    ar: "المهام",
    singular: "task",
    module: "projects",
    states: ["To do", "In progress", "In review", "Done"],
    fields: [
      name,
      ref("project", "Project", "المشروع", "projects"),
      ref("assignee", "Assignee", "المسؤول", "employees"),
      select("priority", "Priority", "الأولوية", [
        "Low",
        "Medium",
        "High",
        "Urgent",
      ]),
      date("dueDate", "Due date", "آخر ميعاد"),
      f("description", "Description", "الوصف", "textarea"),
    ],
  },
  comments: {
    en: "Team notes",
    ar: "ملاحظات الفريق",
    singular: "note",
    module: "projects",
    fields: [
      name,
      ref("project", "Project", "المشروع", "projects", true),
      f("message", "Message", "الرسالة", "textarea", { required: true }),
    ],
  },
  warehouses: {
    en: "Warehouses",
    ar: "المخازن",
    singular: "warehouse",
    module: "inventory",
    fields: [name, f("location", "Location", "المكان")],
  },
  products: {
    en: "Products",
    ar: "المنتجات",
    singular: "product",
    module: "inventory",
    fields: [
      name,
      f("sku", "SKU", "كود المنتج"),
      ref("warehouse", "Warehouse", "المخزن", "warehouses"),
      f("reorderLevel", "Reorder level", "حد إعادة الطلب", "number", {
        min: 0,
      }),
      money("unitCost", "Unit cost", "تكلفة الوحدة"),
      f("unit", "Unit", "الوحدة"),
    ],
  },
  movements: {
    en: "Stock movements",
    ar: "حركات المخزون",
    singular: "stock movement",
    module: "inventory",
    fields: [
      name,
      ref("product", "Product", "المنتج", "products", true),
      select("type", "Direction", "الاتجاه", ["In", "Out"]),
      f("quantity", "Quantity", "الكمية", "number", {
        required: true,
        min: 1,
        max: 1000000,
      }),
      date("date", "Date", "التاريخ", true),
      f("reference", "Reference", "المرجع"),
    ],
  },
  assets: {
    en: "Fixed assets",
    ar: "الأصول الثابتة",
    singular: "asset",
    module: "inventory",
    states: ["In service", "Maintenance", "Retired"],
    fields: [
      name,
      f("serial", "Serial number", "السيريال"),
      ref("department", "Department", "القسم", "departments"),
      money("cost", "Acquisition cost", "تكلفة الشراء", true),
      money("salvage", "Residual value", "القيمة المتبقية"),
      f("lifeMonths", "Useful life (months)", "العمر بالشهور", "number", {
        min: 1,
        max: 1200,
        required: true,
      }),
      date("acquiredDate", "Acquired date", "تاريخ الشراء", true),
    ],
  },
  vendors: {
    en: "Vendors",
    ar: "الموردين",
    singular: "vendor",
    module: "procurement",
    fields: [
      name,
      f("email", "Email", "الإيميل", "email"),
      f("phone", "Phone", "التليفون"),
      f("address", "Address", "العنوان"),
      f("notes", "Notes", "الملاحظات", "textarea"),
    ],
  },
  requests: {
    en: "Purchase requests",
    ar: "طلبات الشراء",
    singular: "purchase request",
    module: "procurement",
    states: ["Pending", "Approved", "Rejected", "Ordered"],
    transitions: { Pending: ["Approved", "Rejected"], Approved: ["Ordered"] },
    fields: [
      name,
      ref("vendor", "Vendor", "المورد", "vendors"),
      ref("department", "Department", "القسم", "departments"),
      money("amount", "Estimated cost", "التكلفة المتوقعة", true),
      f("reason", "Business reason", "سبب الطلب", "textarea", {
        required: true,
      }),
    ],
  },
  orders: {
    en: "Purchase orders",
    ar: "أوامر الشراء",
    singular: "purchase order",
    module: "procurement",
    states: ["Draft", "Approved", "Received", "Cancelled"],
    transitions: {
      Draft: ["Approved", "Cancelled"],
      Approved: ["Received", "Cancelled"],
    },
    fields: [
      name,
      ref("vendor", "Vendor", "المورد", "vendors", true),
      ref("request", "Purchase request", "طلب الشراء", "requests"),
      ref("product", "Product", "المنتج", "products"),
      f("quantity", "Quantity", "الكمية", "number", { min: 1, max: 1000000 }),
      money("amount", "Total amount", "المبلغ الإجمالي", true),
      date("dueDate", "Expected delivery", "ميعاد التسليم"),
    ],
  },
  customers: {
    en: "Customers",
    ar: "العملاء",
    singular: "customer",
    module: "crm",
    fields: [
      name,
      f("company", "Company", "الشركة"),
      f("email", "Email", "الإيميل", "email"),
      f("phone", "Phone", "التليفون"),
      f("address", "Address", "العنوان"),
    ],
  },
  leads: {
    en: "Leads & opportunities",
    ar: "فرص البيع",
    singular: "opportunity",
    module: "crm",
    states: ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
    fields: [
      name,
      ref("customer", "Customer", "العميل", "customers"),
      money("value", "Deal value", "قيمة الصفقة"),
      f("owner", "Owner", "المسؤول"),
      date("followUp", "Follow-up date", "ميعاد المتابعة"),
      f("notes", "Notes", "الملاحظات", "textarea"),
    ],
  },
  interactions: {
    en: "Interactions",
    ar: "التواصل مع العملاء",
    singular: "interaction",
    module: "crm",
    fields: [
      name,
      ref("customer", "Customer", "العميل", "customers", true),
      select("type", "Channel", "وسيلة التواصل", [
        "Call",
        "Email",
        "Meeting",
        "Message",
      ]),
      date("date", "Date", "التاريخ", true),
      f("notes", "Notes", "الملاحظات", "textarea", { required: true }),
    ],
  },
  documents: {
    en: "Documents",
    ar: "المستندات",
    singular: "document",
    module: "documents",
    states: ["Draft", "Published", "Archived"],
    fields: [
      name,
      select("category", "Category", "التصنيف", [
        "Company",
        "Contract",
        "Policy",
        "Employee",
        "Other",
      ]),
      select("access", "Access", "الصلاحية", [
        "All members",
        "HR only",
        "Finance only",
        "Administrators",
      ]),
      ref("employee", "Employee", "الموظف", "employees"),
      f("content", "Document text", "محتوى المستند", "textarea", {
        required: true,
      }),
    ],
  },
  announcements: {
    en: "Announcements",
    ar: "الإعلانات",
    singular: "announcement",
    module: "communication",
    states: ["Published", "Draft"],
    fields: [
      name,
      f("message", "Message", "الرسالة", "textarea", { required: true }),
      select("priority", "Priority", "الأولوية", [
        "Normal",
        "Important",
        "Urgent",
      ]),
      date("expires", "Expires", "ينتهي يوم"),
    ],
  },
  workflows: {
    en: "Approval policies",
    ar: "سياسات الموافقة",
    singular: "approval policy",
    module: "admin",
    fields: [
      name,
      select("entity", "Applies to", "بتطبق على", [
        "leave",
        "transactions",
        "requests",
        "orders",
      ]),
      money("threshold", "Approval threshold", "حد الموافقة"),
      select("approver", "Approver role", "دور المسؤول", [
        "owner",
        "admin",
        "hr",
        "finance",
        "operations",
      ]),
    ],
  },
  settings: {
    en: "Company settings",
    ar: "إعدادات الشركة",
    singular: "setting",
    module: "admin",
    fields: [
      name,
      f("value", "Value", "القيمة"),
      f("description", "Description", "الوصف", "textarea"),
    ],
  },
};
// All money is stored as integer minor units. API forms accept major units.
export const roleModules: Record<string, string[]> = {
  owner: modules.map((m) => m.id),
  admin: modules.map((m) => m.id),
  hr: [
    "dashboard",
    "hr",
    "payroll",
    "recruitment",
    "documents",
    "communication",
    "reports",
  ],
  finance: [
    "dashboard",
    "finance",
    "payroll",
    "documents",
    "communication",
    "reports",
  ],
  operations: [
    "dashboard",
    "projects",
    "inventory",
    "procurement",
    "documents",
    "communication",
    "reports",
  ],
  sales: ["dashboard", "crm", "documents", "communication", "reports"],
  viewer: ["dashboard", "projects", "crm", "communication", "reports"],
};
export const label = (f: { en: string; ar: string }, lang: string) =>
  lang === "ar" ? f.ar : f.en;

export const defaultLanguage = (
  country: string | undefined,
  browser: string,
) => (country === "EG" || /^ar(?:-|,|;|$)/i.test(browser) ? "ar" : "en");
