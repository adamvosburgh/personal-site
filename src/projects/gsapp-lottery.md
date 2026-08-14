---
title: "GSAPP Lottery"
shortDescription: "A faculty–student assignment tool that shows the trade-offs behind each result instead of producing one answer."
date: 2026-07-01
team: ["Adam Vosburgh"]
tags: ["projects"]
images:
  - "/images/lottery/lottery-1.jpg"
display:
  coverImage: "/images/lottery/lottery.mp4"
  slideshowImages:
  showInSlideshow: false
layout: "item.njk"
size: 1
link: https://lottery.adamvosburgh.com
linkExternal: true
---

Assigns students to studios and thesis advisors at GSAPP. Around 240 students and 20–30 faculty pass through it each semester. It replaced a manual process that student council had been running for years.

The design premise is that the lottery should not hand back a single result. Every assignment algorithm optimizes for something different, and those differences are real trade-offs that someone should be looking at. So the app runs three — water-filling, deferred acceptance, and minimum regret — and returns all three side by side, along with what each one is good at: lowest average placement, highest share of first choices, lowest worst-case placement. Student council takes those results and builds on them, rather than defending a number the machine produced.

Each algorithm runs ten times, with shuffled input order after the first pass so that the order rows happen to sit in a spreadsheet cannot silently decide a tie. A deterministic pass at the end pulls students out of over-enrolled studios into any that sit below their minimum. The winning assignments are then validated against the stated constraints, and violations are reported rather than hidden.

Three modes: the architecture studio lottery, the Core III partner lottery — where a ballot is a pair of students sharing one set of rankings, placed together and counted as two seats — and the CDP advisor lottery. Faculty constraints arrive as free text ("must have 0 or 2", "minimum 4 students") and are parsed into structured rules by a local or hosted LLM. Names are pseudonymized with a salted HMAC before any of that text leaves the machine, and the step is skipped entirely when there is nothing to parse.

Built over several iterations with student council. First used live in Summer 2026. It runs two years of architecture studios in Fall 2026, and three in Spring 2027.
