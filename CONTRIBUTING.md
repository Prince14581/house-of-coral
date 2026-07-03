# Contributing to House-of-Coral

## 1. Development Workflow
- **Branching:** Use `feature/` for new pillars or services.
- **AI Collaboration:** Verify all AI-generated code against our security patterns.

## 2. Security Standards
- **Financial Integrity:** Integrate with `TreasuryService` for the 10% platform fee.
- **Forensic Protection:** Media-heavy pillars must use `addForensicWatermark`.
- **No Secrets:** Never commit `.env` files.

## 3. Linting and Testing
- Run `npm run lint` and `npm test` before submitting a PR.
