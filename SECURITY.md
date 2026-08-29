# Security

This document provides public security guidance and reporting for the repository.

Public / Private Boundary

- Private artifacts (keys, credentials, production endpoints, unreleased data, model weights) are not stored in this repository. Use the token PRIVATE_IMPLEMENTATION_BOUNDARY when referring to private implementation details.

Responsible disclosure

- See .github/SECURITY.md for security reporting procedures.

Security posture

- Default: deny-by-default for privileged operations.
- No live production credentials, secrets, or tokens are published.

Dependency and supply-chain guidance

- Pin third-party Actions where practical.
- Use minimal workflow permissions: default to contents: read unless additional permissions are explicitly required.
