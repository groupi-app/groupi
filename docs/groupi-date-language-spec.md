# Groupi Date Language (GDL) Specification — v1.0

A concise, expressive syntax for power users to specify complex date/time schedules with clarity and minimal typing.

---

## 1. Symbols

| Symbol | Meaning                                         | Precedence  |
| ------ | ----------------------------------------------- | ----------- |
| `()`   | Range: expand into every step between endpoints | 1 (highest) |
| `[]`   | List of discrete items                          | 1           |
| `*`    | Recurrence count (binds to adjacent item)       | 2           |
| `@`    | Attach time to a day or date                    | 3           |
| `-`    | Span: single event from start to end            | 4           |
| `^`    | Duration from start time                        | 4           |
| `"`    | Attach a note/label                             | 5           |
| `,`    | Separator within lists and ranges               | 6           |
| `+`    | Union: combine multiple independent entries     | 7 (lowest)  |
| `/`    | Date separator (month/day)                      | —           |

### Core Distinction: `[]` vs `()` vs `-`

These three constructs handle "multiple values" in fundamentally different ways:

| Syntax       | Name          | Meaning                          | Example         | Produces                               |
| ------------ | ------------- | -------------------------------- | --------------- | -------------------------------------- |
| `[a,b,c]`    | List          | Exactly these discrete items     | `Fr@[18,20,23]` | 6 PM, 8 PM, 11 PM (3 options)          |
| `(a,b)`      | Range         | Every step from a to b inclusive | `Fr@(18,23)`    | 6, 7, 8, 9, 10, 11 PM (6 options)      |
| `(a,b,step)` | Stepped Range | Every `step` from a to b         | `Fr@(18,22,2)`  | 6 PM, 8 PM, 10 PM (3 options)          |
| `a-b`        | Span          | Single event from a to b         | `Fr@18-23`      | 6 PM to 11 PM (1 option with end time) |

Ranges have **two or three** items: `(start, end)` or `(start, end, step)`. One item `(a)` or four+ items are syntax errors. Empty lists `[]` are a syntax error. Ranges decompose into lists before evaluation: `(18,23)` becomes `[18,19,20,21,22,23]`. If the step doesn't evenly divide the range, it stops before exceeding the endpoint: `(10,14,3)` → `[10,13]`.

**Step sizes:**

- Time ranges: 1 hour (e.g., `(18,23)` → 18, 19, 20, 21, 22, 23)
- Day abbreviation ranges: 1 day in Mo→Su order (e.g., `(Mo,Fr)` → Mo, Tu, We, Th, Fr)
- Day-of-month ranges: 1 calendar day (e.g., `(10,15)` → 10, 11, 12, 13, 14, 15)

**Day range wrapping:** If the end day precedes the start day in week order, the range wraps around: `(Fr,Tu)` → `[Fr,Sa,Su,Mo,Tu]`.

---

## 2. Day Abbreviations

Two-letter, case-insensitive. Day abbreviations must appear as complete tokens — not matched as substrings of longer words.

| Day       | Abbreviation |
| --------- | ------------ |
| Monday    | `Mo`         |
| Tuesday   | `Tu`         |
| Wednesday | `We`         |
| Thursday  | `Th`         |
| Friday    | `Fr`         |
| Saturday  | `Sa`         |
| Sunday    | `Su`         |

---

## 3. Time Syntax

### 3.1 Time Format

GDL uses **strict 24-hour time** by default. An optional `am`/`pm` suffix is accepted for convenience:

| Input     | Meaning             |
| --------- | ------------------- |
| `@0`      | 12:00 AM (midnight) |
| `@9`      | 9:00 AM             |
| `@9:30`   | 9:30 AM             |
| `@14`     | 2:00 PM             |
| `@18:30`  | 6:30 PM             |
| `@6pm`    | 6:00 PM             |
| `@9:30am` | 9:30 AM             |

Rules:

- Bare hours (0-23) are always 24-hour. `@6` = 6:00 AM, `@18` = 6:00 PM
- Minutes are specified with a colon: `@14:30` = 2:30 PM. Minutes work everywhere times are accepted (spans, lists, ranges, durations)
- `am`/`pm` suffix converts 12-hour to 24-hour: `@6pm` = `@18`
- Hour must be 0-23, minute must be 0-59. Values outside these ranges are syntax errors
- Note: the natural language parser (chrono-node) uses a separate PM heuristic for bare hours; GDL does not

