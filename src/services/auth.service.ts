import { API_URL } from "@/lib/config";
import { AuthResponseDto, LoginDto, UserCreateDto } from "@/types/user";

export async function login(credentials: LoginDto): Promise<AuthResponseDto> {
  const response = await fetch(`${API_URL}auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Login failed" }));
    throw new Error(error.message || "Invalid credentials");
  }

  return response.json();
}

export async function signup(userData: UserCreateDto): Promise<AuthResponseDto> {
  const response = await fetch(`${API_URL}auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Signup failed" }));
    throw new Error(error.message || "Signup failed");
  }

  return response.json();
}

export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch(`${API_URL}auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Failed to send reset email");
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_URL}auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Reset failed" }));
    throw new Error(error.message || "Failed to reset password");
  }
}

export async function confirmEmail(token: string): Promise<void> {
  const response = await fetch(`${API_URL}auth/confirm-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Confirmation failed" }));
    throw new Error(error.message || "Failed to confirm email");
  }
}
