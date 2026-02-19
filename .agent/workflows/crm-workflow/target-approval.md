---
description: Guide for developing and maintaining the Target Approval Module
---

# Target Approval Module Workflow

## Overview
The Target Approval module allows designated approvers to review and vote on executive targets before they are finalized.

## Database Schema

### Audit Trail Table
Created: 2026-02-17

```sql
CREATE TABLE target_setting_audit_trail (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    fiscal_period DATE NOT NULL,
    snapshot_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    trigger_event VARCHAR(50) NOT NULL COMMENT 'REJECTION, REOPEN_TO_DRAFT, APPROVAL, MANUAL',
    triggered_by_user_id CHAR(36) NULL,
    approval_status VARCHAR(20) NULL COMMENT 'APPROVED, REJECTED, PENDING, DRAFT',
    total_approvers INT NULL,
    approved_count INT NULL,
    rejected_count INT NULL,
    executive_data JSON NOT NULL,
    division_allocations JSON NULL,
    supplier_allocations JSON NULL,
    supervisor_allocations JSON NULL,
    salesman_allocations JSON NULL,
    approval_votes JSON NULL,
    notes TEXT NULL,
    date_created TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    date_updated TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_created CHAR(36) NULL,
    user_updated CHAR(36) NULL,
    INDEX idx_audit_trail_fiscal_period (fiscal_period),
    INDEX idx_audit_trail_timestamp (snapshot_timestamp DESC),
    INDEX idx_audit_trail_event (trigger_event),
    INDEX idx_audit_trail_status (approval_status),
    INDEX idx_audit_trail_period_event (fiscal_period, trigger_event)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Module Structure

```
src/modules/business-intelligence-analytics/target-setting/target-approval/
├── components/
│   ├── ApprovalActionCard.tsx       # Approve/Reject buttons
│   ├── PeriodSelectorCard.tsx       # Fiscal period selector
│   ├── TargetHealthMetrics.tsx      # Summary metrics
│   ├── TargetApprovalCharts.tsx     # Visual breakdowns
│   ├── TargetSankeyChart.tsx        # Interactive hierarchy flow
│   └── ReadonlyCompanyTargetCard.tsx
├── hooks/
│   └── useTargetApproval.ts         # Main data hook
├── providers/
│   └── fetchProvider.ts             # API calls
├── types.ts
├── index.ts
└── TargetApprovalModule.tsx         # Main component
```

## Key Features

### 1. Approval Workflow
- Approvers can vote APPROVE or REJECT
- Once approved, cannot reject (prevents vote changes)
- Rejection by any approver blocks approval
- Full approval requires all approvers to vote APPROVE

### 2. Audit Trail
- Captures complete snapshot before deletions
- Preserves hierarchy data (Executive → Salesman)
- Records all approval votes with voter details
- Triggered on: REJECTION, REOPEN_TO_DRAFT, APPROVAL

### 3. Interactive Sankey Chart
- Visualizes target flow through hierarchy
- Adaptive tooltip positioning (prevents overflow)
- Hover highlighting of connected paths
- Fullscreen mode support

## API Endpoints

### Get Approval Records
```
GET /api/bia/target-setting/target-approval?period=YYYY-MM-DD
```

### Submit Vote
```
POST /api/bia/target-setting/target-approval
Body: {
  target_record_id: string,
  target_period: string,
  approver_id: string,
  status: 'APPROVED' | 'REJECTED'
}
```

### Create Audit Snapshot
```
POST /api/bia/target-setting/audit-trail
Body: {
  fiscal_period: string,
  trigger_event: string,
  user_id: string
}
```

## Development Guidelines

### Adding New Features
1. Update types in `types.ts`
2. Add API calls to `fetchProvider.ts`
3. Create/update components as needed
4. Update hook if data flow changes
5. Test approval workflow thoroughly

### Testing Checklist
- [ ] Approver can approve target
- [ ] Approver cannot reject after approving
- [ ] Rejection blocks approval
- [ ] Audit trail created on reopen
- [ ] Sankey chart renders correctly
- [ ] Tooltips don't overflow viewport

## Common Issues

### Tooltip Overflow
**Solution**: Adaptive positioning implemented. Tooltip positions left of cursor when near right edge.

### Stale Approval Data
**Solution**: Approval records deleted when target reopens to DRAFT. Audit trail preserves history.

### Sankey Chart Depth Error
**Solution**: Empty state check prevents rendering with no data.
