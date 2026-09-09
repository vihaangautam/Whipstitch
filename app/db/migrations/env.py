import asyncio
from logging.config import fileConfig
from alembic import context
from sqlalchemy.engine import Connection

from app.core.config import settings
from app.db.models import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("%", "%%"))


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    # Reuse the app engine so TLS/connect_args (Supabase et al.) and the
    # Postgres→SQLite fallback behave exactly as they do at runtime.
    from app.db.session import pg_engine

    async with pg_engine.connect() as connection:
        await connection.run_sync(do_run_migrations)


def run_migrations_online() -> None:
    try:
        asyncio.run(run_async_migrations())
    except Exception as exc:  # managed Postgres unreachable → fall back to the local SQLite file
        from app.core.logging import get_logger
        from app.db.session import sqlite_engine

        get_logger(__name__).warning("alembic_pg_unreachable_using_sqlite", error=str(exc))

        async def _sqlite():
            async with sqlite_engine.connect() as connection:
                await connection.run_sync(do_run_migrations)

        asyncio.run(_sqlite())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
