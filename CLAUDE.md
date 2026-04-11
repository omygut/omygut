# Project Guidelines

## Package Manager

Always use `pnpm` instead of `npm` or `yarn`.

## Git Workflow

Always create a pull request for changes. Never push directly to main.

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

- `feat(gateway): add retry logic for API calls`
- `fix(ui): correct cursor position in file browser`
- `docs: update README with badges`
- `test: fix flaky navigation test`

After creating or updating a PR:
1. Push changes to trigger CI
2. Run E2E tests locally (can run in parallel with CI)
3. Monitor CI status. If CI fails, investigate and fix promptly.

## Testing Strategy

### E2E Tests

E2E tests use `miniprogram-automator` to test the full mini program in WeChat DevTools. They require local environment and cannot run in CI.

Run locally after pushing:

```bash
pnpm test:e2e
```

Prerequisites:
- WeChat DevTools installed with Service Port enabled (Settings > Security)
- `.env.local` configured with valid appID and cloud environment

### Integration Tests

Integration tests verify service layer logic using the in-memory database mock. They can run in CI.

```bash
pnpm test
```

Test files: `src/services/**/*.test.ts`

### Database Mock

Both E2E and integration tests use the in-memory database (`TARO_APP_ENV=test`) to avoid polluting production data. The mock supports: `add`, `where`, `orderBy`, `limit`, `get`, `doc`, `remove`, `update`.
