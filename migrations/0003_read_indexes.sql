CREATE INDEX IF NOT EXISTS sherkty_memberships_user ON memberships(user_id,tenant_id);
CREATE INDEX IF NOT EXISTS sherkty_rate_limits_expiry ON rate_limits(expires_at);
CREATE INDEX IF NOT EXISTS sherkty_tenants_expiry ON tenants(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS sherkty_employee_department ON records(tenant_id,json_extract(data,'$.department')) WHERE entity='employees' AND archived=0;
CREATE INDEX IF NOT EXISTS sherkty_open_task_due ON records(tenant_id,json_extract(data,'$.dueDate')) WHERE entity='tasks' AND archived=0 AND status<>'Done';
