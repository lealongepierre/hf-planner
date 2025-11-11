## Services

## Docker and Dockerfiles
- When creating a new Dockerfile, ALWAYS read `docs/howto/dockerfile.md` first to follow project standards for security (non-root users, CVE patching), layer caching optimization, multi-stage builds, and monorepo dependency handling

## Coding guidelines
- We use python 3.12
- Always use native types: `list[T]`, `dict[K,V]`, `tuple[T,...]`, `set[T]`, `X | None`, `X | Y | Z` instead of importing from `typing` module
- Only import from `typing` when absolutely necessary: `Protocol`, `TypeVar`, `Generic`, `TypedDict`, `Literal`, `Final`, `ClassVar`, `Annotated`, `Any`, `Never`, `NoReturn`, `cast`, `overload`, `NewType`
- Define semantic type aliases for domain clarity: `AttributeCode = str`, `LocaleCode = str`, `FamilyCode = str`, `JsonPointerPath = str` for "/attributes/color", `Timestamp = str` for ISO 8601; use type aliases in dict keys and values: `LocalizedLabels = dict[LocaleCode, str]`, `AttributeDict = dict[AttributeCode, Any]`, `FamilyMapping = dict[FamilyCode, list[AttributeCode]]`, `TaxonomyDict = dict[str, Any]`, `ContextMemory = dict[str, Any]`
- Use `NewType` for type safety when mixing would be dangerous: `StepNumber = NewType("StepNumber", int)`, `ProductId = NewType("ProductId", str)` to prevent accidental parameter swapping
- Comments: do not use comments to explain the code at each line, use docstrings instead when code is complex, use inline comments to explain the code only when it's not obvious

## Local development and testing
- After modifying files, use `mcp__ide__getDiagnostics` to check for linting errors, unused imports, type issues  etc. that need fixing before committing
- If you are unsure you are running into auth issues, run `gcloud auth application-default print-access-token &>/dev/null && echo "✅ Authenticated" || echo "❌ Not authenticated"`
- If you have auth issues, authenticate with GCP using `just gcp-login` which runs `gcloud auth login` and `gcloud auth application-default login`
- Run tests with `poetry run pytest` for local development or use Just commands which run tests inside Docker
- Each service/library has its own justfile with test commands like `just test` or `just run-core-tests`
- Test commands vary per service: `run-core-tests`, `run-api-tests`, `run-worker-tests`, `functest-*` for functional tests, check the justfile for the service you're working on
- If needed you can port forward to bypass authentication/proxies for local testing: `kubectl port-forward -n <namespace> deployment/<deployment> 8000:8000`

## Deployment
- Deployments are handled by CI/CD pipelines - manual deployment should only be done in dev environment for testing deployment issues with faster feedback loops
- To debug deployment failures locally: ask user for the last Helm command from CI logs to get the exact image hash (commit SHA) that was built and pushed
- Each service has its own Helm chart in `deployment/<service-name>/` with environment-specific values in `environments/dev.yml`, `environments/ppd.yml`, `environments/prd.yml`
- Deploy with: `helm upgrade --install <service> deployment/<service>/  --namespace <namespace> --values deployment/<service>/environments/<env>.yml --set global.version=<git-hash>`
- Available services: `dmd`, `dmd-assistant`, `pim-gen-ai`, `z2s`, `inference` (SDM services), `coreai-common` (shared resources)
- Images stored in `europe-west4-docker.pkg.dev/akecld-prd-coreai-infer-dev/coreai-app/<service>`, verify with `gcloud artifacts docker tags list`
- Always test with `--dry-run` first, use `--wait --timeout 3m` for deployment verification
- Most services run on port 8000 (not 8080), check service configuration if port issues arise

## API Documentation Guidelines
- Maintain clear separation between client-facing Swagger descriptions and developer-facing docstrings: Swagger for API consumers (usage instructions, workflows, requirements), docstrings for developers (implementation details, architecture, services used)
- Swagger descriptions should include step-by-step usage instructions with specific endpoint references, required parameters format/constraints, file format requirements or input validation rules, expected workflow patterns like upload→call→poll, brief result expectations, essential error conditions
- Swagger descriptions should AVOID internal implementation details like chunking/workers/services, technical architecture explanations, database operations or background processing details, detailed parameter descriptions that schema handles, response field explanations that examples show
- Function docstrings should include high-level function purpose, key implementation details affecting behavior, architecture patterns like parent-child jobs or background processing, services and components used, important side effects or state changes, standard Args/Returns/Raises documentation
- Function docstrings should AVOID step-by-step user instructions, API usage examples, client workflow explanations
- Add comprehensive examples in `responses` section covering main scenarios like success/failure/different states, use realistic data with actual GCS paths and execution times, show what null vs populated fields look like
- Follow consistent structure: brief description with "How to call" numbered steps, "Input requirements" with constraints, "Results" explanation, then comprehensive response examples with realistic values
- Eliminate redundancy by not repeating same information in both Swagger and docstring, write audience-specific content for API consumers vs developers, keep content concise but complete with essential information, maintain consistent patterns across all endpoints, prefer examples over field explanations

## Style Guide for CLAUDE.md
- Use bullet points for every rule, no bold formatting or double asterisks, use titles sparingly
- Each bullet should be one dense line containing all related information separated by commas, semicolons, or colons
- Use inline code backticks for commands, file paths, and technical terms
- Include concrete examples inline with concise explanations: `command` for X, `path/to/file` for Y
- Combine related concepts in single bullets rather than splitting into sub-points
- Put clarifying context after a colon or dash within the same line
- Order information from most general to most specific within each bullet
- Use present tense, imperative mood for instructions
- Avoid unnecessary words like "you should" or "make sure to" - just state what to do
- Include warnings inline using CAPS for emphasis: NEVER, ALWAYS, MUST
- Group related rules under clear section headings without additional explanation
- No paragraphs, no line breaks within sections - just continuous bullet points

## Git
- The main branch is `main`