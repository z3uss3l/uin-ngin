# path: uin/core/errors.py
class UINError(Exception):
    pass


class ValidationError(UINError):
    pass


class CompatibilityError(UINError):
    pass


class NormalizationError(UINError):
    pass
