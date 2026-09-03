"""Unit tests for BYOK Fernet Key Vault."""
import pytest
from app.core.vault import KeyVault, key_vault


def test_key_vault_encryption_decryption_roundtrip():
    vault = KeyVault()
    original_key = "sk-proj-abc1234567890xyz"
    encrypted = vault.encrypt_key(original_key)

    assert encrypted != original_key
    assert isinstance(encrypted, str)

    decrypted = vault.decrypt_key(encrypted)
    assert decrypted == original_key


def test_key_vault_masking():
    assert key_vault.mask_key("sk-proj-1234567890abcdef") == "sk-...cdef"
    assert key_vault.mask_key("AIzaSyD-abc123xyz987") == "AIz...z987"
    assert key_vault.mask_key("short") == "••••••••"


def test_key_vault_invalid_token():
    vault = KeyVault()
    with pytest.raises(ValueError, match="Failed to decrypt API key"):
        vault.decrypt_key("invalid-ciphertext-token-here")


def test_key_vault_empty_string_rejection():
    vault = KeyVault()
    with pytest.raises(ValueError, match="Cannot encrypt an empty key"):
        vault.encrypt_key("")
