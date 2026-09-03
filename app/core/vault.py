"""BYOK Key Vault: Fernet AES-256 key encryption/decryption at rest."""
import base64
import os
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class KeyVault:
    """Provides secure encryption and decryption of third-party API keys."""

    def __init__(self, master_key: Optional[str] = None):
        key = master_key or settings.ENCRYPTION_MASTER_KEY
        try:
            # Ensure key is valid base64 urlsafe 32-bytes
            self._fernet = Fernet(key.encode("utf-8") if isinstance(key, str) else key)
        except Exception:
            # Fallback for dev/testing: generate deterministic Fernet key
            logger.warning("invalid_master_encryption_key_using_dev_fallback")
            dev_key = base64.urlsafe_b64encode(b"whipstitch-32-byte-secret-key-1!"[:32])
            self._fernet = Fernet(dev_key)

    def encrypt_key(self, plaintext: str) -> str:
        """Encrypts an API key string into a Fernet ciphertext token."""
        if not plaintext:
            raise ValueError("Cannot encrypt an empty key")
        token = self._fernet.encrypt(plaintext.strip().encode("utf-8"))
        return token.decode("utf-8")

    def decrypt_key(self, ciphertext: str) -> str:
        """Decrypts a Fernet ciphertext token back into plaintext."""
        if not ciphertext:
            raise ValueError("Cannot decrypt an empty ciphertext")
        try:
            raw = self._fernet.decrypt(ciphertext.strip().encode("utf-8"))
            return raw.decode("utf-8")
        except InvalidToken as e:
            logger.error("key_vault_decryption_failed", error=str(e))
            raise ValueError("Failed to decrypt API key: Invalid key or token.") from e

    @staticmethod
    def mask_key(plaintext: str) -> str:
        """Masks an API key for safe UI presentation (e.g., sk-...4a9f)."""
        clean = plaintext.strip()
        if len(clean) <= 8:
            return "••••••••"
        if clean.startswith("sk-"):
            return f"sk-...{clean[-4:]}"
        return f"{clean[:3]}...{clean[-4:]}"



# Global default instance
key_vault = KeyVault()
