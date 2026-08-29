# Contributing

Thank you for contributing to AneTrace. Before submitting changes, run:

```bash
npm install
npm run lint
npm test
npm run build
```

## Medical-content boundaries

- Never present this project as a medical device or clinical decision tool.
- Never add identifiable patient information.
- Record the dataset, version, license, source case ID, and sampling method for every added case.
- Generated checkpoints must remain `needs-expert-review` until reviewed by a suitably qualified specialist.
- Checkpoints should train trend observation and retrospective discussion, not provide diagnoses, drug doses, or treatment instructions.

## Code conventions

- Preserve the lightweight, backend-free architecture; explain why any new dependency is necessary.
- Prefer explicit, auditable interface language.
- Add tests for behavioral changes and keep data generation reproducible.
- Use conventional commits, for example `feat(replay): add event filters`.
