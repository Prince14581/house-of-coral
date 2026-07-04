# House-of-Coral Platform Architecture (v1.0)

## 1. Mission Statement
House-of-Coral is officially transitioning from a feature-oriented architecture to a Service-Oriented Engine Architecture (SOEA). Every business capability is provided by shared platform engines. Business modules (The Eight Pillars) are consumers of these engines.

## 2. Core Design Principles
*   **Single Source of Truth:** Every responsibility (Identity, Wallet, Policy, etc.) has exactly one owner.
*   **Thin Business Modules:** Modules own business logic (e.g., catalog, game rules) but outsource all platform cross-cutting concerns (authentication, money, permissions).
*   **Decoupled Communication:** Engines communicate via service interfaces or domain events. No direct database access across engine boundaries.

## 3. Engineering Constitution (The Rules)
1.  **Controllers are thin:** They contain no business logic.
2.  **Encapsulation:** Services never access another service's database directly.
3.  **Financial Integrity:** Every financial operation creates mandatory `LedgerEntry` records.
4.  **Auditability:** Every sensitive administrative action generates an `AuditRecord`.
5.  **Governance First:** All permission checks must traverse the `Governance` and `Policy` engines.
6.  **Don't Reinvent:** If an engine exists, it must be used. Recreating platform logic within a pillar is a violation of architecture standards.

## 4. Engine Ownership Matrix
| Engine | Responsibility |
| :--- | :--- |
| **Identity** | Users, sessions, device auth |
| **Governance** | Roles, permissions, tier enforcement |
| **Policy** | Eligibility & business rule enforcement |
| **Wallet** | Atomic balance tracking |
| **Ledger** | Immutable financial history |
| **Settlement** | Transaction flow (Escrow/Release) |
| **Treasury** | Reserves and platform fee accounting |
| **Risk/Fraud** | Compliance and trust scoring |

## 5. Definition of Done (Migration)
A module is successfully migrated only when:
*   It delegates all auth, wallets, permissions, and notifications to shared engines.
*   It publishes domain events for all significant business actions.
*   It conforms to the `src/modules/` directory structure.