### 3.2 Event Spans

Use `-` for a single event with a start and end time:

```
Fr@18-23       → Friday 6 PM to 11 PM (1 option with end time)
Sa@9-12        → Saturday 9 AM to 12 PM
Fr@18:30-21    → Friday 6:30 PM to 9:00 PM
Fr@6pm-11pm    → Friday 6 PM to 11 PM (am/pm suffix also works)
```

### 3.3 Cross-Midnight Spans

If the end time is less than the start time, the span rolls into the next day:

```
Fr@21-2        → Friday 9 PM to Saturday 2 AM (5 hours)
Sa@23-3        → Saturday 11 PM to Sunday 3 AM (4 hours)
```

`@0-0` (identical start and end) is a syntax error.

### 3.4 Duration

Use `^` as an alternative to spans. Duration always calculates the end time from the start:

```
Th@22^3h       → Thursday 10 PM for 3 hours (ends 1 AM Friday)
Tu@18^90m      → Tuesday 6 PM for 90 minutes (ends 7:30 PM)
Fr@21^5h       → Friday 9 PM for 5 hours (ends 2 AM Saturday)
```

Both `Fr@21-2` and `Fr@21^5h` produce the same result. Use whichever is clearer.

### 3.5 Span and Duration Are Mutually Exclusive

`-` and `^` cannot appear in the same time expression. `-` divides an expression into start and end subexpressions; `^` cannot appear within an end subexpression. Likewise, `-` cannot appear within a duration subexpression.

```
Fr@6-8^2h      → SYNTAX ERROR
Fr@6^2h-8      → SYNTAX ERROR
```

### 3.6 All-Day Events

Omitting the time component creates an all-day event:

```
Sa             → Saturday, all day
08/10          → August 10, all day
```

Day-level spans (`Sa-Su` without `@`) are not valid in v1. Use `[Sa,Su]` for both days all-day.

---

## 4. Date Syntax

### 4.1 Specific Dates

Format: `[MM/]DD[@time]`

- `MM/` is optional; defaults to current month
- A bare number before `@` is always a day-of-month
- Month is always required when specifying a month (no ambiguity)
- Dates resolve to the **next future occurrence**. If MM/DD has already passed this year, it resolves to next year
- `02/29` resolves to the next leap year

```
08/10@14-17    → August 10, 2 PM to 5 PM
10@6pm         → 10th of current month at 6 PM
08/03          → August 3, all day
```

### 4.2 Validation

- Month must be 1-12
- Day must be valid for the given month (1-28/29/30/31)
- Out-of-range values are syntax errors

### 4.3 Day-of-Month Lists and Ranges

Lists and ranges work with day-of-month numbers:

```
[10,15,20]@6pm      → 10th, 15th, 20th of current month at 6 PM (3 options)
(10,15)@6pm         → 10th through 15th at 6 PM (6 options)
(10,20,5)@18        → 10th, 15th, 20th at 6 PM (3 options, step 5)
08/[10,15,20]@14    → August 10, 15, 20 at 2 PM (3 options)
```

### 4.4 Mixed Day Types in Lists

Day abbreviations and specific dates can be mixed in lists:

```
[Mo,08/15,We]@18    → Monday, August 15, and Wednesday at 6 PM (3 options)
```

Recurrence `*` on a specific date inside a list is a syntax error (can only recur day-of-week patterns).

---

## 5. Day Patterns

### 5.1 Single Day with Time

```
Fr@14          → Friday at 2 PM
Tu@18-20       → Tuesday 6 PM to 8 PM (1 option with end time)
```

### 5.2 Day Lists

Use brackets to list specific days:

```
[Tu,Th]@18-20      → Tuesday 6-8 PM and Thursday 6-8 PM (2 options)
[Mo,We,Fr]@9        → Monday, Wednesday, Friday at 9 AM (3 options)
[Fr]@19             → Friday at 7 PM (singleton, same as Fr@19)
```

### 5.3 Day Ranges

Use parens to expand a range of consecutive days:

```
(Mo,Fr)@9-17       → Monday through Friday, 9 AM to 5 PM (5 options)
(Th,Su)@18         → Thursday through Sunday at 6 PM (4 options)
(Fr,Tu)@18         → Friday through Tuesday, wrapping: Fr, Sa, Su, Mo, Tu (5 options)
```

