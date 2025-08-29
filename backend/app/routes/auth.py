from fastapi import APIRouter, HTTPException, Body, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.sb_client import supabase
from app.db.db import get_db
from app.models import User

router = APIRouter()

@router.post("/signup")
async def signup(response: Response, db: AsyncSession = Depends(get_db), data: dict = Body(...)):
    """
    Supabase Authentication signup
    """
    try:
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        res = supabase.auth.sign_up({
            "email": email, 
            "password": password,
            "options": {
                "data": {
                    "name": name
                }
            }
        })
        if res.user is None:
            raise HTTPException(status_code=400, detail=res.message)

        user = User(name=name, email=email, id=res.user.id) 
        db.add(user)
        await db.commit()
        await db.refresh(user)

        #set refresh token in HttpOnly cookie
        response.set_cookie(
            key="refresh_token",
            value=res.session.refresh_token if res.session else "",
            httponly=True,
        )
        
        return {
            "name": user.name,
            "email": user.email
        }
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(response: Response, data: dict = Body(...)):
    """
    Supabase Authentication login
    """
    try:
        email = data.get("email")
        password = data.get("password")
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})

        if res.user is None:
            raise HTTPException(status_code=401, detail=res.message)
            
        response.set_cookie(
            key="refresh_token",
            value=res.session.refresh_token if res.session else "",
            httponly=True,
        )

        response.set_cookie(
            key="access_token",
            value=res.session.access_token if res.session else "",
            httponly=True,
            secure=True,           
            samesite="none"        
        )
        
        return {
            "name": res.user.user_metadata.get("name"),
            "email": res.user.email
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me")
async def get_me(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # refresh the session to get new access_token & user info
    res = supabase.auth.refresh_session(refresh_token)

    if res.session is None or res.user is None:
        raise HTTPException(status_code=401, detail="Invalid session")

    response.set_cookie(
        key="refresh_token",
        value=res.session.refresh_token if res.session else "",
        httponly=True,
    )

    return {
        "data": {
            "email": res.user.email,
            "name": res.user.user_metadata.get("name"),
        }
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
    )

    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,           
        samesite="none"       
    )

    return {
        "data": "You have successfully logged out"
    }