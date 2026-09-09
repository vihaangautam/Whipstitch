#!/bin/sh
# Boot: run migrations, then serve. A migration failure must NOT stop the server
# from starting — it's visible in the logs and a live-but-degraded service beats
# a crash-looping deploy on first setup.
set -e

echo "[entrypoint] alembic upgrade head"
# Cap it: a wrong/unreachable DATABASE_URL must not hang the boot past the
# platform health-check window. The app also self-heals its schema on first use.
timeout 60 alembic upgrade head || echo "[entrypoint] WARNING: alembic upgrade failed or timed out — starting the server anyway"

echo "[entrypoint] starting uvicorn on 0.0.0.0:${PORT:-8000}"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