`(Mo,Fr)` expands to `[Mo,Tu,We,Th,Fr]` before evaluation.

### 5.4 Mixed Lists and Ranges

Ranges can be used inside lists:

```
[(Mo,Fr),Su]@9-17  → Weekdays + Sunday, 9-5 (6 options)
```

`(Mo,Fr)` expands to `Mo,Tu,We,Th,Fr` inside the list, producing `[Mo,Tu,We,Th,Fr,Su]`.

### 5.5 Recurrence

Use `*` to repeat a day for the next N occurrences. `*` binds to an individual day item:

```
Tu*3@14            → Next 3 Tuesdays at 2 PM (3 options)
Fr*2@18-20         → Next 2 Fridays, 6-8 PM (2 options)
```

Recurrence is anchored to the current date at parse time. If today is Tuesday, `Tu*3` includes today as the first occurrence.

To recur different days by different amounts, use `*` inside a list:

```
[Tu*2,Th*3]@14     → Next 2 Tuesdays + next 3 Thursdays at 2 PM (5 options)
[Tu,Th]*2@14       → Next 2 Tuesdays + next 2 Thursdays at 2 PM (4 options)
```

When `*` appears after a list (`[Tu,Th]*2`), it distributes to each item: equivalent to `[Tu*2,Th*2]`.

Recurrence also works with day ranges:

```
(Tu,Th)*2@14       → Expands to [Tu,We,Th], then *2 each = next 2 of each (6 options)
```

Rules:

- `*0` is a syntax error. Count must be ≥ 1
- `*1` is valid and equivalent to omitting `*`
- `*` cannot take a list or range as its count

---

## 6. Time Lists, Ranges, and Composition

### 6.1 Time Lists

Use brackets after `@` to offer multiple start-time options:

```
Fr@[18,19,20]          → Friday at 6 PM, 7 PM, 8 PM (3 options)
Sa@[10am,2pm,6pm]      → Saturday at 10 AM, 2 PM, 6 PM (3 options)
```

### 6.2 Time Ranges

Use parens after `@` to expand a range of start times:

```
Fr@(18,23)             → Friday at 6, 7, 8, 9, 10, 11 PM (6 options)
Fr@(18,22,2)           → Friday at 6, 8, 10 PM (3 options, step 2 hours)
```

`(18,23)` expands to `[18,19,20,21,22,23]` before evaluation. An optional third item sets the step size.

### 6.3 Span Lists

Use lists on either side of `-` to produce a cross-product of start × end times. Each combination produces one span:

```
Fr@[13,14]-[17,18]     → 1-5, 1-6, 2-5, 2-6 PM (4 span options)
Fr@15-[17,18]          → 3-5, 3-6 PM (2 span options)
Fr@[13-17,14-18]       → 1-5 or 2-6 PM (2 span options, items are complete spans)
```

### 6.4 Span with Ranges

Ranges expand to lists, then compose the same way:

```
Fr@(13,15)-(17,18)     → (13,15) → [13,14,15], (17,18) → [17,18]
                          1-5, 1-6, 2-5, 2-6, 3-5, 3-6 PM (6 span options)
```

### 6.5 Duration with Lists and Ranges

Duration `^` composes with time lists and ranges. Each start time gets the specified duration:

```
Fr@[18,19,20]^2h       → 6-8 PM, 7-9 PM, 8-10 PM (3 span options)
Fr@(18,20)^2h          → 6-8, 7-9, 8-10 PM (3 span options)
Fr@18^[2h,3h]          → 6-8 PM or 6-9 PM (2 span options)
Fr@7^(2h,4h)           → 7-9, 7-10, 7-11 AM (3 spans, duration range step 1h)
Fr@7^(2h,4h,2h)        → 7-9 or 7-11 AM (2 spans, duration range step 2h)
Fr@7^(30m,90m,30m)     → 7:00-7:30, 7:00-8:00, 7:00-8:30 (3 spans, step 30m)
```

### 6.6 Day × Time Composition

Day lists/ranges and time lists/ranges compose as a cross-product:

```
[Tu,Th]@[18,19,20]     → 2 days × 3 times = 6 options
(Mo,Fr)@(18,20)        → 5 days × 3 times = 15 options
[Tu,Th]@[13,14]-[17,18] → 2 days × 4 spans = 8 options
```

