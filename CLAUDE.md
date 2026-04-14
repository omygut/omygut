# Project Guidelines

## Design Documentation

Do not create local design/spec files. All design documents should be written directly in the GitHub issue.

## Package Manager

Always use `pnpm` instead of `npm` or `yarn`.

## Git Workflow

Always create a pull request for changes. Never push directly to main.

Never skip pre-commit hooks (--no-verify). If a hook fails, fix the underlying issue.

Never use `git commit --amend`. Always create new commits.

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

E2E tests use `miniprogram-automator` to test the full mini program in WeChat DevTools with **real cloud database**. They require local environment and cannot run in CI.

Run locally after pushing:

```bash
pnpm test:e2e
```

Prerequisites:
- WeChat DevTools installed with Service Port enabled (Settings > Security)
- `.env.local` configured with valid appID and cloud environment

Data isolation: E2E tests use a fixed test user ID (`e2e_test_user`) to avoid polluting real user data.

### Integration Tests

Integration tests verify service layer logic using the in-memory fake database. They run in CI.

```bash
pnpm test
```

Test files: `src/services/**/*.test.ts`

### Fake Database

Integration tests use the in-memory fake database (`TARO_APP_ENV=test`). The fake database supports: `add`, `where`, `orderBy`, `limit`, `get`, `doc`, `remove`, `update`.

## Cloud Database (tcb CLI)

Use `tcb` CLI to manage cloud resources. Environment ID: `cloud1-8gzx205084c1da0f`

```bash
# Check collection permissions
tcb permission get collection -e cloud1-8gzx205084c1da0f

# List environments
tcb env list
```

## Build-time Constants

Use `defineConstants` in `config/index.ts` for environment-specific values. Do not use `process.env` directly in source code — it doesn't exist at runtime in mini programs.

Current constants:
- `IS_TEST_ENV`: `true` when building with `TARO_APP_ENV=test` (integration tests, fake database)
- `IS_E2E_ENV`: `true` when building with `TARO_APP_ENV=e2e` (E2E tests, real database + test user)

To add a new constant:
1. Define in `config/index.ts` under `defineConstants`
2. Declare type in the source file: `declare const MY_CONSTANT: string;`
