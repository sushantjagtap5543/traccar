---
description: Full Rebuild & Setup Workflow
---

# 🚀 Full Project Rebuild & Setup

This workflow automates the process of setting up the **Traccar-Product (GeoSurePath)** platform for development and testing.

### **Step 1: Environment Sync**
Ensure the `.env` file is consistent across all services.
- `cp .env services/api-server/.env`

### **Step 2: Sync Backend Dependencies**
// turbo
- `cd services/api-server && npm install`

### **Step 3: Run Database Migrations**
// turbo
- `cd services/api-server && npm run migration:run`

### **Step 4: Build Backend (Optional)**
// turbo
- `cd services/api-server && npm run build`

### **Step 5: Frontend Dependency Check**
// turbo
- `cd frontend/client-dashboard && npm install`
// turbo
- `cd frontend/admin-dashboard && npm install`

---
*Created by Antigravity*
