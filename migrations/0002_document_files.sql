CREATE TABLE document_files (tenant_id TEXT NOT NULL,document_id TEXT NOT NULL,version INTEGER NOT NULL,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL CHECK(size<=524288),content BLOB NOT NULL,uploaded_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')),PRIMARY KEY(tenant_id,document_id,version),FOREIGN KEY(tenant_id,document_id) REFERENCES records(tenant_id,id) ON DELETE CASCADE);
CREATE UNIQUE INDEX salary_employee ON records(tenant_id,json_extract(data,'$.employee')) WHERE entity='salaries' AND archived=0;
CREATE INDEX task_project ON records(tenant_id,json_extract(data,'$.project'),status) WHERE entity='tasks' AND archived=0;
CREATE INDEX project_department ON records(tenant_id,json_extract(data,'$.department')) WHERE entity='projects' AND archived=0;
CREATE INDEX finance_month ON records(tenant_id,status,json_extract(data,'$.date')) WHERE entity='transactions' AND archived=0;
CREATE UNIQUE INDEX attendance_day ON records(tenant_id,json_extract(data,'$.employee'),json_extract(data,'$.date')) WHERE entity='attendance' AND archived=0;
