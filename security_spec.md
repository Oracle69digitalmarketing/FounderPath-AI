# Security Specification for FounderPath AI

## Data Invariants
- A user profile must have a valid `user_id` matching the authenticated user.
- Timestamps (`created_at`, `updated_at`) must be handled securely.
- Only the owner can read/write their prosperity profile.
- Users cannot elevate their own status or modify system-generated fields (though in this prototype, we're letting them update everything through the dashboard for simplicity, but in production, we'd lock down certain fields).

## The Dirty Dozen Payloads

1. **Identity Theft**: Attempt to create a profile with a `user_id` differing from `request.auth.uid`.
2. **Shadow Field Injection**: Adding `isAdmin: true` to the user document.
3. **Orphaned Write**: Creating a recommendation without a corresponding skill audit (implicit in logic).
4. **Timestamp Spoofing**: Setting `created_at` to a future date in the past.
5. **PII Leakage**: Attempting to read another user's `users/{userId}` document.
6. **Query Scraping**: Attempting to list all users without filters.
7. **Resource Poisoning**: Sending a 1MB string for a skill name.
8. **State Shortcut**: Setting `business_plan_generated: true` without actually generating one (if we had a backend check).
9. **Budget Overflow**: Setting `startup_budget` to negative or extremely high value.
10. **ID Poisoning**: Using a 1KB string as `userId` in the path.
11. **Email Spoofing**: Accessing data with an unverified email (if restricted).
12. **Type Confusion**: Sending an object where an array of strings is expected for `core_competencies`.

## Test Runner (Logic Check)
- `users/{userId}`: `allow read, write: if request.auth != null && request.auth.uid == userId`
- Validation helpers for each entity.

# Security Rules Plan
- Implement `isValidUser` and `isValidSkillProfile`.
- Use `affectedKeys().hasOnly()` for updates.
