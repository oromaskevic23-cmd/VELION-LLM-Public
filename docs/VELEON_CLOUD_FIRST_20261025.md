# VELEON — CLOUD FIRST / IPHONE OPERATOR, FREE ONLY
**Mission** IC-VELEON-CLOUD-FIRST-20261025-002  
**Owner** RomaskevicH  
**Stage** E2 adapter code; E3 CI pending per exact commit; real provider E4 **NOT VERIFIED**  
**Security** Zero Trust • deny by default • fail closed • no delegated cash or tool authority  
**Canonical name** VELEON (repository slug VELION-LLM-Public retained for existing links).

## Critical owner correction (25 October 2026)
The owner **operates on an iPhone 12 and uses cloud services**, not a locally available Windows GPU workstation. A previous VELEON recommendation assumed local desktop availability; that assumption is **superseded and must not gate execution**. Do not ask the owner to install Ollama or locally host weights on an iPhone.

**Deployment target (to be separately built):**
```
iPhone 12: mobile browser / owner approval UI
   -> signed HTTPS API (NOT implemented)
   -> scoped jobs + quota + read-only allowed capabilities (NOT implemented)
   -> VELEON cloud inference gateway (reference only; not deployed)
   -> selected verified free provider
   -> untrusted text proposal, independent QA, HANTER / LEGION dispatch
   -> proof + audit, no automatic production or payouts
```
GitHub Actions is a **test runner**, not an always-on free inference server. Repository code does not start a cloud service, and provider free quotas do not establish 24/7 capacity.

## Actually researched free cloud providers

| Role | Official option | Current high-level free constraints | Privacy / requirements |
| --- | --- | --- | --- |
| Primary candidate | GroqCloud Free `openai/gpt-oss-20b` and `openai/gpt-oss-120b` | rate limits and token quotas by organization; verify actual account | API key from official portal, supplied to secured backend only |
| Experimental backup | OpenRouter `model:free` selections | ordinary Free 50 requests/day, models can change | explicit per-provider routing/approval; model suffix `:free` not a payment guarantee |
| Alternate future | Cloudflare Workers AI free | 10,000 neurons/day free, hard stop on Workers Free | model-specific restrictions, actual binding required |
| Alternate future | Gemini Developer API Free | some models free subject to account limits, terms and region | free-tier content may be used to improve provider's products; **NO private project data by default** |

**Official sources assessed Oct 2026:**  
https://console.groq.com/docs/rate-limits  
https://console.groq.com/docs/models  
https://openrouter.ai/pricing  
https://developers.cloudflare.com/workers-ai/platform/pricing/  
https://ai.google.dev/gemini-api/docs/pricing  

Never assume permanent free accounts, universal access or guaranteed 24/7 uptime. Free capacity is a temporary **engineering test facility**, not a sound financial base for 1,000,000 concurrently active NCA.

## Existing adapter contract

`src/cloud-free-gateway.mjs` — server-side Node 22:
- Approved fixed HTTPS endpoints (Groq, OpenRouter); cannot point request at an arbitrary URL.
- Strict allowlisted Groq model IDs; OpenRouter requires syntactically valid `:free` model identifier. A listed model is still subject to actual provider availability and the account's free entitlement.
- No automatic fallback, retry that consumes quota, payment operation, generic tool schema, remote system action or model-controlled web browsing.
- **ALL** conditions required: owner scope, task class, exactly zero configured budget, operator confirmation that account free entitlement is verified and paid billing is disabled, public-only data classification, explicit inference confirmation and server-side API credential. **Operator declarations are not cryptographic or provider billing proofs**.
- Bounded request prompt, bounded completion tokens, bounded response read, timeout, redacted generic failure codes, no raw headers or provider error bodies written to logs.
- Returns proposal + SHA-256 receipt and `NOT_RUN`/ `DENIED` statuses. Returned text is *untrusted data*, not a command.

**Not implemented:** secret management, phone login, cloud deployment, tenant authentication, durable NCA queue integration, real API calls, account level billing controls, independent QA, payment logic or actual service-to-service integration. The earlier `src/free-llm-gateway.mjs` remains a separate optional offline Ollama **reference**, not the owner deployment target.

## Security and explicit owner actions

API keys, verification digits, passwords and tokens **never enter chat, a GitHub commit, the mobile client source or public CI logs**. When a provider needs authorization, owner personally completes it on the provider's official portal from the iPhone; an authenticated backend connector must subsequently verify the granted scope.

Owner authorization requires **separate**, task-bound confirmation for real execution, deployment, privileged access, spending, production and token operations; a sign-in code is not blanket authority.

The public prototype is not a secure deployed API: production deployment must enforce server-side credential custody, org-verified free quota (not merely a boolean), authentication and roles, replay protection, CSRF where relevant, rate/cost caps, provider privacy controls and audit ledger.

## Release ladder
1. **E2:** source + tests + this documentation exist on versioned feature branch.
2. **E3:** verify CI against exact HEAD; tests must exercise rejection of paid tier, private data, malformed keys, unapproved provider/model, 429 limits, forced redirects, malformed responses and tool calls.
3. **E4:** owner-approved **real** free cloud inference at fixed HTTPS endpoint with secret held in cloud credential storage; record actual provider, model, token usage, response hash and account quota. Deny without the secure channel.
4. **E5:** add verified persistent queue and LEGION order/team IDs; jobs wait on 429 or free quota exhaustion without paid failover. Human-approved customer work only.
5. **E6:** deploy reviewed service, independent QA, owner action approvals, logs/metrics, rollback and tested recovery. No claim of autonomous business revenue before settled real customer payment.

**Funding** $0 paid platform spend. No Val Town. No forced account upgrade. No production merger without review.
