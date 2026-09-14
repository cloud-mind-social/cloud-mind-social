# Decisions Log

Append-only record of decisions made during this project and why — so
nobody re-litigates something that was already settled, and so the
reasoning isn't lost when it's not obvious from the repo alone.

Entry format:
```markdown
## YYYY-MM-DD — <short decision title>
**Why:** the reasoning
**Revisit when:** the condition under which this should be reconsidered (if any)
```

---

## 2026-09-13 — Tagline decision deferred
**Why:** Two candidates still under consideration ("We build the bridge
from unknown to impact." vs "From unknown to unforgettable."); visual
identity work depends on this being final.
**Revisit when:** Brand/strategy owner makes a call.

## 2026-09-14 — www/ folder placed off-limits to AI sessions by default
**Why:** This project's active work is Brand & Strategy; the website/admin
app involves live infrastructure (Cloudflare D1, email sending, secrets)
that shouldn't be touched incidentally by an AI working on marketing tasks.
**Revisit when:** The user explicitly reopens the Engineering track for a
specific session.
