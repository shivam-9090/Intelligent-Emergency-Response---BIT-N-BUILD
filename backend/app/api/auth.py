import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserRead, UserRoleUpdate
from app.services import auth_service
from app.services.auth_service import EmailAlreadyRegisteredError, UserNotFoundError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    try:
        user = auth_service.register_user(db, payload)
    except EmailAlreadyRegisteredError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return UserRead.model_validate(user)


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(str(user.id), user.role.value)
    return Token(access_token=token)


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch(
    "/users/{user_id}/role",
    response_model=UserRead,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def update_user_role(user_id: uuid.UUID, payload: UserRoleUpdate, db: Session = Depends(get_db)) -> UserRead:
    try:
        user = auth_service.update_user_role(db, user_id, payload.role)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return UserRead.model_validate(user)
