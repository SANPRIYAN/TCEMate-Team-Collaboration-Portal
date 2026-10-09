# TCEMate - User Credentials & Login Passkeys

This document contains the login credentials, register numbers, roles, and unique passkeys for all pre-seeded student accounts and default administrator setup.

---

## 🔑 Demo Student Accounts

> **Default Password for All Demo Accounts**: `Suruthisagar_2007`

| Full Name | Role | Email / Username | Password | Register No. | Unique Passkey | Department & Year |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Suruthi Sagar** | Student | `suruthisagar@student.tce.edu` | `Suruthisagar_2007` | `22IT099` | `PK-22IT099` | Information Technology · 3rd Year |
| **Ansila A** | Student | `ansila@student.tce.edu` | `Suruthisagar_2007` | `22IT012` | `PK-22IT012` | Information Technology · 3rd Year |
| **Sanjaypriyan S** | Student | `sanjay@student.tce.edu` | `Suruthisagar_2007` | `22IT085` | `PK-22IT085` | Information Technology · 3rd Year |
| **Jambu Omayan U R** | Student | `jambu@student.tce.edu` | `Suruthisagar_2007` | `22IT045` | `PK-22IT045` | Computer Science & Eng. · 3rd Year |
| **Test Student User** | Student | `testuser@student.tce.edu` | `Suruthisagar_2007` | `22IT100` | `PK-22IT100` | Information Technology · 3rd Year |

---

## 🛡️ Administrator Credentials & Setup Info

| Field | Value | Notes |
| :--- | :--- | :--- |
| **Authorized Admin Email** | `admin@tce.edu` | First-time administrator setup email |
| **Default Admin Password** | `Suruthisagar_2007` | Password initialized upon setup |
| **Admin Setup Secret** | `a-test-admin-setup-secret-longer-than-32-characters` | Found in `.env` (`ADMIN_SETUP_SECRET`) |
| **Admin Passkey** | `PK-ADMIN` | Unique passkey for administrator password reset |

---

## 💡 How to Use Passkeys & Reset Password

1. **Viewing Your Unique Passkey**:
   - Log into TCEMate using any of the accounts above (Password: `Suruthisagar_2007`).
   - Navigate to **Profile** (`profile.html`).
   - Under **ACCOUNT INFORMATION** on the right panel, you will see your **Unique Passkey** (e.g. `PK-22IT099`).

2. **Forgot Password Flow**:
   - Go to the [Login Page](file:///d:/SANJAY%20BTECH%20IT%20STUDY/sem%205/web%20tech/TCEMate-Portal-Final/login.html).
   - Click **Forgot password?**.
   - Enter your **Email**, your **Unique Passkey**, and your **New Password**.
   - Click **Update Password** (`PATCH` request updates MongoDB).
