# Refactoring Request: Production Readiness

You are a Senior Software Architect. Refactor the current "miniDX" prototype into a production-ready application.
Follow the steps below strictly.

## Context
The current codebase has hardcoded configurations, magic strings in business logic, and lacks proper logging.
We need to improve **Maintainability** and **Readability** before deployment.

## Tasks

### 1. Centralize Configuration (Backend)
- **Goal**: Remove hardcoded values from `backend/core/database.py` and `main.py`.
- **Action**:
    - Install `pydantic-settings`.
    - Create `backend/core/config.py` using `BaseSettings` to manage:
        - `DATABASE_URL`
        - `CORS_ORIGINS` (List of allowed origins)
        - `SECRET_KEY` (if applicable)
    - Update `database.py` and `main.py` to use `settings` from `config.py`.
    - Create a `.env.example` file in the root directory.

### 2. Environment Variables (Frontend)
- **Goal**: Remove hardcoded API URLs.
- **Action**:
    - Update `frontend/src/api/client.js` (or equivalent) to use `import.meta.env.VITE_API_URL`.
    - Create `.env.development` and `.env.production` in `frontend/`.
    - Add `VITE_API_URL=http://localhost:8000` to development config.

### 3. Eliminate Magic Strings (Backend Logic)
- **Goal**: Make `backend/solver/constraints.py` robust against data name changes.
- **Action**:
    - Define a Python `Enum` (e.g., `TaskType` or `TaskCategory`) in `backend/schemas/enums.py` or `models.py`.
    - **Crucial**: Refactor `constraints.py` to check against these Enums or specific DB IDs/Flags instead of checking `if "Nursing" in task.name`.
    - *Note*: If DB schema changes are required (e.g., adding a `category` column to `Task`), generate a new Alembic migration script.

### 4. Implement Proper Logging
- **Goal**: Replace `print()` statements with structured logging.
- **Action**:
    - Configure Python's standard `logging` in `backend/core/logging.py` (or within `main.py`).
    - Replace all `print()` calls in `backend/solver/` and `backend/api/` with `logger.info()` or `logger.error()`.

### 5. Standardize Error Handling
- **Goal**: Unified error responses.
- **Action**:
    - Add a global exception handler in `backend/app/main.py` to catch unhandled exceptions and return a standard JSON response (e.g., `500 Internal Server Error` with a safe message).

## Constraints
- Do **not** break existing functionalities.
- Run `pytest backend/test/test_solver.py` after changes to ensure the solver logic remains intact.
- Keep the directory structure defined in the previous refactoring.