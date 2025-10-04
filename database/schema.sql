-- ExpenseFlow Database Schema

-- Enable UUID extension (optional, for better IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies Table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Categories
CREATE TABLE expense_categories (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES expense_categories(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    converted_amount DECIMAL(12, 2),
    description TEXT,
    expense_date DATE NOT NULL,
    receipt_url VARCHAR(500),
    merchant_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_review')),
    current_approver_id INTEGER REFERENCES users(id),
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval Rules Table
CREATE TABLE approval_rules (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('sequential', 'percentage', 'specific_approver', 'hybrid')),
    is_manager_first BOOLEAN DEFAULT true,
    percentage_threshold INTEGER,
    specific_approver_id INTEGER REFERENCES users(id),
    min_amount DECIMAL(12, 2),
    max_amount DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval Steps (for sequential approval)
CREATE TABLE approval_steps (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES approval_rules(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    approver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_required VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rule_id, step_order)
);

-- Approval History
CREATE TABLE approval_history (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
    approver_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('approved', 'rejected', 'pending', 'escalated')),
    comments TEXT,
    step_order INTEGER,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Line Items (for OCR-parsed receipts)
CREATE TABLE expense_line_items (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
    description VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2),
    line_total DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_expenses_employee ON expenses(employee_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX idx_expenses_company ON expenses(company_id);
CREATE INDEX idx_approval_history_expense ON approval_history(expense_id);
CREATE INDEX idx_approval_steps_rule ON approval_steps(rule_id);

-- Create Function to Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_rules_updated_at BEFORE UPDATE ON approval_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();