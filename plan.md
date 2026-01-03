---

# AI-Assisted Team Formation Pipeline

This is not “ask the AI and hope”.
This is **controlled decision support** with validation and human oversight.

---

## Step 1: Build a Team Formation Context

This is the most important step.

**Garbage in = clown teams out.**

You do **not** dump raw Firestore documents into the model.
You send a **compressed, intentional, decision-focused JSON**.

### Rules for input

* No names
* No personal info
* No irrelevant fields
* Only decision signals

### Example: Context sent to AI

```bash
curl --location 'https://openrouter.ai/api/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <API_KEY>' \
--data '{
  "model": "google/gemma-3-27b-it:free",
  "max_tokens": 5000,
  "messages": [
    {
      "role": "system",
      "content": "You are an AI team formation assistant. Your task is to form balanced teams using the provided students. You must respect team size, ensure skill diversity, avoid stacking similar strengths, assign one primary role per student, and provide clear reasoning per team. Return ONLY valid JSON. No markdown. No explanations outside JSON."
    },
    {
      "role": "user",
      "content": "SAMPLE INPUT:\n{\n  \"teamSize\": 3,\n  \"skills\": [\"logic\", \"creativity\", \"communication\"],\n  \"students\": [\n    { \"id\": \"s1\", \"skills\": { \"logic\": 80, \"communication\": 85 }, \"confidence\": 0.9 },\n    { \"id\": \"s2\", \"skills\": { \"creativity\": 88 }, \"confidence\": 0.7 },\n    { \"id\": \"s3\", \"skills\": { \"leadership\": 82, \"collaboration\": 78 }, \"confidence\": 0.8 }\n  ]\n}\n\nEXPECTED OUTPUT:\n{\n  \"teams\": [\n    {\n      \"teamName\": \"Team A\",\n      \"members\": [\"s1\", \"s2\", \"s3\"],\n      \"roles\": {\n        \"s1\": \"Analyst\",\n        \"s2\": \"Creator\",\n        \"s3\": \"Leader\"\n      },\n      \"reasoning\": \"This team balances analytical thinking, creativity, and leadership.\"\n    }\n  ]\n}"
    },
    {
      "role": "user",
      "content": "NOW PROCESS THIS INPUT:\n{\n  \"cohort\": \"CSE_2026\",\n  \"teamSize\": 4,\n  \"skills\": [\"logic\", \"creativity\", \"communication\", \"execution\", \"collaboration\", \"leadership\"],\n  \"students\": [\n    { \"id\": \"u1\", \"skills\": { \"logic\": 82, \"communication\": 90, \"leadership\": 85 }, \"confidence\": 0.88 },\n    { \"id\": \"u2\", \"skills\": { \"creativity\": 91, \"execution\": 76 }, \"confidence\": 0.72 }\n  ],\n  \"constraints\": {\n    \"minSkillCoverage\": true,\n    \"avoidSimilarProfiles\": true,\n    \"maxLeadersPerTeam\": 1\n  }\n}"
    }
  ]
}'
```

---

## Step 2: Give the AI a Very Strict Job

If you let the AI “figure it out”, it will hallucinate fairness.

Instead, you **assign a role**.

### System Instruction (non-negotiable)

```text
You are an AI team formation assistant.
Your task is to form balanced teams using the provided students.

You must:
- Respect team size
- Ensure skill diversity
- Avoid stacking similar strengths
- Assign one primary role per student
- Provide clear reasoning per team

Return ONLY valid JSON.

This is not creativity time.
This is decision support.
```

---

## Step 3: AI Output Format (Non-Negotiable)

If the output breaks structure, you **reject it**.

### Expected AI Output (example)

```json
{
  "teams": [
    {
      "teamName": "Team Alpha",
      "members": ["u1", "u2"],
      "roles": {
        "u1": "Leader/Communicator",
        "u2": "Creator/Executor"
      },
      "reasoning": "Initial team formed with available students. u1 contributes leadership and communication, while u2 adds creativity and execution."
    }
  ]
}
```

### What you actually consume

You extract only:

```json
"content": {
  "teams": [...]
}
```

Everything else is metadata noise.

---

## Step 4: Validation Layer (THIS SAVES YOU)

Never trust the AI blindly. Ever.

Your backend must validate:

* Team size is correct
* No duplicate students
* All students are assigned
* Constraints are respected
* Balance score ≥ minimum threshold

### If validation fails

* Regenerate
* Auto-correct
* Or fallback to algorithmic logic

**AI proposes. Code disposes.**

---

## Step 5: Firestore Writes (Controlled)

Only after:

* Validation
* Faculty approval

You store:

* Teams
* Roles
* AI reasoning
* Job metadata

**Never let the AI write directly to the database.**
That’s how villains are born.

---

## Step 6: Faculty Approval UI (Mandatory)

This is not optional. You already planned it. Keep it.

Faculty can:

* Regenerate teams
* Swap members
* Lock final teams

Every override is logged.
That’s training data for later.

---