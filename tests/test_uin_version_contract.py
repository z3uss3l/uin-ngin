from uin.core.version import UIN_VERSION, SCHEMA_VERSION


def test_python_runtime_contract_matches_uin_v08():
    assert UIN_VERSION.startswith("0.8.")
    assert SCHEMA_VERSION == "uin.schema.v0.8"