---

## 7. Combining Entries

Use `+` to take the union of multiple independent entries:

```
Tu*3@10 + Fr@18-20
```

This produces: next 3 Tuesdays at 10 AM, plus next Friday 6-8 PM.

```
08/10@14 + 08/12@18 + Fr@22^3h
```

This produces: Aug 10 at 2 PM, Aug 12 at 6 PM, Friday 10 PM for 3 hours.

### Duplicate Resolution

If two entries produce the same datetime, they are deduplicated. If one has a note and the other does not, the note is kept:

```
Fr@18 + Fr@18 "dinner"   → Friday at 6 PM, note: dinner (1 option, not 2)
```

If both have different notes, both notes are preserved (comma-joined).

### Parsing `+` and Notes

The `+` operator is not recognized inside quoted notes. The parser must consume the complete note (up to the closing `"`) before scanning for `+`:

```
Fr@18 "setup + cleanup" + Sa@10   → 2 entries (note contains literal "+")
```

---

## 8. Notes

Use quoted strings to attach a note to any entry. Notes distribute to all options produced by that entry:

```
Fr@18 "dinner"              → Friday 6 PM, note: dinner
08/10@14 "backup date"      → August 10 at 2 PM, note: backup date
[Fr,Sa]@18 "dinner"         → Friday at 6 PM (note: dinner) + Saturday at 6 PM (note: dinner)
```

Notes can be placed on individual items inside a list:

```
[Fr "dinner",Sa "brunch"]@18 → Friday at 6 PM (note: dinner) + Saturday at 6 PM (note: brunch)
```

### Note Placement

Notes may appear:

- After a complete entry: `Fr@18 "dinner"`
- On individual items within a list: `[Fr "dinner",Sa]@18`

Notes may **not** appear between a day and `@` outside of a list: `Fr "dinner" @18` is a syntax error.

### Quoting Rules

- Notes are delimited by `"` double quotes
- Notes cannot contain `"` characters (no escape mechanism in v1)
- An unclosed `"` is a syntax error

---

## 9. Parsing Rules

1. **GDL detection**: Input is treated as GDL if it contains `@`, `^`, or `*`. Day abbreviations alone do not trigger GDL detection (they are too common in English)
2. **Token boundaries**: Day abbreviations must be bounded by whitespace, start-of-input, or GDL operators — never matched as substrings of longer words
3. **Range validation**: `(a,b)` or `(a,b,step)` — 2 or 3 items. One item or four+ items are syntax errors. Empty lists `[]` are syntax errors
4. **Range expansion**: `(a,b)` expands to `[a, a+1, ..., b]` (step 1). `(a,b,step)` expands to `[a, a+step, a+2*step, ...]` up to b. Day ranges wrap around the week if end precedes start. If the step doesn't evenly divide the range, expansion stops before exceeding the endpoint
5. **Cross-product**: When lists or expanded ranges appear on both sides of an operator (`@`, `-`), all combinations are produced
6. **`-` and `^` are mutually exclusive**: A single time expression uses either a span or a duration, never both
7. **`*` binds to individual items**: `Tu*3` is valid. `[Tu,Th]*2` distributes: `[Tu*2,Th*2]`. `*` cannot take a list or range as its count. `*0` is a syntax error, `*1` is equivalent to omitting `*`
8. **Cross-midnight spans**: In `a-b` spans, if b < a the event rolls into the next day. `@X-X` (identical start/end) is a syntax error
9. **Bare numbers**: A bare number before `@` is a day-of-month. Month requires `MM/` prefix
10. **Date resolution**: Dates resolve to the next future occurrence. If MM/DD has passed this year, it resolves to next year. `02/29` resolves to the next leap year
11. **Recurrence anchor**: Recurrence is anchored to the current date at parse time. If today is the target day, today is the first occurrence
12. **Notes**: Notes distribute to all options an entry produces. Per-item notes override. `+` is not recognized inside quotes. Notes cannot contain `"`. Unclosed quotes are a syntax error
13. **Whitespace**: The parser is whitespace-tolerant within entries. Spaces around operators (`@`, `-`, `^`, `+`, `*`) are accepted and stripped
14. **Max dates**: A single GDL expression can produce at most 20 date options. If evaluation would exceed 20, the entire expression is rejected with an error showing the count. No partial results are returned
15. **Mixed lists**: Day abbreviations and specific dates (MM/DD) can be mixed in lists. `*` on a specific date is a syntax error

