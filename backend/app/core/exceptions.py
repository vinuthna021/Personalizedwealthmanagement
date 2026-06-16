class AppException(Exception):
    """Base exception for all application errors."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class AuthenticationFailedException(AppException):
    def __init__(self, message: str = "Invalid credentials or token expired", code: str = "AUTH_FAILED"):
        super().__init__(message=message, code=code, status_code=401)


class UserAlreadyExistsException(AppException):
    def __init__(self, message: str = "A user with this email already exists", code: str = "USER_EXISTS"):
        super().__init__(message=message, code=code, status_code=400)


class EntityNotFoundException(AppException):
    def __init__(self, message: str = "The requested entity was not found", code: str = "NOT_FOUND"):
        super().__init__(message=message, code=code, status_code=404)


class KYCVerificationPendingException(AppException):
    def __init__(self, message: str = "KYC status is not verified", code: str = "KYC_PENDING"):
        super().__init__(message=message, code=code, status_code=403)
