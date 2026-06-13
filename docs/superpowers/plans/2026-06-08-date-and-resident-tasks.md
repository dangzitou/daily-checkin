# Date And Resident Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the H5 check-in app so users can tap any calendar day to add one-off tasks for that date while keeping long-term resident tasks that appear every day.

**Architecture:** Extend the existing `Task` model with `scope` (`resident` or `dated`) and `scheduledDate`. Existing tasks become resident tasks. API list/checkin/calendar/stats accept explicit dates so the frontend can render today and any selected date from the same model.

**Tech Stack:** Vue 3 + Pinia + Vue Router, NestJS, Prisma/MySQL, Redis, Vitest, Playwright for final mobile verification.

---

### Task 1: Data Model And Date Semantics

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260608090000_task_scope_and_schedule/migration.sql`
- Modify: `apps/api/src/domain/dates.ts`
- Create: `apps/api/src/domain/task-visibility.ts`
- Test: `apps/api/src/domain/task-visibility.test.ts`

- [ ] Add task scope and scheduled date fields. Existing rows migrate to `resident`; dated rows require `scheduled_date`.
- [ ] Add `isTaskVisibleOnDate()` tests for resident tasks, dated tasks, inactive tasks, and mismatched dates.
- [ ] Implement visibility helper and date validation.
- [ ] Run `pnpm --filter @daily-checkin/api test:run src/domain/task-visibility.test.ts`.

### Task 2: API Date-Aware Task Lists And Checkins

**Files:**
- Modify: `apps/api/src/modules/tasks/tasks.dto.ts`
- Modify: `apps/api/src/modules/tasks/tasks.controller.ts`
- Modify: `apps/api/src/modules/tasks/tasks.service.ts`
- Modify: `apps/api/src/modules/checkins/checkins.controller.ts`
- Modify: `apps/api/src/modules/checkins/checkins.service.ts`
- Modify: `apps/api/src/modules/stats/stats.service.ts`
- Test: `apps/api/src/modules/tasks/tasks.service.test.ts`

- [ ] Add tests proving `list(userId, date)` returns active resident tasks plus active dated tasks for that exact date, with `checked` for that date.
- [ ] Add DTO validation for `scope: resident|dated`, optional `scheduledDate`, and date query strings.
- [ ] Update create/list/update/deactivate to preserve ownership and scope rules.
- [ ] Update checkins to support `/tasks/:id/checkins?date=YYYY-MM-DD` and keep today endpoints as compatibility wrappers.
- [ ] Update calendar and streak stats to count only tasks visible on each date.
- [ ] Run targeted API tests.

### Task 3: Frontend Date Selection And Daily Detail

**Files:**
- Modify: `apps/web/src/types.ts`
- Modify: `apps/web/src/api.ts` if needed
- Modify: `apps/web/src/views/TodayView.vue`
- Modify: `apps/web/src/views/CalendarView.vue`
- Modify: `apps/web/src/views/TasksView.vue`
- Modify: `apps/web/src/components/TaskRow.vue`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/src/lib/progress.test.ts`

- [ ] Today page loads `/tasks?date=today` and toggles `/tasks/:id/checkins?date=today`.
- [ ] Calendar cells become tappable. Tapping a date opens a selected-day panel with progress, date tasks, resident tasks, add dated task form, and toggle buttons.
- [ ] Task management page becomes resident task management.
- [ ] Preserve iPhone-friendly dimensions, bottom nav, no nested cards, no text overflow.
- [ ] Run web tests and build.

### Task 4: Deploy And Verify Public Flow

**Files:**
- Modify: `README.md`
- Runtime: `/etc/daily-checkin.env`, systemd services, MySQL migration

- [ ] Run full test suite and build.
- [ ] Run Prisma migration deploy and restart `daily-checkin-api` and `daily-checkin-public`.
- [ ] Verify `http://42.194.251.188/`, `/api/health`, resident task flow, dated calendar task flow, and public iPhone viewport flow.