---

## 10. Quick Reference

| Input                     | Result                                               |
| ------------------------- | ---------------------------------------------------- |
| `Fr@19`                   | Friday at 7 PM (1 option)                            |
| `Tu@14-16`                | Tuesday 2-4 PM (1 span)                              |
| `Fr@21-2`                 | Friday 9 PM to Saturday 2 AM (1 cross-midnight span) |
| `Fr@[18,19,20]`           | Friday at 6, 7, 8 PM (3 options)                     |
| `Fr@(18,20)`              | Friday at 6, 7, 8 PM (3 options, range expanded)     |
| `Fr@(18,22,2)`            | Friday at 6, 8, 10 PM (3 options, step 2)            |
| `Fr@18-23`                | Friday 6-11 PM (1 span)                              |
| `Fr@[13,14]-[17,18]`      | Friday: 1-5, 1-6, 2-5, 2-6 PM (4 spans)              |
| `Fr@[13-17,14-18]`        | Friday: 1-5 or 2-6 PM (2 spans)                      |
| `Fr@[18,19,20]^2h`        | Friday: 6-8, 7-9, 8-10 PM (3 spans)                  |
| `Fr@18^[2h,3h]`           | Friday: 6-8 or 6-9 PM (2 spans)                      |
| `Fr@7^(2h,4h)`            | Friday: 7-9, 7-10, 7-11 AM (3 spans, dur range)      |
| `Fr@7^(2h,4h,2h)`         | Friday: 7-9 or 7-11 AM (2 spans, step 2h)            |
| `[Tu,Th]@6pm-8pm`         | Tue and Thu, 6-8 PM (2 spans)                        |
| `(Mo,Fr)@9-17`            | Mon through Fri, 9-5 (5 spans)                       |
| `(Fr,Tu)@18`              | Fri through Tue (wrapping), 6 PM (5 options)         |
| `[Tu,Th]@[18,19]`         | Tue at 6, 7 + Thu at 6, 7 (4 options)                |
| `Tu*3@14`                 | Next 3 Tuesdays at 2 PM (3 options)                  |
| `[Tu*2,Th*3]@14`          | Next 2 Tue + next 3 Thu at 2 PM (5 options)          |
| `Fr@22^4h`                | Friday 10 PM for 4 hours (1 span)                    |
| `08/10@14-17`             | August 10, 2-5 PM (1 span)                           |
| `(10,15)@6pm`             | 10th-15th of month at 6 PM (6 options)               |
| `(10,20,5)@18`            | 10th, 15th, 20th at 6 PM (3 options, step 5)         |
| `[Mo,08/15,We]@18`        | Mon, Aug 15, Wed at 6 PM (3 options)                 |
| `Tu*3@10 + Fr@18-20`      | Next 3 Tue at 10 AM + Fri 6-8 PM                     |
| `Sa`                      | Saturday, all day                                    |
| `Fr@19 "dinner"`          | Friday 7 PM, note: dinner                            |
| `[Fr "dinner",Sa]@18`     | Fri at 6 (dinner) + Sat at 6 (no note)               |
| `Fr@18 "setup + cleanup"` | Friday 6 PM, note: "setup + cleanup"                 |

---

## 11. Deferred Features (v2+)

These features are intentionally excluded from v1 to keep the parser simple and the syntax learnable:

| Feature                   | Syntax (proposed) | Reason for deferral                                 |
| ------------------------- | ----------------- | --------------------------------------------------- |
| Multi-month date lists    | `[06,07,08]/15`   | Niche; use `06/15 + 07/15 + 08/15` with `+` instead |
| Multi-month date ranges   | `(06,08)/15`      | Expands to 3 months × day; use `+` instead          |
| Date ranges across months | Undecided         | Generates too many dates for event polling          |
| Year prefix               | `2025/12/24`      | Events are almost always current year               |
| ISO dates                 | `2026-08-10@14`   | Conflicts with span `-` operator                    |
| Day-level spans           | `Sa-Su`           | Use `[Sa,Su]` for all-day list instead              |
| Note escaping             | `"say \"hello\""` | Notes cannot contain `"` in v1                      |
