# NCA Scale Validation Checklist

This document lists the automated and manual validation steps required after adding or updating NCA scale architecture documents.

Automated checks

- markdownlint '**/*.md' (fix obvious style issues)
- markdown-link-check on docs and README
- detect-secrets scan -- baseline
- git-secrets --scan
- yamllint on .github workflows (if present)
- jq/python -m json.tool for JSON files

Manual checks

- Verify no statements claiming live 1M NCA deployments
- Verify canonical authorship and HANTER role
- Verify PUBLIC / PRIVATE boundary references use PRIVATE_IMPLEMENTATION_BOUNDARY when needed
- Confirm LICENSE and NOTICE are present and unmodified
- Review any new scripts for injection risks

Evidence collection

- For any claims of deployed NCAs, attach evidence: sample IDs, audit logs, timestamps, verification processes

