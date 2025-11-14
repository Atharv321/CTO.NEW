# Contributing to This Project

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/repo.git`
3. Create a feature branch: `git checkout -b feat/your-feature-name`
4. Follow the setup instructions in [README.md](./README.md)

## Development Setup

```bash
# Install dependencies
pnpm install

# Set up git hooks
pnpm run prepare
```

## Making Changes

1. Follow the existing code style and conventions
2. Keep commits atomic and descriptive
3. Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
4. Add tests for new features
5. Update documentation as needed

## Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Format code with Prettier
- Use 2-space indentation

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(api): add user authentication endpoint

Added JWT-based authentication with refresh tokens.
Includes database schema updates and tests.

Closes #123
```

## Running Tests and Linting

```bash
# Run tests
pnpm run test

# Run linting
pnpm run lint

# Format code
pnpm run format

# Type checking
pnpm run type-check
```

## Git Hooks

Git hooks are configured using Husky. Before committing:
- Pre-commit hook runs linting and formatting fixes
- Commit message hook validates the commit message format

## Pull Request Process

1. Ensure all tests pass: `pnpm run test`
2. Ensure linting passes: `pnpm run lint`
3. Update documentation if needed
4. Create a pull request with a clear description
5. Respond to any review comments

## Reporting Bugs

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)

## Asking Questions

For questions, please:
1. Check existing documentation
2. Search existing issues
3. Open a new issue or discussion if needed

## Code of Conduct

Please note that this project is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

Thank you for contributing!
