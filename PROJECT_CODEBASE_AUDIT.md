# Complete Project Codebase for Audit

**Project Name:** L2B6-Backend-PH-Healthcare-Management-System
**Generated Date:** 2026-08-22T07:56:40.206Z
**Total Source Files:** 97

> **Audit Instruction for AI:**
> You are acting as a Senior Backend Architect and Security Auditor.
> Please perform a comprehensive code audit of this Node.js / Express / TypeScript / Prisma backend application covering:
> 1. **Security & Auth Vulnerabilities** (JWT, authentication, authorization/RBAC, inputs, cookies)
> 2. **Architecture & Design Patterns** (Module structure, separation of concerns, clean code)
> 3. **Database & Transactions** (Prisma queries, transaction management, race conditions, indexes)
> 4. **Validation & Error Handling** (Zod validation completeness, global error handling, edge cases)
> 5. **Performance & Optimization Bottlenecks**
> 6. **Actionable Recommendations with Code Fixes**

## 1. Directory Structure

```
.
├── prisma/
│   └── schema/
│       ├── admin.prisma
│       ├── appointment.prisma
│       ├── auth.prisma
│       ├── doctor.prisma
│       ├── enums.prisma
│       ├── medicalReport.prisma
│       ├── patient.prisma
│       ├── patientHealthData.prisma
│       ├── payment.prisma
│       ├── prescription.prisma
│       ├── review.prisma
│       ├── schedule.prisma
│       ├── schema.prisma
│       └── specialty.prisma
├── src/
│   ├── app/
│   │   ├── config/
│   │   │   ├── cloudinary.config.ts
│   │   │   ├── env.ts
│   │   │   ├── multer.config.ts
│   │   │   └── stripe.config.ts
│   │   ├── errorHelpers/
│   │   │   ├── AppError.ts
│   │   │   └── handleZodError.ts
│   │   ├── interfaces/
│   │   │   ├── error.interface.ts
│   │   │   ├── index.d.ts
│   │   │   ├── query.interface.ts
│   │   │   └── requestUser.interface.ts
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   └── prisma.ts
│   │   ├── middleware/
│   │   │   ├── checkAuth.ts
│   │   │   ├── globalErrorHandler.ts
│   │   │   ├── notFound.ts
│   │   │   └── validateRequest.ts
│   │   ├── module/
│   │   │   ├── admin/
│   │   │   │   ├── admin.controller.ts
│   │   │   │   ├── admin.interface.ts
│   │   │   │   ├── admin.route.ts
│   │   │   │   ├── admin.service.ts
│   │   │   │   └── admin.validation.ts
│   │   │   ├── appointment/
│   │   │   │   ├── appointment.controller.ts
│   │   │   │   ├── appointment.interface.ts
│   │   │   │   ├── appointment.route.ts
│   │   │   │   ├── appointment.service.ts
│   │   │   │   └── appointment.validation.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.interface.ts
│   │   │   │   ├── auth.route.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── doctor/
│   │   │   │   ├── doctor.constant.ts
│   │   │   │   ├── doctor.controller.ts
│   │   │   │   ├── doctor.interface.ts
│   │   │   │   ├── doctor.route.ts
│   │   │   │   ├── doctor.service.ts
│   │   │   │   └── doctor.validation.ts
│   │   │   ├── doctorSchedule/
│   │   │   │   ├── doctorSchedule.constant.ts
│   │   │   │   ├── doctorSchedule.controller.ts
│   │   │   │   ├── doctorSchedule.interface.ts
│   │   │   │   ├── doctorSchedule.route.ts
│   │   │   │   ├── doctorSchedule.service.ts
│   │   │   │   └── doctorSchedule.validation.ts
│   │   │   ├── payment/
│   │   │   │   ├── payment.controller.ts
│   │   │   │   ├── payment.interface.ts
│   │   │   │   ├── payment.route.ts
│   │   │   │   ├── payment.service.ts
│   │   │   │   └── payment.validation.ts
│   │   │   ├── schedule/
│   │   │   │   ├── schedule.constant.ts
│   │   │   │   ├── schedule.controller.ts
│   │   │   │   ├── schedule.interface.ts
│   │   │   │   ├── schedule.route.ts
│   │   │   │   ├── schedule.service.ts
│   │   │   │   ├── schedule.utils.ts
│   │   │   │   └── schedule.validation.ts
│   │   │   ├── specialty/
│   │   │   │   ├── specialty.controller.ts
│   │   │   │   ├── specialty.route.ts
│   │   │   │   ├── specialty.service.ts
│   │   │   │   └── specialty.validation.ts
│   │   │   └── user/
│   │   │       ├── user.controller.ts
│   │   │       ├── user.interface.ts
│   │   │       ├── user.route.ts
│   │   │       ├── user.service.ts
│   │   │       └── user.validation.ts
│   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── shared/
│   │   │   ├── catchAsync.ts
│   │   │   └── sendResponse.ts
│   │   ├── templates/
│   │   │   ├── googleRedirect.ejs
│   │   │   └── otp.ejs
│   │   └── utils/
│   │       ├── cookie.ts
│   │       ├── email.ts
│   │       ├── jwt.ts
│   │       ├── QueryBuilder.ts
│   │       ├── seed.ts
│   │       └── token.ts
│   ├── app.ts
│   └── server.ts
├── Tasks/
│   └── Task-1.md
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

## 2. All Project Files and Code

### File: `.env.example`

```text
// File: .env.example

NODE_ENV=development
PORT=5000

# This was inserted by `prisma init`:
# Environment variables declared in this file are NOT automatically loaded by Prisma.
# Please add `import "dotenv/config";` to your `prisma.config.ts` file, or use the Prisma CLI with Bun
# to load environment variables from .env files: https://pris.ly/prisma-config-env-vars.

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="postgres://c59990jhsed4r3jh4913r2k32011528ca14718f7beb97c899a4c4805316a:sk_R89uErMBZnq34ml84dV3e@db.prisma.io:5432/postgres?sslmode=require"

BETTER_AUTH_SECRET=aV53jXdhgjs783434gq912133Kd8hGaE66666NvUa

BETTER_AUTH_URL=http://localhost:5000 # Base URL of your app

ACCESS_TOKEN_SECRET=accesssecret
REFRESH_TOKEN_SECRET=refreshsecret
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d
BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN=1d
BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE=1d

# akgg idyw rrju ekkr

EMAIL_SENDER_SMTP_USER=mentor.saminravi@gmail.com
EMAIL_SENDER_SMTP_PASS=abcc losf hfuu kiry
EMAIL_SENDER_SMTP_HOST=smtp.gmail.com
EMAIL_SENDER_SMTP_PORT=465
EMAIL_SENDER_SMTP_FROM=saminravi@gmail.com

# id
# <YOUR_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>

# secret
# <YOUR_GOOGLE_CLIENT_SECRET>
GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>

GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/callback/google

FRONTEND_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=druergfereu3
CLOUDINARY_API_KEY=244457348675954966
CLOUDINARY_API_SECRET=yxX2gtW1jfb40387t432q4vyknCU

```

---

### File: `.gitignore`

```text
// File: .gitignore

node_modules
.env
.env.*
!.env.example
dist

/src/generated


```

---

### File: `Tasks/Task-1.md`

```markdown
// File: Tasks/Task-1.md

# 📋 Task Assignment #1 - Healthcare API Development

**Project**: PH-HealthCare Backend  
**Module**: User Management System  
**Difficulty Level**: Beginner to Intermediate  
**Estimated Time**: 6-8 hours  
**Due Date**: [Your Instructor Will Provide]

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Tasks Overview](#tasks-overview)
5. [Detailed Task Instructions](#detailed-task-instructions)
6. [Testing Guidelines](#testing-guidelines)
7. [Submission Requirements](#submission-requirements)
8. [Grading Criteria](#grading-criteria)
9. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
10. [Help & Resources](#help--resources)

---

## 🎯 Overview

### What You Will Build

You will create **complete CRUD APIs** for three user roles in our healthcare system:

- **Admin** - Manages the platform
- **Super Admin** - Has highest level access
- **Doctor** - Already created (you'll add more features)

### Learning Objectives

By completing this assignment, you will learn:

- ✅ How to create RESTful APIs following industry standards
- ✅ How to implement authentication and authorization
- ✅ How to validate request data using Zod
- ✅ How to structure code professionally
- ✅ How to implement soft delete functionality
- ✅ How to handle database transactions
- ✅ How to work with TypeScript interfaces
- ✅ How to write clean, maintainable code

---

## 📋 Prerequisites

### What You Should Already Know

Before starting this assignment, make sure you understand:

1. **TypeScript Basics**
   - Types and Interfaces
   - Async/Await
   - Promises
2. **Express.js Basics**
   - Routes and Controllers
   - Middleware
   - Request and Response objects

3. **Prisma ORM**
   - Database queries (create, findMany, findUnique, update, delete)
   - Transactions
   - Relations

4. **Zod Validation**
   - Schema creation
   - Validation rules

### What You Should Review

Look at these existing files to understand the pattern:

- `src/app/modules/user/user.controller.ts` - See `createDoctor`
- `src/app/modules/user/user.service.ts` - See `createDoctor` function
- `src/app/modules/user/user.route.ts` - See how routes are structured
- `src/app/modules/user/user.interface.ts` - See interface patterns
- `src/app/modules/user/user.validation.ts` - See Zod validation

---

## 📁 Project Structure

You will work with these modules:

```
src/app/modules/
├── user/              # User Module (Create Admin & Super Admin)
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.route.ts
│   ├── user.interface.ts
│   └── user.validation.ts
│
├── doctor/            # Doctor Module (CRUD operations)
│   ├── doctor.controller.ts
│   ├── doctor.service.ts
│   ├── doctor.route.ts
│   ├── doctor.interface.ts
│   └── doctor.validation.ts
│
├── admin/             # Admin Module (CRUD operations)
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   ├── admin.route.ts
│   ├── admin.interface.ts
│   └── admin.validation.ts
│
└── superAdmin/        # Super Admin Module (CRUD operations)
    ├── superAdmin.controller.ts
    ├── superAdmin.service.ts
    ├── superAdmin.route.ts
    ├── superAdmin.interface.ts
    └── superAdmin.validation.ts
```

---

## 📝 Tasks Overview

### Module 1: User Module (2 APIs)

- [ ] Task 1.1: Create Admin API
- [ ] Task 1.2: Create Super Admin API

### Module 2: Doctor Module (4 APIs)

- [ ] Task 2.1: Get All Doctors API
- [ ] Task 2.2: Get Doctor by ID API
- [ ] Task 2.3: Update Doctor API
- [ ] Task 2.4: Soft Delete Doctor API

### Module 3: Admin Module (4 APIs)

- [ ] Task 3.1: Get All Admins API
- [ ] Task 3.2: Get Admin by ID API
- [ ] Task 3.3: Update Admin API
- [ ] Task 3.4: Soft Delete Admin API

### Module 4: Super Admin Module (4 APIs)

- [ ] Task 4.1: Get All Super Admins API
- [ ] Task 4.2: Get Super Admin by ID API
- [ ] Task 4.3: Update Super Admin API
- [ ] Task 4.4: Soft Delete Super Admin API

**Total**: 14 APIs to implement

---

## 🎓 Detailed Task Instructions

---

## 📦 MODULE 1: USER MODULE

### Task 1.1: Create Admin API

**Endpoint**: `POST /api/users/create-admin`  
**Access**: Only SUPER_ADMIN can create admins  
**Purpose**: Register a new admin in the system

#### Step 1: Create Interface (user.interface.ts)

```typescript
// Add this interface to user.interface.ts

export interface ICreateAdmin {
  password: string;
  admin: {
    name: string;
    email: string;
    profilePhoto?: string;
    contactNumber: string;
  };
}
```

**💡 Explanation**:

- This interface defines what data we need to create an admin
- `password` is for the user account
- `admin` object contains admin-specific information
- `?` means the field is optional

---

#### Step 2: Create Zod Validation Schema (user.validation.ts)

```typescript
// Add this to user.validation.ts

const createAdminValidationSchema = z.object({
  body: z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    admin: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.email("Invalid email format"),
      profilePhoto: z.url("Invalid URL format").optional(),
      contactNumber: z.string().min(1, "Contact number is required"),
    }),
  }),
});

// Export it
export const UserValidation = {
  createDoctorValidationSchema,
  createAdminValidationSchema, // Add this
};
```

**💡 Explanation - Zod v4 Syntax**:

- ✅ **NEW in v4**: Use `z.email()` directly (NOT `z.string().email()`)
- ✅ **NEW in v4**: Use `z.url()` directly (NOT `z.string().url()`)
- ✅ Error messages: Pass string directly as parameter: `.min(6, "message")`
- ✅ Old v3 syntax `{ message: "..." }` still works but direct string is cleaner
- `.optional()` - makes field optional

---

#### Step 3: Create Service Function (user.service.ts)

```typescript
// Add this function to user.service.ts

const createAdmin = async (payload: ICreateAdmin) => {
  // Step 1: Check if user already exists
  const userExists = await prisma.user.findUnique({
    where: {
      email: payload.admin.email,
    },
  });

  if (userExists) {
    throw new Error("User with this email already exists");
  }

  // Step 2: Create user account with Better Auth
  const userData = await auth.api.signUpEmail({
    body: {
      email: payload.admin.email,
      password: payload.password,
      role: UserRole.ADMIN,
      name: payload.admin.name,
      needPasswordChange: true,
      rememberMe: false,
    },
  });

  // Step 3: Create admin profile in transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create admin record
      const admin = await tx.admin.create({
        data: {
          userId: userData.user.id,
          name: payload.admin.name,
          email: payload.admin.email,
          profilePhoto: payload.admin.profilePhoto,
          contactNumber: payload.admin.contactNumber,
        },
      });

      // Fetch created admin with user data
      const createdAdmin = await tx.admin.findUnique({
        where: { id: admin.id },
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      });

      return createdAdmin;
    });

    return result;
  } catch (error) {
    // Cleanup: Delete user if admin creation fails
    await prisma.user.delete({
      where: { id: userData.user.id },
    });
    throw new Error("Failed to create admin");
  }
};

// Update the export
export const UserService = {
  createDoctor,
  createAdmin, // Add this
};
```

**💡 Explanation**:

- First we check if email already exists (prevent duplicates)
- Then we create the user account with Better Auth
- Then we create the admin profile in a transaction
- If anything fails, we delete the user account (cleanup)
- Transaction ensures data consistency

---

#### Step 4: Create Controller (user.controller.ts)

```typescript
// Add this to user.controller.ts

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createAdmin(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Admin created successfully",
    data: result,
  });
});

// Update the export
export const UserController = {
  createDoctor,
  createAdmin, // Add this
};
```

**💡 Explanation**:

- `catchAsync` automatically catches errors
- We call the service function with request body
- We send a formatted response with status 201 (Created)

---

#### Step 5: Create Route (user.route.ts)

```typescript
// Add this route to user.route.ts

router.post(
  "/create-admin",
  checkAuth("SUPER_ADMIN"), // Only super admin can create admin
  validateRequest(UserValidation.createAdminValidationSchema),
  UserController.createAdmin,
);
```

**💡 Explanation**:

- Route is `/create-admin`
- `checkAuth("SUPER_ADMIN")` ensures only super admins can access
- `validateRequest` validates the data using Zod schema
- Finally calls the controller function

---

#### ✅ Testing Task 1.1

**Test Case 1: Success**

```http
POST /api/users/create-admin
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
    "password": "admin123",
    "admin": {
        "name": "John Admin",
        "email": "john.admin@example.com",
        "contactNumber": "+1234567890",
        "profilePhoto": "https://example.com/photo.jpg"
    }
}
```

**Expected Response** (201 Created):

```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "id": "...",
    "name": "John Admin",
    "email": "john.admin@example.com",
    "contactNumber": "+1234567890",
    "user": {
      "id": "...",
      "role": "ADMIN"
    }
  }
}
```

**Test Case 2: Duplicate Email**

- Try creating admin with existing email
- Should get error: "User with this email already exists"

**Test Case 3: Validation Error**

- Try without password
- Should get validation error

**Test Case 4: Unauthorized**

- Try without token or with DOCTOR token
- Should get 403 Forbidden

---

### Task 1.2: Create Super Admin API

**Endpoint**: `POST /api/users/create-super-admin`  
**Access**: Only existing SUPER_ADMIN can create new super admins  
**Purpose**: Register a new super admin in the system

#### Instructions

Follow the **EXACT SAME PATTERN** as Task 1.1, but:

1. **Interface Name**: `ICreateSuperAdmin`
2. **Validation Name**: `createSuperAdminValidationSchema`
3. **Service Function**: `createSuperAdmin`
4. **Controller Function**: `createSuperAdmin`
5. **Route**: `/create-super-admin`
6. **Role**: `UserRole.SUPER_ADMIN`
7. **Table**: `superAdmin` (instead of `admin`)

#### Hints

- Super Admin fields are similar to Admin
- Check your Prisma schema for exact field names
- Use the same transaction pattern
- Use the same error handling

---

## 📦 MODULE 2: DOCTOR MODULE

First, create the Doctor module structure:

```bash
# Create folder and files
mkdir src/app/modules/doctor
touch src/app/modules/doctor/doctor.controller.ts
touch src/app/modules/doctor/doctor.service.ts
touch src/app/modules/doctor/doctor.route.ts
touch src/app/modules/doctor/doctor.interface.ts
touch src/app/modules/doctor/doctor.validation.ts
```

### Task 2.1: Get All Doctors API

**Endpoint**: `GET /api/doctors`  
**Access**: Any authenticated user (ADMIN, SUPER_ADMIN, DOCTOR)  
**Purpose**: Get list of all doctors with filtering and pagination

#### Step 1: Create Interface (doctor.interface.ts)

```typescript
// No filter interface needed - we'll just get all doctors
```

---

#### Step 2: Create Service Function (doctor.service.ts)

```typescript
import { prisma } from "../../lib/prisma";

const getAllDoctors = async () => {
  // Fetch all non-deleted doctors
  const result = await prisma.doctor.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      profilePhoto: true,
      contactNumber: true,
      registrationNumber: true,
      experience: true,
      gender: true,
      appointmentFee: true,
      qualification: true,
      currentWorkingPlace: true,
      designation: true,
      averageRating: true,
      createdAt: true,
      updatedAt: true,
      specialties: {
        select: {
          specialty: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  // Transform specialties (flatten structure)
  const doctors = result.map((doctor) => ({
    ...doctor,
    specialties: doctor.specialties.map((s) => s.specialty),
  }));

  return doctors;
};

export const DoctorService = {
  getAllDoctors,
};
```

**💡 Explanation**:

- Very simple logic - just fetch all doctors
- Only filter: exclude deleted doctors (`isDeleted: false`)
- Order by newest first (`createdAt: desc`)
- No pagination - returns all records
- No complex filtering or searching
- Transform specialties to flatten the structure

---

#### Step 3: Create Controller (doctor.controller.ts)

```typescript
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { DoctorService } from "./doctor.service";

const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
  const result = await DoctorService.getAllDoctors();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctors retrieved successfully",
    data: result,
  });

export const DoctorController = {
  getAllDoctors,
};
```

**💡 Explanation**:

- Very simple - just call the service function
- No need to handle query parameters
- Just send the data in response

---

#### Step 4: Create Route (doctor.route.ts)

```typescript
import express from "express";
import { DoctorController } from "./doctor.controller";
import { checkAuth } from "../../middlewares/checkAuth";

const router = express.Router();

// Get all doctors - accessible by ADMIN, SUPER_ADMIN, and DOCTOR
router.get(
  "/",
  checkAuth("ADMIN", "SUPER_ADMIN", "DOCTOR"),
  DoctorController.getAllDoctors,
);

export const DoctorRoutes = router;
```

**💡 Explanation - Role-Based Authentication**:

- `checkAuth("ADMIN", "SUPER_ADMIN", "DOCTOR")` means:
  - ✅ **ADMIN** can access (admins manage doctors)
  - ✅ **SUPER_ADMIN** can access (super admins have highest access)
  - ✅ **DOCTOR** can access (doctors can view other doctors)
  - ❌ **PATIENT** cannot access (not in the list)
  - ❌ Unauthenticated users cannot access (no token)

**💡 Tip**: Don't forget to register this route in `src/app/routes/index.ts`:

```typescript
{
    path: "/doctors",
    route: DoctorRoutes
}
```

---

#### ✅ Testing Task 2.1

**Test Case: Get All Doctors**

```http
GET /api/doctors
Authorization: Bearer <token>
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "data": [
    {
      "id": "...",
      "name": "Dr. John Doe",
      "email": "john@example.com",
      "contactNumber": "+1234567890",
      "specialties": [
        {
          "id": "...",
          "title": "Cardiology"
        }
      ],
      "appointmentFee": 100,
      "createdAt": "..."
    }
    // ... more doctors
  ]
}
```

---

### Task 2.2: Get Doctor by ID API

**Endpoint**: `GET /api/doctors/:id`  
**Access**: Any authenticated user  
**Purpose**: Get detailed information about a specific doctor

#### Step 1: Create Service Function

```typescript
const getDoctorById = async (id: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      specialties: {
        include: {
          specialty: true,
        },
      },
    },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  // Transform specialties to flatten structure
  return {
    ...doctor,
    specialties: doctor.specialties.map((s) => s.specialty),
  };
};

// Add to export
export const DoctorService = {
  getAllDoctors,
  getDoctorById,
};
```

**💡 Explanation**:

- Simple logic - find doctor by ID
- Filter out deleted doctors
- Use `include` to get related data (simpler than select)
- Transform specialties to remove junction table fields
- Throw error if doctor not found

````

---

#### Step 2: Create Controller

```typescript
const getDoctorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await DoctorService.getDoctorById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctor retrieved successfully",
    data: result,
  });
});

// Add to export
export const DoctorController = {
  getAllDoctors,
  getDoctorById,
};
````

---

#### Step 3: Create Route

```typescript
// Get doctor by ID - same access as above
router.get(
  "/:id",
  checkAuth("ADMIN", "SUPER_ADMIN", "DOCTOR"),
  DoctorController.getDoctorById,
);
```

---

#### ✅ Testing Task 2.2

```http
GET /api/doctors/019c2f7f-87f8-7078-951a-3b2326c8d60a
Authorization: Bearer <token>
```

---

### Task 2.3: Update Doctor API

**Endpoint**: `PATCH /api/doctors/:id`  
**Access**: ADMIN, SUPER_ADMIN, or the DOCTOR themselves  
**Purpose**: Update doctor information

#### Step 1: Create Interface

```typescript
export interface IUpdateDoctor {
  name?: string;
  profilePhoto?: string;
  contactNumber?: string;
  registrationNumber?: string;
  experience?: number;
  gender?: string;
  appointmentFee?: number;
  qualification?: string;
  currentWorkingPlace?: string;
  designation?: string;
  specialties?: string[]; // Array of specialty IDs to update
}
```

---

#### Step 2: Create Validation Schema

```typescript
const updateDoctorValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    profilePhoto: z.url("Invalid URL format").optional(),
    contactNumber: z.string().optional(),
    registrationNumber: z.string().optional(),
    experience: z
      .int("Experience must be a whole number")
      .min(0, "Experience cannot be negative")
      .optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    appointmentFee: z
      .number()
      .positive("Appointment fee must be positive")
      .optional(),
    qualification: z.string().optional(),
    currentWorkingPlace: z.string().optional(),
    designation: z.string().optional(),
    specialties: z
      .array(z.uuid("Each specialty ID must be a valid UUID"))
      .optional(),
  }),
});

export const DoctorValidation = {
  updateDoctorValidationSchema,
};
```

**💡 Important - Zod v4 Changes**:

- ✅ `z.url()` - NOT `z.string().url()`
- ✅ `z.uuid()` - NOT `z.string().uuid()`
- ✅ `z.int()` - NOT `z.number().int()`
- ✅ `z.email()` - NOT `z.string().email()`
- ✅ `z.enum([...])` - Just pass array directly (error message optional)

```typescript
const updateDoctor = async (id: string, payload: IUpdateDoctor) => {
  // Check if doctor exists and not deleted
  const existingDoctor = await prisma.doctor.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existingDoctor) {
    throw new Error("Doctor not found");
  }

  // Separate specialties from doctor data
  const { specialties, ...doctorData } = payload;

  // Update doctor basic information
  const updatedDoctor = await prisma.doctor.update({
    where: { id },
    data: doctorData,
    include: {
      specialties: {
        include: {
          specialty: true,
        },
      },
    },
  });

  // If specialties are provided, update them separately
  if (specialties && specialties.length > 0) {
    // Delete old specialties
    await prisma.doctorSpecialty.deleteMany({
      where: { doctorId: id },
    });

    // Add new specialties
    const specialtiesData = specialties.map((specialtyId) => ({
      doctorId: id,
      specialtyId,
    }));

    await prisma.doctorSpecialty.createMany({
      data: specialtiesData,
    });

    // Fetch updated doctor with new specialties
    const result = await prisma.doctor.findUnique({
      where: { id },
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    return {
      ...result,
      specialties: result?.specialties.map((s) => s.specialty) || [],
    };
  }

  // Return updated doctor with transformed specialties
  return {
    ...updatedDoctor,
    specialties: updatedDoctor.specialties.map((s) => s.specialty),
  };
};

// Add to export
export const DoctorService = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
};
```

**💡 Explanation**:

- First check if doctor exists and is not deleted
- Separate specialties from other doctor data
- Update basic doctor info using Prisma update
- If specialties provided, delete old ones and create new ones
- Fetch updated doctor with new specialties
- Transform specialties to flatten structure
- Return updated doctor with clean specialty array

````

---

#### Step 4: Create Controller

```typescript
const updateDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await DoctorService.updateDoctor(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctor updated successfully",
    data: result,
  });
});

// Add to export
export const DoctorController = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
};
````

---

#### Step 5: Create Route

```typescript
import { validateRequest } from "../../middlewares/validateRequest";
import { DoctorValidation } from "./doctor.validation";

// Update doctor - ADMIN, SUPER_ADMIN, or the DOCTOR themselves
router.patch(
  "/:id",
  checkAuth("ADMIN", "SUPER_ADMIN", "DOCTOR"),
  validateRequest(DoctorValidation.updateDoctorValidationSchema),
  DoctorController.updateDoctor,
);

// 💡 Note: DOCTOR can update their own profile
// In production, you should add logic to ensure doctors can only update their own profile
```

---

#### ✅ Testing Task 2.3

```http
PATCH /api/doctors/019c2f7f-87f8-7078-951a-3b2326c8d60a
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "Dr. Updated Name",
    "appointmentFee": 150,
    "specialties": ["specialty-id-1", "specialty-id-2"]
}
```

---

### Task 2.4: Soft Delete Doctor API

**Endpoint**: `DELETE /api/doctors/:id`  
**Access**: ADMIN, SUPER_ADMIN only  
**Purpose**: Soft delete a doctor (mark as deleted, don't remove from database)

#### Step 1: Create Service Function

```typescript
const softDeleteDoctor = async (id: string) => {
  // Check if doctor exists and not already deleted
  const doctor = await prisma.doctor.findUnique({
    where: { id },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  if (doctor.isDeleted) {
    throw new Error("Doctor is already deleted");
  }

  // Mark doctor as deleted
  const result = await prisma.doctor.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return result;
};

// Add to export
export const DoctorService = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  softDeleteDoctor,
};
```

**💡 Explanation**:

- Check if doctor exists
- Check if already deleted (prevent duplicate deletion)
- Update `isDeleted` to `true` and set `deletedAt` timestamp
- This is called "soft delete" - data stays in database but marked as deleted
- Return the updated doctor record

````

**💡 Note**: Make sure your Prisma schema has `deletedAt` field:

```prisma
model Doctor {
  // ... other fields
  isDeleted  Boolean   @default(false)
  deletedAt  DateTime?
}
````

---

#### Step 2: Create Controller

```typescript
const softDeleteDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await DoctorService.softDeleteDoctor(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctor deleted successfully",
    data: result,
  });
});

// Add to export
export const DoctorController = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  softDeleteDoctor,
};
```

---

#### Step 3: Create Route

```typescript
// Soft delete doctor - ONLY ADMIN and SUPER_ADMIN can delete
router.delete(
  "/:id",
  checkAuth("ADMIN", "SUPER_ADMIN"),
  DoctorController.softDeleteDoctor,
);

// 💡 Security Note:
// - Doctors CANNOT delete themselves
// - Doctors CANNOT delete other doctors
// - Only ADMIN and SUPER_ADMIN have delete permission
```

---

#### ✅ Testing Task 2.4

```http
DELETE /api/doctors/019c2f7f-87f8-7078-951a-3b2326c8d60a
Authorization: Bearer <admin_token>
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Doctor deleted successfully",
  "data": {
    "id": "019c2f7f-87f8-7078-951a-3b2326c8d60a",
    "isDeleted": true,
    "deletedAt": "2026-02-06T10:30:00.000Z"
  }
}
```

---

## 📦 MODULE 3: ADMIN MODULE

### Overview

Now you need to implement the **EXACT SAME 4 CRUD operations** for Admin module:

1. **Get All Admins** - Fetch all non-deleted admins (no pagination/filtering)
2. **Get Admin by ID** - Fetch single admin by ID
3. **Update Admin** - Update admin information
4. **Soft Delete Admin** - Mark admin as deleted

### Instructions

Follow the **SAME SIMPLE PATTERN** as Doctor Module (Tasks 2.1 to 2.4), but:

1. **Replace** `Doctor` with `Admin` everywhere
2. **Replace** `doctor` with `admin` everywhere
3. **Remove** specialties logic (Admin doesn't have specialties)
4. **Check** Prisma schema: `prisma/schema/admin.prisma` for exact field names
5. **Use same Zod v4 syntax**: `z.email()`, `z.url()`, etc.

### Key Differences from Doctor Module:

- ❌ **No specialties** - Remove all specialty-related code
- ✅ **Simpler structure** - Just basic admin fields
- ✅ **Same patterns** - getAllAdmins, getAdminById, updateAdmin, softDeleteAdmin

### Admin Module Structure

```
src/app/modules/admin/
├── admin.controller.ts
├── admin.service.ts
├── admin.route.ts
├── admin.interface.ts
└── admin.validation.ts
```

### Admin Fields (Check your schema)

Typical Admin fields:

- id
- userId
- name
- email
- profilePhoto
- contactNumber
- isDeleted
- deletedAt
- createdAt
- updatedAt

### Checklist for Admin Module

- [ ] Task 3.1: Get All Admins
  - [ ] Create interface `IAdminFilterRequest`
  - [ ] Create service `getAllAdmins`
  - [ ] Create controller `getAllAdmins`
  - [ ] Create route `GET /api/admins`
  - [ ] Test with different filters
- [ ] Task 3.2: Get Admin by ID
  - [ ] Create service `getAdminById`
  - [ ] Create controller `getAdminById`
  - [ ] Create route `GET /api/admins/:id`
  - [ ] Test with valid and invalid IDs
- [ ] Task 3.3: Update Admin
  - [ ] Create interface `IUpdateAdmin`
  - [ ] Create validation schema `updateAdminValidationSchema`
  - [ ] Create service `updateAdmin`
  - [ ] Create controller `updateAdmin`
  - [ ] Create route `PATCH /api/admins/:id`
  - [ ] Test update operations
- [ ] Task 3.4: Soft Delete Admin
  - [ ] Create service `softDeleteAdmin`
  - [ ] Create controller `softDeleteAdmin`
  - [ ] Create route `DELETE /api/admins/:id`
  - [ ] Test deletion

---

## 📦 MODULE 4: SUPER ADMIN MODULE

### Overview

Implement the **SAME 4 CRUD operations** for Super Admin module:

1. Get All Super Admins
2. Get Super Admin by ID
3. Update Super Admin
4. Soft Delete Super Admin

### Instructions

Follow the **SAME PATTERN** as Admin Module, but:

1. Replace `Admin` with `SuperAdmin` everywhere
2. Replace `admin` with `superAdmin` everywhere
3. Route path: `/api/super-admins` (with hyphen)
4. Check Prisma schema for SuperAdmin model fields

### Super Admin Module Structure

```
src/app/modules/superAdmin/
├── superAdmin.controller.ts
├── superAdmin.service.ts
├── superAdmin.route.ts
├── superAdmin.interface.ts
└── superAdmin.validation.ts
```

### Checklist for Super Admin Module

- [ ] Task 4.1: Get All Super Admins
- [ ] Task 4.2: Get Super Admin by ID
- [ ] Task 4.3: Update Super Admin
- [ ] Task 4.4: Soft Delete Super Admin

---

## 📦 MODULE 5: DATABASE SCHEMA MODELS

### 🎯 Overview

Before building APIs, you need to create the database schema for the remaining healthcare features. You will create **6 new Prisma models** with proper relationships.

**Purpose**: These models will store data for appointments, schedules, reviews, patient health records, and medical reports.

---

### Task 5.1: Create Schedule Model

**File**: `prisma/schema/schedule.prisma`

**Purpose**: Doctors set their available time slots for appointments.

#### Step-by-Step Instructions

1. **Create the file** `prisma/schema/schedule.prisma`

2. **Add this code**:

```prisma
model Schedule {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  startDate DateTime
  endDate   DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  doctorSchedules DoctorSchedules[]

  @@map("schedules")
}
```

**💡 Explanation**:

- `id` - Unique identifier for each schedule slot
- `startDate` - When the schedule slot starts (e.g., "2026-02-10 09:00:00")
- `endDate` - When the schedule slot ends (e.g., "2026-02-10 10:00:00")
- `doctorSchedules` - **One schedule can be assigned to many doctors** (one-to-many relationship)
- `@@map("schedules")` - Database table name

**🔗 Relationship**: One schedule → Many doctors can use it

---

### Task 5.2: Create DoctorSchedules Model (Junction Table)

**File**: `prisma/schema/doctor.prisma` (add to existing file)

**Purpose**: Links doctors to their available schedules. This is a **many-to-many** relationship between Doctor and Schedule.

#### Step-by-Step Instructions

Add this model to `prisma/schema/doctor.prisma`:

```prisma
model DoctorSchedules {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  doctorId   String   @db.Uuid
  scheduleId String   @db.Uuid
  isBooked   Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  doctor   Doctor   @relation(fields: [doctorId], references: [id])
  schedule Schedule @relation(fields: [scheduleId], references: [id])

  // An appointment is associated with this specific doctor's schedule slot
  appointment Appointment?

  @@unique([doctorId, scheduleId])
  @@map("doctor_schedules")
}
```

**💡 Explanation**:

- `doctorId` - Which doctor?
- `scheduleId` - Which time slot?
- `isBooked` - Is this slot already booked? (true/false)
- `doctor` - Points to the Doctor model
- `schedule` - Points to the Schedule model
- `appointment` - One slot can have ONE appointment (one-to-one)
- `@@unique([doctorId, scheduleId])` - **Same doctor cannot have same schedule twice**

**🔗 Relationships**:

- Many doctors → Many schedules (through this junction table)
- One doctor schedule slot → One appointment

---

### Task 5.3: Update Doctor Model

**File**: `prisma/schema/doctor.prisma`

Add this field to the existing Doctor model:

```prisma
model Doctor {
  // ... existing fields ...

  // Add this new relation field:
  doctorSchedules DoctorSchedules[]

  // ... rest of existing fields ...
}
```

**💡 Explanation**: One doctor can have many schedule slots.

---

### Task 5.4: Create Appointment Model

**File**: `prisma/schema/appointment.prisma`

**Purpose**: Stores all appointment bookings between patients and doctors.

#### Step-by-Step Instructions

1. **Create the file** `prisma/schema/appointment.prisma`

2. **Add this code**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

model Appointment {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  patientId          String   @db.Uuid
  doctorId           String   @db.Uuid
  doctorScheduleId   String   @unique @db.Uuid
  videoCallingId     String
  status             AppointmentStatus @default(SCHEDULED)
  paymentStatus      PaymentStatus @default(UNPAID)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  // Relations
  patient        Patient         @relation(fields: [patientId], references: [id])
  doctor         Doctor          @relation(fields: [doctorId], references: [id])
  doctorSchedule DoctorSchedules @relation(fields: [doctorScheduleId], references: [id])

  // One appointment can have one payment, review, prescription, and medical report
  payment         Payment?
  review          Review?
  prescription    Prescription?
  medicalReport   MedicalReport?

  @@map("appointments")
}
```

**💡 Explanation**:

- `patientId` - Which patient booked this?
- `doctorId` - Which doctor?
- `doctorScheduleId` - Which specific time slot? (UNIQUE - one slot = one appointment)
- `videoCallingId` - ID for video call link
- `status` - SCHEDULED, INPROGRESS, COMPLETED, CANCELED
- `paymentStatus` - PAID or UNPAID
- `patient`, `doctor`, `doctorSchedule` - Foreign key relationships
- `payment`, `review`, `prescription`, `medicalReport` - Optional one-to-one relationships

**🔗 Relationships**:

- One patient → Many appointments
- One doctor → Many appointments
- One doctor schedule slot → ONE appointment (unique)
- One appointment → One payment (optional)
- One appointment → One review (optional)
- One appointment → One prescription (optional)
- One appointment → One medical report (optional)

---

### Task 5.5: Create Review Model

**File**: `prisma/schema/review.prisma`

**Purpose**: Patients can review doctors after appointments.

#### Step-by-Step Instructions

1. **Create the file** `prisma/schema/review.prisma`

2. **Add this code**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

model Review {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  patientId     String   @db.Uuid
  doctorId      String   @db.Uuid
  appointmentId String   @unique @db.Uuid
  rating        Float
  comment       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  patient     Patient     @relation(fields: [patientId], references: [id])
  doctor      Doctor      @relation(fields: [doctorId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])

  @@map("reviews")
}
```

**💡 Explanation**:

- `patientId` - Who wrote the review?
- `doctorId` - Who is being reviewed?
- `appointmentId` - Which appointment? (UNIQUE - one review per appointment)
- `rating` - Star rating (e.g., 4.5 out of 5)
- `comment` - Optional text review
- All three relations connect to their respective models

**🔗 Relationships**:

- One patient → Many reviews (can review multiple doctors)
- One doctor → Many reviews (can be reviewed by multiple patients)
- One appointment → ONE review (unique)

---

### Task 5.6: Create PatientHealthData Model

**File**: `prisma/schema/patientHealthData.prisma`

**Purpose**: Stores patient's health information like blood type, allergies, etc.

#### Step-by-Step Instructions

1. **Create the file** `prisma/schema/patientHealthData.prisma`

2. **Add this code**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

model PatientHealthData {
  id                  String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  patientId           String        @unique @db.Uuid
  gender              Gender
  dateOfBirth         DateTime
  bloodGroup          BloodGroup
  hasAllergies        Boolean       @default(false)
  hasDiabetes         Boolean       @default(false)
  height              String
  weight              String
  smokingStatus       Boolean       @default(false)
  dietaryPreferences  String?
  pregnancyStatus     Boolean       @default(false)
  mentalHealthHistory String?
  immunizationStatus  String?
  hasPastSurgeries    Boolean       @default(false)
  recentAnxiety       Boolean       @default(false)
  recentDepression    Boolean       @default(false)
  maritalStatus       MaritalStatus @default(UNMARRIED)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  // Relations
  patient Patient @relation(fields: [patientId], references: [id])

  @@map("patient_health_data")
}
```

**💡 Explanation**:

- `patientId` - Which patient? (UNIQUE - one patient = one health data record)
- Health fields - All medical information about the patient
- `gender`, `bloodGroup`, `maritalStatus` - Use enums (must be defined in `enums.prisma`)
- Boolean fields - Simple yes/no questions (hasAllergies, hasDiabetes, etc.)
- Optional fields (`?`) - Can be null

**🔗 Relationship**: One patient → ONE health data record (one-to-one)

---

### Task 5.7: Create MedicalReport Model

**File**: `prisma/schema/medicalReport.prisma`

**Purpose**: Doctors create medical reports after appointments.

#### Step-by-Step Instructions

1. **Create the file** `prisma/schema/medicalReport.prisma`

2. **Add this code**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

model MedicalReport {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  patientId     String   @db.Uuid
  doctorId      String   @db.Uuid
  appointmentId String   @unique @db.Uuid
  diagnosis     String
  treatment     String
  followUpDate  DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  patient     Patient     @relation(fields: [patientId], references: [id])
  doctor      Doctor      @relation(fields: [doctorId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])

  @@map("medical_reports")
}
```

**💡 Explanation**:

- `patientId` - Which patient?
- `doctorId` - Which doctor created this?
- `appointmentId` - For which appointment? (UNIQUE - one report per appointment)
- `diagnosis` - What's the problem?
- `treatment` - What's the solution?
- `followUpDate` - When should patient come back? (optional)

**🔗 Relationships**:

- One patient → Many medical reports
- One doctor → Many medical reports (they can create many)
- One appointment → ONE medical report (unique)

---

### Task 5.8: Update Patient and Doctor Models

**File**: `prisma/schema/patient.prisma`

Add these relation fields to the existing Patient model:

```prisma
model Patient {
  // ... existing fields ...

  // Add these new relation fields:
  patientHealthData PatientHealthData?
  appointments      Appointment[]
  reviews           Review[]
  medicalReports    MedicalReport[]

  // ... rest of existing fields ...
}
```

**File**: `prisma/schema/doctor.prisma`

Add these relation fields to the existing Doctor model:

```prisma
model Doctor {
  // ... existing fields ...

  // Add these new relation fields:
  appointments      Appointment[]
  reviews           Review[]
  medicalReports    MedicalReport[]

  // ... rest of existing fields ...
}
```

---

### Task 5.9: Update Enums (If Not Present)

**File**: `prisma/schema/enums.prisma`

Make sure these enums exist. Add any missing ones:

```prisma
enum AppointmentStatus {
  SCHEDULED
  INPROGRESS
  COMPLETED
  CANCELED
}

enum PaymentStatus {
  PAID
  UNPAID
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum BloodGroup {
  A_POSITIVE
  A_NEGATIVE
  B_POSITIVE
  B_NEGATIVE
  AB_POSITIVE
  AB_NEGATIVE
  O_POSITIVE
  O_NEGATIVE
}

enum MaritalStatus {
  MARRIED
  UNMARRIED
  DIVORCED
  WIDOWED
}
```

---

### 🎯 Understanding the Complete ERD (Entity Relationship Diagram)

Here's how all models connect:

```
Patient
  ├─ ONE-TO-ONE → PatientHealthData
  ├─ ONE-TO-MANY → Appointment
  ├─ ONE-TO-MANY → Review
  └─ ONE-TO-MANY → MedicalReport

Doctor
  ├─ ONE-TO-MANY → DoctorSchedules
  ├─ ONE-TO-MANY → Appointment
  ├─ ONE-TO-MANY → Review
  └─ ONE-TO-MANY → MedicalReport

Schedule
  └─ ONE-TO-MANY → DoctorSchedules

DoctorSchedules (Junction Table)
  ├─ MANY-TO-ONE → Doctor
  ├─ MANY-TO-ONE → Schedule
  └─ ONE-TO-ONE → Appointment

Appointment
  ├─ MANY-TO-ONE → Patient
  ├─ MANY-TO-ONE → Doctor
  ├─ ONE-TO-ONE → DoctorSchedules
  ├─ ONE-TO-ONE → Payment (optional)
  ├─ ONE-TO-ONE → Review (optional)
  ├─ ONE-TO-ONE → Prescription (optional)
  └─ ONE-TO-ONE → MedicalReport (optional)

Review
  ├─ MANY-TO-ONE → Patient
  ├─ MANY-TO-ONE → Doctor
  └─ ONE-TO-ONE → Appointment

MedicalReport
  ├─ MANY-TO-ONE → Patient
  ├─ MANY-TO-ONE → Doctor
  └─ ONE-TO-ONE → Appointment
```

---

### 📋 Relationship Types Explained

#### 1. **One-to-One (1:1)**

**Example**: Patient ↔ PatientHealthData

- One patient has EXACTLY ONE health data record
- One health data record belongs to EXACTLY ONE patient

**Prisma Code**:

```prisma
// In Patient model
patientHealthData PatientHealthData?

// In PatientHealthData model
patient Patient @relation(fields: [patientId], references: [id])
patientId String @unique @db.Uuid  // UNIQUE makes it one-to-one
```

#### 2. **One-to-Many (1:N)**

**Example**: Patient → Appointments

- One patient can have MANY appointments
- One appointment belongs to EXACTLY ONE patient

**Prisma Code**:

```prisma
// In Patient model
appointments Appointment[]  // Array means "many"

// In Appointment model
patient Patient @relation(fields: [patientId], references: [id])
patientId String @db.Uuid  // Not unique, so many appointments can have same patient
```

#### 3. **Many-to-Many (M:N)**

**Example**: Doctor ↔ Schedule (through DoctorSchedules)

- One doctor can have MANY schedules
- One schedule can belong to MANY doctors
- **Need a junction table** (DoctorSchedules) to connect them

**Prisma Code**:

```prisma
// Doctor model
doctorSchedules DoctorSchedules[]

// Schedule model
doctorSchedules DoctorSchedules[]

// Junction table: DoctorSchedules
model DoctorSchedules {
  doctor Doctor @relation(fields: [doctorId], references: [id])
  schedule Schedule @relation(fields: [scheduleId], references: [id])
  @@unique([doctorId, scheduleId])  // Prevents duplicates
}
```

---

### ✅ Schema Checklist

Before running migrations, verify:

- [ ] All files created in correct locations
- [ ] All `generator client` blocks have same `output` path
- [ ] All relations are bidirectional (both sides defined)
- [ ] All foreign keys use `@db.Uuid` type
- [ ] All enum values match (check `enums.prisma`)
- [ ] All `@@unique` constraints are in place
- [ ] All `@@map()` directives use snake_case
- [ ] No typos in field names or model names

---

### 🚀 Running Migrations

After creating all schema files:

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_healthcare_models

# Open Prisma Studio to verify
npx prisma studio
```

**💡 Common Errors**:

1. **"Field X does not exist"** → Check spelling in relations
2. **"Generator output conflicts"** → Make sure all `output` paths are same
3. **"Enum Y is not defined"** → Add enum to `enums.prisma`
4. **"Foreign key constraint fails"** → Check if foreign key field types match

---

### 🎓 Why These Models Matter

| Model                 | Purpose in Healthcare System                              |
| --------------------- | --------------------------------------------------------- |
| **Schedule**          | Defines available time slots doctors can work             |
| **DoctorSchedules**   | Assigns specific time slots to specific doctors           |
| **Appointment**       | Records patient bookings with doctors                     |
| **Review**            | Allows patients to rate and review doctors                |
| **PatientHealthData** | Stores complete medical history of patients               |
| **MedicalReport**     | Doctor's diagnosis and treatment notes after appointments |

---

### 💡 Real-World Example Flow

1. **Admin creates schedule**: "Monday 9 AM - 10 AM"
2. **Doctor adds to their schedule**: "I'm available Monday 9-10 AM"
3. **Patient books appointment**: Selects doctor + time slot
4. **Doctor sees patient**: Appointment happens
5. **Doctor creates medical report**: Diagnosis + treatment
6. **Patient leaves review**: 5-star rating + comment
7. **System calculates**: Doctor's average rating updates

---

## 🧪 Testing Guidelines

### Tools You'll Need

1. **Postman** or **Thunder Client** (VS Code Extension)
2. **Database GUI** (Prisma Studio, pgAdmin, etc.)

### Testing Checklist for Each API

For **EVERY** API you create, test:

1. ✅ **Success Case**
   - Valid data
   - Valid token
   - Correct permissions

2. ✅ **Validation Error**
   - Missing required fields
   - Invalid data format
   - Invalid data types

3. ✅ **Authentication Error**
   - No token
   - Invalid token
   - Expired token

4. ✅ **Authorization Error**
   - Wrong role (DOCTOR trying to access ADMIN-only endpoint)

5. ✅ **Not Found Error**
   - Invalid ID
   - Deleted record

6. ✅ **Duplicate Error** (for Create APIs)
   - Existing email

### Sample Test Cases Document

Create a file `TEST_CASES.md` and document each test:

```markdown
## API: Create Admin

### Test Case 1: Success

- **Input**: Valid admin data with super admin token
- **Expected**: 201 Created with admin data
- **Actual**: ✅ Passed

### Test Case 2: Duplicate Email

- **Input**: Existing email
- **Expected**: 400 Bad Request
- **Actual**: ✅ Passed

...
```

---

## 📤 Submission Requirements

### What to Submit

1. **Source Code**
   - All module files (controller, service, route, interface, validation)
   - Updated route index file
   - Any helper utilities you created

2. **Documentation**
   - `TEST_CASES.md` - All your test cases and results
   - `IMPLEMENTATION_NOTES.md` - Any challenges, solutions, or notes
   - Screenshots of successful API tests (at least 2 per module)

3. **Database**
   - Include sample data (at least 2 records per role)
   - Prisma schema changes (if any)

### Submission Format

```
Your Name - Task Assignment 1
├── src/
│   └── app/
│       └── modules/
│           ├── user/
│           ├── doctor/
│           ├── admin/
│           └── superAdmin/
├── TEST_CASES.md
├── IMPLEMENTATION_NOTES.md
└── screenshots/
    ├── create-admin-success.png
    ├── get-doctors-success.png
    └── ...
```

### Submission Method

[Your instructor will specify: GitHub, Email, LMS, etc.]

---

## 📊 Grading Criteria

### Total Points: 100

| Category          | Points | Description                                     |
| ----------------- | ------ | ----------------------------------------------- |
| **Code Quality**  | 30     | Clean code, proper naming, comments, structure  |
| **Functionality** | 40     | All APIs work correctly, handle errors properly |
| **Validation**    | 10     | Proper Zod validation, error messages           |
| **Testing**       | 10     | Comprehensive test cases, documentation         |
| **Documentation** | 10     | Clear notes, good README, comments              |

### Detailed Rubric

#### Code Quality (30 points)

- [10] Follows existing project patterns
- [10] Proper TypeScript usage (types, interfaces)
- [5] Meaningful variable/function names
- [5] Code is well-commented

#### Functionality (40 points)

- [20] All CRUD operations work correctly
- [10] Proper error handling
- [5] Transaction handling for Create operations
- [5] Soft delete implemented correctly

#### Validation (10 points)

- [5] All required fields validated
- [3] Proper Zod schemas
- [2] Meaningful error messages

#### Testing (10 points)

- [5] All APIs tested with success cases
- [3] Error cases tested
- [2] Edge cases tested

#### Documentation (10 points)

- [5] TEST_CASES.md complete
- [3] IMPLEMENTATION_NOTES.md helpful
- [2] Code comments present

---

## ❌ Common Mistakes to Avoid

### 1. Wrong Field Names

❌ **Wrong**:

```typescript
phone: true; // Field doesn't exist in schema
```

✅ **Correct**:

```typescript
contactNumber: true; // Use actual field name from Prisma schema
```

**Solution**: Always check your Prisma schema file first!

---

### 2. Forgetting to Check isDeleted

❌ **Wrong**:

```typescript
const doctor = await prisma.doctor.findUnique({
  where: { id },
});
// Returns deleted doctors too!
```

✅ **Correct**:

```typescript
const doctor = await prisma.doctor.findUnique({
  where: {
    id,
    isDeleted: false, // ✅ Exclude deleted
  },
});
```

---

### 3. Not Using Transactions for Multi-Step Operations

❌ **Wrong**:

```typescript
// Create admin
const admin = await prisma.admin.create({...});

// If this fails, admin is already created! ❌
await prisma.adminRole.create({...});
```

✅ **Correct**:

```typescript
await prisma.$transaction(async (tx) => {
    const admin = await tx.admin.create({...});
    await tx.adminRole.create({...});
    // Both succeed or both fail ✅
});
```

---

### 4. Forgetting to Export Functions

❌ **Wrong**:

```typescript
export const AdminService = {
  getAllAdmins,
  getAdminById,
  // ❌ Forgot to add updateAdmin
};
```

✅ **Correct**:

```typescript
export const AdminService = {
  getAllAdmins,
  getAdminById,
  updateAdmin, // ✅ Added
  softDeleteAdmin, // ✅ Added
};
```

---

### 5. Wrong HTTP Status Codes

❌ **Wrong**:

```typescript
// Creating resource
sendResponse(res, {
    statusCode: 200,  // ❌ Wrong! 200 is for general success
    ...
});
```

✅ **Correct**:

```typescript
// Creating resource
sendResponse(res, {
    statusCode: 201,  // ✅ Correct! 201 is for Created
    ...
});
```

**Status Code Guide**:

- `200` - OK (GET, UPDATE)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized (No/Invalid Token)
- `403` - Forbidden (Wrong Role)
- `404` - Not Found
- `500` - Internal Server Error

---

### 6. Not Cleaning Up on Error

❌ **Wrong**:

```typescript
const userData = await auth.api.signUpEmail({...});

// If this fails, user account is orphaned! ❌
await prisma.admin.create({
    userId: userData.user.id,
    ...
});
```

✅ **Correct**:

```typescript
const userData = await auth.api.signUpEmail({...});

try {
    await prisma.admin.create({...});
} catch (error) {
    // ✅ Cleanup: Delete the user
    await prisma.user.delete({
        where: { id: userData.user.id }
    });
    throw error;
}
```

---

### 7. Inconsistent Naming

❌ **Wrong**:

```typescript
// File: doctorController.ts
export const DoctorController = {
  getAllDoctor, // ❌ Missing 's'
  getDoctorByID, // ❌ Capital ID
  update_doctor, // ❌ Snake case
};
```

✅ **Correct**:

```typescript
// File: doctor.controller.ts
export const DoctorController = {
  getAllDoctors, // ✅ Plural
  getDoctorById, // ✅ Camel case
  updateDoctor, // ✅ Consistent
};
```

---

### 8. Not Validating Role Access

❌ **Wrong**:

```typescript
// Anyone can delete doctors! ❌
router.delete("/:id", DoctorController.softDeleteDoctor);
```

✅ **Correct**:

```typescript
// Only admins can delete ✅
router.delete(
  "/:id",
  checkAuth("ADMIN", "SUPER_ADMIN"),
  DoctorController.softDeleteDoctor,
);
```

---

### 9. Hardcoding Values

❌ **Wrong**:

```typescript
const limit = 10; // ❌ Hardcoded
const page = 1; // ❌ Hardcoded
```

✅ **Correct**:

```typescript
const { limit = 10, page = 1 } = options; // ✅ From request
```

---

### 10. Not Handling Null/Undefined

❌ **Wrong**:

```typescript
const doctor = {
  ...result,
  specialties: result.specialties.map((s) => s.specialty),
  // ❌ Crashes if specialties is null
};
```

✅ **Correct**:

```typescript
const doctor = {
  ...result,
  specialties: result?.specialties?.map((s) => s.specialty) || [],
  // ✅ Safe with optional chaining and default value
};
```

---

## 📚 Help & Resources

### When You're Stuck

1. **Review the Create Doctor Implementation**
   - It's your reference for the pattern
   - See how it's structured
   - Copy the pattern, change the names

2. **Check Prisma Schema**
   - Location: `prisma/schema/`
   - Verify field names
   - Check relationships

3. **Use TypeScript IntelliSense**
   - Let VS Code autocomplete show you available fields
   - Hover over types to see structure

4. **Check Existing Middleware**
   - `checkAuth` - for authentication
   - `validateRequest` - for validation
   - `catchAsync` - for error handling

5. **Look at Error Messages**
   - Prisma errors tell you what's wrong
   - Validation errors show which field failed
   - TypeScript errors show type mismatches

### Useful Commands

```bash
# Run development server
pnpm dev

# Open Prisma Studio (view database)
pnpm studio

# Generate Prisma Client (after schema changes)
pnpm prisma generate

# Format code
pnpm format

# Check types
pnpm type-check
```

### Questions?

If you're stuck for more than 30 minutes on the same issue:

1. Write down exactly what you tried
2. Write down the exact error message
3. Ask your instructor/mentor
4. Include code snippets in your question

### Office Hours

[Your instructor will specify times and method]

---

## ✅ Pre-Submission Checklist

Before submitting, verify:

### Module 1: User Module

- [ ] Create Admin API works
- [ ] Create Super Admin API works
- [ ] Both use Better Auth
- [ ] Both handle cleanup on error
- [ ] Both use Zod validation
- [ ] Both use checkAuth middleware
- [ ] Tested with Postman/Thunder Client

### Module 2: Doctor Module

- [ ] Get All Doctors works with filters
- [ ] Get Doctor by ID works
- [ ] Update Doctor works
- [ ] Soft Delete Doctor works
- [ ] All use checkAuth middleware
- [ ] All handle errors properly
- [ ] Tested all endpoints

### Module 3: Admin Module

- [ ] Get All Admins works
- [ ] Get Admin by ID works
- [ ] Update Admin works
- [ ] Soft Delete Admin works
- [ ] All endpoints tested

### Module 4: Super Admin Module

- [ ] Get All Super Admins works
- [ ] Get Super Admin by ID works
- [ ] Update Super Admin works
- [ ] Soft Delete Super Admin works
- [ ] All endpoints tested

### Code Quality

- [ ] No TypeScript errors
- [ ] No console.logs in production code
- [ ] Proper error messages
- [ ] Code is formatted
- [ ] Variables have meaningful names
- [ ] Functions have proper JSDoc comments

### Documentation

- [ ] TEST_CASES.md complete
- [ ] IMPLEMENTATION_NOTES.md written
- [ ] Screenshots included
- [ ] All tests documented

### Testing

- [ ] All success cases pass
- [ ] All error cases handled
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Validation tested

---

## 🎉 Conclusion

This assignment will give you hands-on experience with:

- ✅ Building RESTful APIs
- ✅ Working with databases
- ✅ Implementing authentication/authorization
- ✅ Data validation
- ✅ Error handling
- ✅ Code organization
- ✅ Professional development practices

**Remember**:

- Take your time
- Test thoroughly
- Ask questions when stuck
- Follow the patterns shown
- Write clean code

**Good luck! You've got this! 🚀**

---

## 📞 Support

If you need help:

- **Email**: [instructor-email]
- **Discord/Slack**: [channel-name]
- **Office Hours**: [schedule]

---

**Document Version**: 1.0  
**Last Updated**: February 6, 2026  
**Assignment Number**: Task Assignment #1  
**Course**: Backend Development - Healthcare System

```

---

### File: `eslint.config.mjs`

```javascript
// File: eslint.config.mjs

// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
);

```

---

### File: `package.json`

```json
// File: package.json

{
  "name": "Backend-Project-PH-Healthcare",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "tsx watch src/server.ts",
    "lint": "eslint ./src/**/*",
    "migrate": "prisma migrate dev",
    "generate": "prisma generate",
    "studio": "prisma studio",
    "push": "prisma db push",
    "pull": "prisma db pull",
    "stripe:webhook": "stripe listen --forward-to localhost:5000/webhook",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "packageManager": "pnpm@10.20.0",
  "type": "module",
  "dependencies": {
    "@prisma/adapter-pg": "^7.3.0",
    "@prisma/client": "^7.3.0",
    "better-auth": "^1.4.18",
    "cloudinary": "^2.9.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "date-fns": "^4.1.0",
    "dotenv": "^17.2.3",
    "ejs": "^4.0.1",
    "express": "^5.2.1",
    "http-status": "^2.1.0",
    "jsonwebtoken": "^9.0.3",
    "ms": "^2.1.3",
    "multer": "^2.0.2",
    "multer-storage-cloudinary": "^4.0.0",
    "node-cron": "^4.2.1",
    "nodemailer": "^8.0.1",
    "pg": "^8.18.0",
    "qs": "^6.14.1",
    "stripe": "^20.3.1",
    "uuid": "^13.0.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.2",
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/ejs": "^3.1.5",
    "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/ms": "^2.1.0",
    "@types/multer": "^2.0.0",
    "@types/node": "^25.2.0",
    "@types/nodemailer": "^7.0.9",
    "@types/pg": "^8.16.0",
    "@types/qs": "^6.14.0",
    "@types/uuid": "^11.0.0",
    "eslint": "^9.39.2",
    "prisma": "^7.3.0",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.54.0"
  }
}
```

---

### File: `prisma.config.ts`

```typescript
// File: prisma.config.ts

// This file was generated by Prisma, and assumes you have installed the following:
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";
import { envVars } from "./src/app/config/env";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: envVars.DATABASE_URL,
  },
});

```

---

### File: `prisma/schema/admin.prisma`

```prisma
// File: prisma/schema/admin.prisma

model Admin {
    id            String    @id @default(uuid(7))
    name          String
    email         String    @unique
    profilePhoto  String?
    contactNumber String?
    isDeleted     Boolean   @default(false)
    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt
    deletedAt     DateTime?

    userId String @unique
    user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([email])
    @@index([isDeleted])
    @@map("admins")
}

```

---

### File: `prisma/schema/appointment.prisma`

```prisma
// File: prisma/schema/appointment.prisma

model Appointment {
    id             String            @id @default(uuid(7))
    videoCallingId String   @db.Uuid() @unique
    status         AppointmentStatus @default(SCHEDULED)
    paymentStatus  PaymentStatus     @default(UNPAID)
    createdAt      DateTime          @default(now())
    updatedAt      DateTime          @updatedAt

    patientId String
    patient   Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

    doctorId String
    doctor   Doctor @relation(fields: [doctorId], references: [id], onDelete: Cascade)

    scheduleId String
    schedule   Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

    prescription Prescription?
    review       Review?
    payment      Payment?

    @@index([patientId])
    @@index([doctorId])
    @@index([scheduleId])
    @@index([status])
    @@map("appointments")
}

```

---

### File: `prisma/schema/auth.prisma`

```prisma
// File: prisma/schema/auth.prisma

model User {
  id                 String     @id
  name               String
  email              String
  emailVerified      Boolean    @default(false)
  role               Role       @default(PATIENT)
  status             UserStatus @default(ACTIVE)
  needPasswordChange Boolean    @default(false)
  isDeleted          Boolean    @default(false)
  deletedAt          DateTime?
  image              String?
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
  sessions           Session[]
  accounts           Account[]
  patient            Patient?
  doctor             Doctor?
  admin              Admin?

  @@unique([email])
  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verification")
}

```

---

### File: `prisma/schema/doctor.prisma`

```prisma
// File: prisma/schema/doctor.prisma

model Doctor {
  id String @id @default(uuid(7))

  name          String
  email         String    @unique
  profilePhoto  String?
  contactNumber String?
  address       String?
  isDeleted     Boolean   @default(false)
  deletedAt     DateTime?

  registrationNumber  String @unique
  experience          Int    @default(0)
  gender              Gender
  appointmentFee      Float
  qualification       String
  currentWorkingPlace String
  designation         String
  averageRating       Float  @default(0.0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  //relations

  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  specialties     DoctorSpecialty[]
  appointments    Appointment[]
  prescriptions   Prescription[]
  reviews         Review[]
  doctorSchedules DoctorSchedules[]

  @@index([email], name: "idx_doctor_email")
  @@index([isDeleted], name: "idx_doctor_isDeleted")
  @@map("doctor")
}

```

---

### File: `prisma/schema/enums.prisma`

```prisma
// File: prisma/schema/enums.prisma

enum Role {
  SUPER_ADMIN
  ADMIN
  DOCTOR
  PATIENT
}

enum UserStatus {
  ACTIVE
  BLOCKED
  DELETED
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum BloodGroup {
  A_POSITIVE
  A_NEGATIVE
  B_POSITIVE
  B_NEGATIVE
  AB_POSITIVE
  AB_NEGATIVE
  O_POSITIVE
  O_NEGATIVE
}

enum AppointmentStatus {
  SCHEDULED
  INPROGRESS
  COMPLETED
  CANCELED
}

enum PaymentStatus {
  PAID
  UNPAID
}

```

---

### File: `prisma/schema/medicalReport.prisma`

```prisma
// File: prisma/schema/medicalReport.prisma

model MedicalReport {
  id         String   @id @default(uuid(7))
  reportName String
  reportLink String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  patientId String
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@map("medical_reports")
}

```

---

### File: `prisma/schema/patient.prisma`

```prisma
// File: prisma/schema/patient.prisma

model Patient {
  id String @id @default(uuid(7))

  name          String
  email         String    @unique
  profilePhoto  String?
  contactNumber String?
  address       String?
  isDeleted     Boolean   @default(false)
  deletedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  //relations

  userId            String             @unique
  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  appointments      Appointment[]
  prescriptions     Prescription[]
  medicalReports    MedicalReport[]
  reviews           Review[]
  patientHealthData PatientHealthData?

  @@index([email], name: "idx_patient_email")
  @@index([isDeleted], name: "idx_patient_isDeleted")
  @@map("patient")
}

```

---

### File: `prisma/schema/patientHealthData.prisma`

```prisma
// File: prisma/schema/patientHealthData.prisma

model PatientHealthData {
  id                  String     @id @default(uuid(7))
  gender              Gender
  dateOfBirth         DateTime
  bloodGroup          BloodGroup
  hasAllergies        Boolean    @default(false)
  hasDiabetes         Boolean    @default(false)
  height              String
  weight              String
  smokingStatus       Boolean    @default(false)
  dietaryPreferences  String?
  pregnancyStatus     Boolean    @default(false)
  mentalHealthHistory String?
  immunizationStatus  String?
  hasPastSurgeries    Boolean    @default(false)
  recentAnxiety       Boolean    @default(false)
  recentDepression    Boolean    @default(false)
  maritalStatus       String?
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  patientId String  @unique
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@map("patient_health_data")
}

```

---

### File: `prisma/schema/payment.prisma`

```prisma
// File: prisma/schema/payment.prisma

model Payment {
    id                 String        @id @default(uuid(7))
    amount             Float
    transactionId      String        @db.Uuid() @unique
    stripeEventId       String?         @unique
    status             PaymentStatus @default(UNPAID)
    paymentGatewayData Json?
    createdAt          DateTime      @default(now())
    updatedAt          DateTime      @updatedAt

    appointmentId String      @unique
    appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

    @@index([appointmentId])
    @@index([transactionId])
    @@map("payments")
}

```

---

### File: `prisma/schema/prescription.prisma`

```prisma
// File: prisma/schema/prescription.prisma

model Prescription {
  id           String   @id @default(uuid(7))
  followUpDate DateTime
  instructions String   @db.Text
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  appointmentId String      @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  patientId String
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  doctorId String
  doctor   Doctor @relation(fields: [doctorId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@index([appointmentId])
  @@index([patientId])
  @@index([doctorId])
  @@map("prescriptions")
}

```

---

### File: `prisma/schema/review.prisma`

```prisma
// File: prisma/schema/review.prisma

model Review {
  id        String   @id @default(uuid(7))
  rating    Float    @default(0.0)
  comment   String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  appointmentId String      @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  patientId String
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  doctorId String
  doctor   Doctor @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@index([appointmentId])
  @@index([patientId])
  @@index([doctorId])
  @@map("reviews")
}

```

---

### File: `prisma/schema/schedule.prisma`

```prisma
// File: prisma/schema/schedule.prisma

model Schedule {
  id              String            @id @default(uuid(7))
  startDateTime       DateTime
  endDateTime         DateTime
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  doctorSchedules DoctorSchedules[]
  appointments    Appointment[]

  @@map("schedules")
}

model DoctorSchedules {
  doctorId String
  doctor   Doctor @relation(fields: [doctorId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  scheduleId String
  schedule   Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  isBooked  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@id([doctorId, scheduleId])
  @@index([doctorId])
  @@index([scheduleId])
  @@map("doctor_schedules")
}

```

---

### File: `prisma/schema/schema.prisma`

```prisma
// File: prisma/schema/schema.prisma

// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client"
  output   = "../../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

```

---

### File: `prisma/schema/specialty.prisma`

```prisma
// File: prisma/schema/specialty.prisma

model Specialty {
  id String @id @default(uuid(7))

  title       String  @unique @db.VarChar(100)
  description String? @db.Text
  icon        String? @db.VarChar(255)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  isDeleted         Boolean           @default(false)
  deletedAt         DateTime?
  doctorSpecialties DoctorSpecialty[]

  @@index([isDeleted], name: "idx_specialty_isDeleted")
  @@index([title], name: "idx_specialty_title")
  @@map("specialties")
}

model DoctorSpecialty {
  id          String @id @default(uuid(7))
  doctorId    String
  specialtyId String

  doctor    Doctor    @relation(fields: [doctorId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  specialty Specialty @relation(fields: [specialtyId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@unique([doctorId, specialtyId])
  @@index([doctorId], name: "idx_doctor_specialty_doctorId")
  @@index([specialtyId], name: "idx_doctor_specialty_specialtyId")
  @@map("doctor_specialties")
}

```

---

### File: `src/app.ts`

```typescript
// File: src/app.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import cron from "node-cron";
import path from "path";
import qs from "qs";
import { envVars } from "./app/config/env";
import { auth } from "./app/lib/auth";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AppointmentService } from "./app/module/appointment/appointment.service";
import { PaymentController } from "./app/module/payment/payment.controller";
import { IndexRoutes } from "./app/routes";

const app: Application = express();
app.set("query parser", (str : string) => qs.parse(str));

app.set("view engine", "ejs");
app.set("views",path.resolve(process.cwd(), `src/app/templates`) )

app.post("/webhook", express.raw({ type: "application/json" }), PaymentController.handleStripeWebhookEvent)

app.use(cors({
    origin : [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL, "http://localhost:3000", "http://localhost:5000"],
    credentials : true,
    methods : ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders : ["Content-Type", "Authorization"]
}))

app.use("/api/auth", toNodeHandler(auth))

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));

cron.schedule("*/25 * * * *", async () => {
    try {
        console.log("Running cron job to cancel unpaid appointments...");
        await AppointmentService.cancelUnpaidAppointments();
    } catch (error : any) {
        console.error("Error occurred while canceling unpaid appointments:", error.message);    
    }
})

app.use("/api/v1", IndexRoutes);

// Basic route
app.get('/', async (req: Request, res: Response) => {
    res.status(201).json({
        success: true,
        message: 'API is working',
    })
});

app.use(globalErrorHandler)
app.use(notFound)


export default app;
```

---

### File: `src/app/config/cloudinary.config.ts`

```typescript
// File: src/app/config/cloudinary.config.ts

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import status from "http-status";
import AppError from "../errorHelpers/AppError";
import { envVars } from "./env";

cloudinary.config({
    cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
})

export const uploadFileToCloudinary = async (
    buffer : Buffer,
    fileName: string,
) : Promise<UploadApiResponse> =>{

    if(!buffer || !fileName) {
        throw new AppError(status.BAD_REQUEST, "File buffer and file name are required for upload");
    }

    const extension = fileName.split(".").pop()?.toLocaleLowerCase();

    const fileNameWithoutExtension = fileName
        .split(".")
        .slice(0, -1)
        .join(".")
        .toLowerCase()
        .replace(/\s+/g, "-")
        // eslint-disable-next-line no-useless-escape
        .replace(/[^a-z0-9\-]/g, "");

    const uniqueName =
        Math.random().toString(36).substring(2) +
        "-" +
        Date.now() +
        "-" +
        fileNameWithoutExtension;

    const folder = extension === "pdf" ? "pdfs" : "images";


    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                resource_type: "auto",
                public_id: `ph-healthcare/${folder}/${uniqueName}`,
                folder : `ph-healthcare/${folder}`,
            },
            (error, result) => {
                if(error){
                    return reject(new AppError(status.INTERNAL_SERVER_ERROR, "Failed to upload file to Cloudinary"));
                }
                resolve(result as UploadApiResponse);
            }
        ).end(buffer);
    })


}

export const deleteFileFromCloudinary = async (url : string) => {

    try {
        const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;

        const match = url.match(regex);

        if (match && match[1]) {
            const publicId = match[1];

            await cloudinary.uploader.destroy(
                publicId, {
                resource_type: "image"
            }
            )

            console.log(`File ${publicId} deleted from cloudinary`);
        }

    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to delete file from Cloudinary");
    }
}


export const cloudinaryUpload = cloudinary;
```

---

### File: `src/app/config/env.ts`

```typescript
// File: src/app/config/env.ts

import dotenv from 'dotenv';
import status from 'http-status';
import AppError from '../errorHelpers/AppError';

dotenv.config();

interface EnvConfig {
    NODE_ENV: string;
    PORT: string;
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRES_IN: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: string;
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: string;
    EMAIL_SENDER:{
        SMTP_USER: string;
        SMTP_PASS: string;
        SMTP_HOST: string;
        SMTP_PORT: string;
        SMTP_FROM: string;
    }
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_CALLBACK_URL: string;
    FRONTEND_URL: string;
    CLOUDINARY:{
        CLOUDINARY_CLOUD_NAME: string;
        CLOUDINARY_API_KEY: string;
        CLOUDINARY_API_SECRET: string;
    },
    STRIPE:{
        STRIPE_SECRET_KEY: string;
        STRIPE_WEBHOOK_SECRET: string;
    },
    SUPER_ADMIN_EMAIL: string;
    SUPER_ADMIN_PASSWORD: string;
}


const loadEnvVariables = (): EnvConfig => {

    const requireEnvVariable = [
        'NODE_ENV',
        'PORT',
        'DATABASE_URL',
        'BETTER_AUTH_SECRET',
        'BETTER_AUTH_URL',
        'ACCESS_TOKEN_SECRET',
        'REFRESH_TOKEN_SECRET',
        'ACCESS_TOKEN_EXPIRES_IN',
        'REFRESH_TOKEN_EXPIRES_IN',
        'BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN',
        'BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE',
        'EMAIL_SENDER_SMTP_USER',
        'EMAIL_SENDER_SMTP_PASS',
        'EMAIL_SENDER_SMTP_HOST',
        'EMAIL_SENDER_SMTP_PORT',
        'EMAIL_SENDER_SMTP_FROM',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_CALLBACK_URL',
        'FRONTEND_URL',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'SUPER_ADMIN_EMAIL',
        'SUPER_ADMIN_PASSWORD',
    ]

    requireEnvVariable.forEach((variable) => {
        if (!process.env[variable]) {
            // throw new Error(`Environment variable ${variable} is required but not set in .env file.`);
            throw new AppError(status.INTERNAL_SERVER_ERROR, `Environment variable ${variable} is required but not set in .env file.`);
        }
    })

    return {
        NODE_ENV: process.env.NODE_ENV as string,
        PORT: process.env.PORT as string,
        DATABASE_URL: process.env.DATABASE_URL as string,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
        ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
        REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
        BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: process.env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN as string,
        BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: process.env.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE as string,
        EMAIL_SENDER: {
            SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER as string,
            SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS as string,
            SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST as string,
            SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT as string,
            SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM as string,
        },
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
        FRONTEND_URL: process.env.FRONTEND_URL as string,
        CLOUDINARY: {
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
        },
        STRIPE: {
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
            STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
        },
        SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
        SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
    }
}

export const envVars = loadEnvVariables();
```

---

### File: `src/app/config/multer.config.ts`

```typescript
// File: src/app/config/multer.config.ts

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";

const storage = new CloudinaryStorage({
    cloudinary: cloudinaryUpload,
    params: async (req, file) => {
        const originalName = file.originalname;
        const extension = originalName.split(".").pop()?.toLocaleLowerCase();

        const fileNameWithoutExtension = originalName
            .split(".")
            .slice(0, -1)
            .join(".")
            .toLowerCase()
            .replace(/\s+/g, "-")
            // eslint-disable-next-line no-useless-escape
            .replace(/[^a-z0-9\-]/g, "");

        const uniqueName =
            Math.random().toString(36).substring(2)+
            "-"+
            Date.now()+
            "-"+
            fileNameWithoutExtension;

        const folder = extension === "pdf" ? "pdfs" : "images";


        return {
            folder : `ph-healthcare/${folder}`,
            public_id: uniqueName,
            resource_type : "auto"
        }
    }

})

export const multerUpload = multer({storage})
```

---

### File: `src/app/config/stripe.config.ts`

```typescript
// File: src/app/config/stripe.config.ts

import Stripe from "stripe";
import { envVars } from "./env";

export const stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY)
```

---

### File: `src/app/errorHelpers/AppError.ts`

```typescript
// File: src/app/errorHelpers/AppError.ts

class AppError extends Error {
    public statusCode: number;

    constructor(statusCode: number, message: string, stack = '') {
        super(message) // Error("My Error Message")
        this.statusCode = statusCode;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export default AppError;
```

---

### File: `src/app/errorHelpers/handleZodError.ts`

```typescript
// File: src/app/errorHelpers/handleZodError.ts

import status from "http-status";
import z from "zod";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";

export const handleZodError = (err: z.ZodError): TErrorResponse => {
    const statusCode = status.BAD_REQUEST;
    const message = "Zod Validation Error";
    const errorSources: TErrorSources[] = [];

    err.issues.forEach(issue => {
        errorSources.push({
            path: issue.path.join(" => "),
            message: issue.message
        })
    })

    return {
        success: false,
        message,
        errorSources,
        statusCode,
    }
}
```

---

### File: `src/app/interfaces/error.interface.ts`

```typescript
// File: src/app/interfaces/error.interface.ts

export interface TErrorSources {
    path: string;
    message: string;
}

export interface TErrorResponse {
    statusCode?: number;
    success: boolean;
    message: string;
    errorSources: TErrorSources[];
    stack?: string;
    error?: unknown;
}
```

---

### File: `src/app/interfaces/index.d.ts`

```typescript
// File: src/app/interfaces/index.d.ts

import { IRequestUser } from "./requestUser.interface";


declare global {
    namespace Express{
        interface Request {
            user : IRequestUser
        }
    }
}
```

---

### File: `src/app/interfaces/query.interface.ts`

```typescript
// File: src/app/interfaces/query.interface.ts

/* eslint-disable @typescript-eslint/no-explicit-any */


export interface PrismaFindManyArgs {
    where ?: Record<string, unknown>;
    include ?: Record<string, unknown>;
    select ?: Record<string, boolean | Record<string, unknown> >
    orderBy ?: Record<string, unknown> | Record<string, unknown>[];
    skip ?: number;
    take ?: number;
    cursor ?: Record<string, unknown>;
    distinct ?: string[] | string;
    [key: string] : unknown;
}

export interface PrismaCountArgs {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
    select?: Record<string, boolean | Record<string, unknown>>
    orderBy?: Record<string, unknown> | Record<string, unknown>[];
    skip?: number;
    take?: number;
    cursor?: Record<string, unknown>;
    distinct?: string[] | string;
    [key: string]: unknown;
}

export interface PrismaModelDelegate {
    findMany(args ?: any) : Promise<any[]>;
    count (args ?: any) : Promise<number>;
}

export interface IQueryParams {
    searchTerm ?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    fields?: string;
    includes?: string;
    [key: string] : string | undefined;
}

export interface IQueryConfig {
    searchableFields?: string[];
    filterableFields?: string[];
}

export interface PrismaStringFilter{
    contains ?: string;
    startsWith ?: string;
    endsWith ?: string;
    mode ?: 'insensitive' | 'default';
    equals ?: string;
    in ?: string[];
    notIn ?: string[];
    lt ?: string;
    lte ?: string;
    gt ?: string;
    gte ?: string;
    not ?: PrismaStringFilter | string;
}

export interface PrismaNumberFilter{
    equals ?: number;
    in ?: number[];
    notIn ?: number[];
    lt ?: number;
    lte ?: number;
    gt ?: number;
    gte ?: number;
    not ?: PrismaNumberFilter | number;
}

export interface PrismaWhereConditions {
    OR ?: Record<string, unknown>[];
    AND ?: Record<string, unknown>[];
    NOT ?: Record<string, unknown>[];
    [key: string] : unknown;
}

export interface IQueryResult<T>{
    data : T[];
    meta : {
        page : number;
        limit : number;
        total : number;
        totalPages : number;
    }
}
```

---

### File: `src/app/interfaces/requestUser.interface.ts`

```typescript
// File: src/app/interfaces/requestUser.interface.ts

import { Role } from "../../generated/prisma/enums";

export interface IRequestUser{
    userId : string;
    role : Role;
    email : string;
}
```

---

### File: `src/app/lib/auth.ts`

```typescript
// File: src/app/lib/auth.ts

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP } from "better-auth/plugins";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { sendEmail } from "../utils/email";
import { prisma } from "./prisma";
// If your Prisma file is located elsewhere, you can change the path

export const auth = betterAuth({
    baseURL: envVars.BETTER_AUTH_URL,
    secret: envVars.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },

    socialProviders:{
        google:{
            clientId: envVars.GOOGLE_CLIENT_ID,
            clientSecret: envVars.GOOGLE_CLIENT_SECRET,
            // callbackUrl: envVars.GOOGLE_CALLBACK_URL,
            mapProfileToUser: ()=>{
                return {
                    role : Role.PATIENT,
                    status : UserStatus.ACTIVE,
                    needPasswordChange : false,
                    emailVerified : true,
                    isDeleted : false,
                    deletedAt : null,
                }
            }
        }
    },

    emailVerification:{
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: Role.PATIENT
            },

            status: {
                type: "string",
                required: true,
                defaultValue: UserStatus.ACTIVE
            },

            needPasswordChange: {
                type: "boolean",
                required: true,
                defaultValue: false
            },

            isDeleted: {
                type: "boolean",
                required: true,
                defaultValue: false
            },

            deletedAt: {
                type: "date",
                required: false,
                defaultValue: null
            },
        }
    },

    plugins: [
        bearer(),
        emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({email, otp, type}) {
                if(type === "email-verification"){
                  const user = await prisma.user.findUnique({
                    where : {
                        email,
                    }
                  })

                   if(!user){
                    console.error(`User with email ${email} not found. Cannot send verification OTP.`);
                    return;
                   }

                   if(user && user.role === Role.SUPER_ADMIN){
                    console.log(`User with email ${email} is a super admin. Skipping sending verification OTP.`);
                    return;
                   }
                  
                    if (user && !user.emailVerified){
                    sendEmail({
                        to : email,
                        subject : "Verify your email",
                        templateName : "otp",
                        templateData :{
                            name : user.name,
                            otp,
                        }
                    })
                  }
                }else if(type === "forget-password"){
                    const user = await prisma.user.findUnique({
                        where : {
                            email,
                        }
                    })

                    if(user){
                        sendEmail({
                            to : email,
                            subject : "Password Reset OTP",
                            templateName : "otp",
                            templateData :{
                                name : user.name,
                                otp,
                            }
                        })
                    }
                }
            },
            expiresIn : 2 * 60, // 2 minutes in seconds
            otpLength : 6,
        })
    ],

    session: {
        expiresIn: 60 * 60 * 60 * 24, // 1 day in seconds
        updateAge: 60 * 60 * 60 * 24, // 1 day in seconds
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 60 * 24, // 1 day in seconds
        }
    },

    redirectURLs:{
        signIn : `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
    },

    trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:5000", envVars.FRONTEND_URL],

    advanced: {
        // disableCSRFCheck: true,
        useSecureCookies : false,
        cookies:{
            state:{
                attributes:{
                    sameSite: "none",
                    secure: true,
                    httpOnly: true,
                    path: "/",
                }
            },
            sessionToken:{
                attributes:{
                    sameSite: "none",
                    secure: true,
                    httpOnly: true,
                    path: "/",
                }
            }
        }
    }

});
```

---

### File: `src/app/lib/prisma.ts`

```typescript
// File: src/app/lib/prisma.ts

import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client";
import { envVars } from '../config/env';


const connectionString = envVars.DATABASE_URL;

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export { prisma };


```

---

### File: `src/app/middleware/checkAuth.ts`

```typescript
// File: src/app/middleware/checkAuth.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { prisma } from "../lib/prisma";
import { CookieUtils } from "../utils/cookie";
import { jwtUtils } from "../utils/jwt";

export const checkAuth = (...authRoles: Role[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        //Session Token Verification
        const sessionToken = CookieUtils.getCookie(req, "better-auth.session_token");

        if (!sessionToken) {
            throw new Error('Unauthorized access! No session token provided.');
        }

        if (sessionToken) {
            const sessionExists = await prisma.session.findFirst({
                where: {
                    token: sessionToken,
                    expiresAt: {
                        gt: new Date(),
                    }
                },
                include: {
                    user: true,
                }
            })

            if (sessionExists && sessionExists.user) {
                const user = sessionExists.user;

                const now = new Date();
                const expiresAt = new Date(sessionExists.expiresAt)
                const createdAt = new Date(sessionExists.createdAt)

                const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
                const timeRemaining = expiresAt.getTime() - now.getTime();
                const percentRemaining = (timeRemaining / sessionLifeTime) * 100;

                if (percentRemaining < 20) {
                    res.setHeader('X-Session-Refresh', 'true');
                    res.setHeader('X-Session-Expires-At', expiresAt.toISOString());
                    res.setHeader('X-Time-Remaining', timeRemaining.toString());

                    console.log("Session Expiring Soon!!");
                }

                if (user.status === UserStatus.BLOCKED || user.status === UserStatus.DELETED) {
                    throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is not active.');
                }

                if (user.isDeleted) {
                    throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is deleted.');
                }

                if (authRoles.length > 0 && !authRoles.includes(user.role)) {
                    throw new AppError(status.FORBIDDEN, 'Forbidden access! You do not have permission to access this resource.');
                }

                req.user = {
                    userId : user.id,
                    role : user.role,
                    email : user.email,
                }
            }

            const accessToken = CookieUtils.getCookie(req, 'accessToken');

            if (!accessToken) {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No access token provided.');
            }


        }

        //Access Token Verification
        const accessToken = CookieUtils.getCookie(req, 'accessToken');

        if (!accessToken) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No access token provided.');
        }

        const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);

        if (!verifiedToken.success) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! Invalid access token.');
        }

        if (authRoles.length > 0 && !authRoles.includes(verifiedToken.data!.role as Role)) {
            throw new AppError(status.FORBIDDEN, 'Forbidden access! You do not have permission to access this resource.');
        }

        next()
    } catch (error: any) {
        next(error);
    }
};
```

---

### File: `src/app/middleware/globalErrorHandler.ts`

```typescript
// File: src/app/middleware/globalErrorHandler.ts

/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import z from "zod";
import { deleteFileFromCloudinary } from "../config/cloudinary.config";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { handleZodError } from "../errorHelpers/handleZodError";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const globalErrorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
    if (envVars.NODE_ENV === 'development') {
        console.log("Error from Global Error Handler", err);
    }

    if(req.file){
        await deleteFileFromCloudinary(req.file.path)
    }

    if(req.files && Array.isArray(req.files) && req.files.length > 0){
        const imageUrls = req.files.map((file) => file.path);
        await Promise.all(imageUrls.map(url => deleteFileFromCloudinary(url))); 
    }

    let errorSources: TErrorSources[] = []
    let statusCode: number = status.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal Server Error';
    let stack: string | undefined = undefined;

    //Zod Error Patttern
    /*
     error.issues; 
    /* [
      {
        expected: 'string',
        code: 'invalid_type',
        path: [ 'username' , 'password' ], => username password
        message: 'Invalid input: expected string'
      },
      {
        expected: 'number',
        code: 'invalid_type',
        path: [ 'xp' ],
        message: 'Invalid input: expected number'
      }
    ] 
    */

    if (err instanceof z.ZodError) {
        const simplifiedError = handleZodError(err);
        statusCode = simplifiedError.statusCode as number
        message = simplifiedError.message
        errorSources = [...simplifiedError.errorSources]
        stack = err.stack;

    } else if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        stack = err.stack;
        errorSources = [
            {
                path: '',
                message: err.message
            }
        ]
    }
    else if (err instanceof Error) {
        statusCode = status.INTERNAL_SERVER_ERROR;
        message = err.message
        stack = err.stack;
        errorSources = [
            {
                path: '',
                message: err.message
            }
        ]
    }


    const errorResponse: TErrorResponse = {
        success: false,
        message: message,
        errorSources,
        error: envVars.NODE_ENV === 'development' ? err : undefined,
        stack: envVars.NODE_ENV === 'development' ? stack : undefined,
    }

    res.status(statusCode).json(errorResponse);
}
```

---

### File: `src/app/middleware/notFound.ts`

```typescript
// File: src/app/middleware/notFound.ts

import { Request, Response } from "express";
import status from "http-status";

export const notFound = (req: Request, res: Response) => {
    res.status(status.NOT_FOUND).json({
        success: false,
        message: `Route ${req.originalUrl} Not Found`,
    })
}
```

---

### File: `src/app/middleware/validateRequest.ts`

```typescript
// File: src/app/middleware/validateRequest.ts

import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (zodSchema: z.ZodObject) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if(req.body.data){
            req.body = JSON.parse(req.body.data)
        }

        const parsedResult = zodSchema.safeParse(req.body)

        if (!parsedResult.success) {
            next(parsedResult.error)
        }

        //sanitizing the data
        req.body = parsedResult.data;

        next();
    }
}

```

---

### File: `src/app/module/admin/admin.controller.ts`

```typescript
// File: src/app/module/admin/admin.controller.ts

import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AdminService } from "./admin.service";

const getAllAdmins = catchAsync(
    async (req: Request, res: Response) => {
        const result = await AdminService.getAllAdmins();

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Admins fetched successfully",
            data: result,
        })
    }
)

const getAdminById = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const admin = await AdminService.getAdminById(id as string);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Admin fetched successfully",
            data: admin,
        })
    }
)

const updateAdmin = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const payload = req.body;

        const updatedAdmin = await AdminService.updateAdmin(id as string, payload);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Admin updated successfully",
            data: updatedAdmin,
        })
    }
)

const deleteAdmin = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = req.user;

        const result = await AdminService.deleteAdmin(id as string, user);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Admin deleted successfully",
            data: result,
        })
    }

)

export const AdminController = {
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    getAdminById,
};
```

---

### File: `src/app/module/admin/admin.interface.ts`

```typescript
// File: src/app/module/admin/admin.interface.ts

export interface IUpdateAdminPayload {
    admin?: {
        name?: string;
        profilePhoto?: string;
        contactNumber?: string;
    }
}
```

---

### File: `src/app/module/admin/admin.route.ts`

```typescript
// File: src/app/module/admin/admin.route.ts

import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import { updateAdminZodSchema } from "./admin.validation";

const router = Router();

router.get("/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AdminController.getAllAdmins);
router.get("/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AdminController.getAdminById);
router.patch("/:id",
    checkAuth(Role.SUPER_ADMIN),
    validateRequest(updateAdminZodSchema), AdminController.updateAdmin);
router.delete("/:id",
    checkAuth(Role.SUPER_ADMIN),
    AdminController.deleteAdmin);

export const AdminRoutes = router;
```

---

### File: `src/app/module/admin/admin.service.ts`

```typescript
// File: src/app/module/admin/admin.service.ts

import status from "http-status";
import { UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { IUpdateAdminPayload } from "./admin.interface";

const getAllAdmins = async () => {
    const admins = await prisma.admin.findMany({
        include: {
            user: true,
        }
    })
    return admins;
}

const getAdminById = async (id: string) => {
    const admin = await prisma.admin.findUnique({
        where: {
            id,
        },
        include: {
            user: true,
        }
    })
    return admin;
}

const updateAdmin = async (id: string, payload: IUpdateAdminPayload) => {
    //TODO: Validate who is updating the admin user. Only super admin can update admin user and only super admin can update super admin user but admin user cannot update super admin user

    const isAdminExist = await prisma.admin.findUnique({
        where: {
            id,
        }
    })

    if (!isAdminExist) {
        throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
    }

    const { admin } = payload;

    const updatedAdmin = await prisma.admin.update({
        where: {
            id,
        },
        data: {
            ...admin,
        }
    })

    return updatedAdmin;
}

//soft delete admin user by setting isDeleted to true and also delete the user session and account
const deleteAdmin = async (id: string, user : IRequestUser) => {
    //TODO: Validate who is deleting the admin user. Only super admin can delete admin user and only super admin can delete super admin user but admin user cannot delete super admin user


    const isAdminExist = await prisma.admin.findUnique({
        where: {
            id,
        }
    })

    if (!isAdminExist) {
        throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
    }

    if(isAdminExist.id === user.userId){
        throw new AppError(status.BAD_REQUEST, "You cannot delete yourself");
    }

    const result = await prisma.$transaction(async (tx) => {
        await tx.admin.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        })

        await tx.user.update({
            where: { id: isAdminExist.userId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                status: UserStatus.DELETED // Optional: you may also want to block the user
            },
        })

        await tx.session.deleteMany({
            where: { userId: isAdminExist.userId }
        })

        await tx.account.deleteMany({
            where: { userId: isAdminExist.userId }
        })

        const admin = await getAdminById(id);

        return admin;
    }
    )

    return result;
}

export const AdminService = {
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
}
```

---

### File: `src/app/module/admin/admin.validation.ts`

```typescript
// File: src/app/module/admin/admin.validation.ts

import z from "zod";

export const updateAdminZodSchema = z.object({
    admin: z.object({
        name: z.string("Name must be a string").optional(),
        profilePhoto: z.url("Profile photo must be a valid URL").optional(),
        contactNumber: z.string("Contact number must be a string").min(11, "Contact number must be at least 11 characters").max(14, "Contact number must be at most 15 characters").optional(),
    }).optional()
})
```

---

### File: `src/app/module/appointment/appointment.controller.ts`

```typescript
// File: src/app/module/appointment/appointment.controller.ts

import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AppointmentService } from "./appointment.service";

const bookAppointment = catchAsync( async (req : Request, res : Response) => {
    const payload = req.body;
    const user = req.user;
    const appointment = await AppointmentService.bookAppointment(payload, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.CREATED, 
        message: 'Appointment booked successfully',
        data: appointment
    });
});

const getMyAppointments = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const appointments = await AppointmentService.getMyAppointments(user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Appointments retrieved successfully',
        data: appointments
    });
});

const changeAppointmentStatus = catchAsync(async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const payload = req.body;
    const user = req.user;

    const updatedAppointment = await AppointmentService.changeAppointmentStatus(appointmentId as string, payload, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Appointment status updated successfully',
        data: updatedAppointment
    });
});

const getMySingleAppointment = catchAsync(async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const user = req.user;

    const appointment = await AppointmentService.getMySingleAppointment(appointmentId as string, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Appointment retrieved successfully',
        data: appointment
    });
});

const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
    const appointments = await AppointmentService.getAllAppointments();
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'All appointments retrieved successfully',
        data: appointments
    });
});

const bookAppointmentWithPayLater = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;
    const appointment = await AppointmentService.bookAppointmentWithPayLater(payload, user);
    sendResponse(res, {
        success: true,  
        httpStatusCode: status.CREATED,
        message: 'Appointment booked successfully with Pay Later option',
        data: appointment
    });
});

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const user = req.user;
    const paymentInfo = await AppointmentService.initiatePayment(appointmentId as string, user);

    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Payment initiated successfully',
        data: paymentInfo
    });
});

export const AppointmentController = {
    bookAppointment,
    getMyAppointments,
    changeAppointmentStatus,
    getMySingleAppointment,
    getAllAppointments,
    bookAppointmentWithPayLater,
    initiatePayment,
}
```

---

### File: `src/app/module/appointment/appointment.interface.ts`

```typescript
// File: src/app/module/appointment/appointment.interface.ts


export interface IBookAppointmentPayload {
    doctorId : string,
    scheduleId : string,
}

export interface IUpdateAppointmentPayload {
    doctorId? : string,
    scheduleId? : string,
    status? : string,
}
```

---

### File: `src/app/module/appointment/appointment.route.ts`

```typescript
// File: src/app/module/appointment/appointment.route.ts

import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { AppointmentController } from "./appointment.controller";

const router = Router();

router.post("/book-appointment", checkAuth(Role.PATIENT), AppointmentController.bookAppointment);
router.get("/my-appointments", checkAuth(Role.PATIENT, Role.DOCTOR), AppointmentController.getMyAppointments);
router.patch("/change-appointment-status/:id", checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),AppointmentController.changeAppointmentStatus);
router.get("/my-single-appointment/:id", checkAuth(Role.PATIENT, Role.DOCTOR), AppointmentController.getMySingleAppointment);
router.get("/all-appointments", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), AppointmentController.getAllAppointments);
router.post("/book-appointment-with-pay-later", checkAuth(Role.PATIENT), AppointmentController.bookAppointmentWithPayLater);
router.post("/initiate-payment/:id", checkAuth(Role.PATIENT), AppointmentController.initiatePayment);

export const AppointmentRoutes = router;
```

---

### File: `src/app/module/appointment/appointment.service.ts`

```typescript
// File: src/app/module/appointment/appointment.service.ts

import status from "http-status";
// import { uuidv7 } from "zod/mini";
import { v7 as uuidv7 } from "uuid";
import { PaymentStatus, Role } from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { AppointmentStatus } from './../../../generated/prisma/enums';
import { IBookAppointmentPayload } from "./appointment.interface";

// Pay Now Book Appointment
const bookAppointment = async (payload : IBookAppointmentPayload, user : IRequestUser) => {
   const patientData = await prisma.patient.findUniqueOrThrow({
    where : {
        email : user.email,
    }
   });

   const doctorData = await prisma.doctor.findUniqueOrThrow({
    where : {
        id : payload.doctorId,
        isDeleted : false,
    }
   });

   const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where : {
        id : payload.scheduleId,
    }
   });

   const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where : {
        doctorId_scheduleId:{
            doctorId : doctorData.id,
            scheduleId : scheduleData.id,   
        }
    }
   });
   
    const videoCallingId = String(uuidv7());

    const result = await prisma.$transaction(async (tx) => {
        const appointmentData = await tx.appointment.create({
            data : {
                doctorId : payload.doctorId,
                patientId : patientData.id,
                scheduleId : doctorSchedule.scheduleId,
                videoCallingId,
            }
        });

        await tx.doctorSchedules.update({
            where : {
                doctorId_scheduleId:{
                    doctorId : payload.doctorId,
                    scheduleId : payload.scheduleId,
                }
            },
            data : {
                isBooked : true,
            }
        });

        //TODO : Payment Integration will be here

        const transactionId = String(uuidv7());

        const paymentData = await tx.payment.create({
            data : {
                appointmentId : appointmentData.id,
                amount : doctorData.appointmentFee,
                transactionId
            }
        });
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items :[
                {
                    price_data:{
                        currency:"bdt",
                        product_data:{
                            name : `Appointment with Dr. ${doctorData.name}`,
                        },
                        unit_amount : doctorData.appointmentFee * 100,
                    },
                    quantity : 1,
                }
            ],
            metadata:{
                appointmentId : appointmentData.id,
                paymentId : paymentData.id,
            },

            success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success`,

            // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
            cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments`,
        })

        return {
            appointmentData,
            paymentData,
            paymentUrl : session.url,
        };
    });

    return {
        appointment : result.appointmentData,
        payment : result.paymentData,
        paymentUrl : result.paymentUrl,
    };
}

const getMyAppointments = async (user: IRequestUser) => {
    //user can be patient or doctor, so we need to check both
    const patientData = await prisma.patient.findUnique({
        where: {
            email: user?.email
        }
    });

    const doctorData = await prisma.doctor.findUnique({
        where: {
            email: user?.email
        }
    });

    let appointments = [];

    if (patientData) {
        appointments = await prisma.appointment.findMany({
            where: {
                patientId: patientData.id
            },
            include: {
                doctor: true,
                schedule: true
            }
        });
    } else if (doctorData) {
        appointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctorData.id
            },
            include: {
                patient: true,
                schedule: true
            }
        });
    } else {
        throw new Error("User not found");
    }

    return appointments;

}

// 1. Completed Or Cancelled Appointments should not be allowed to update status
// 2. Doctors can only update Appoinment status from schedule to inprogress or inprogress to complted or schedule to cancelled.
// 3. Patients can only cancel the scheduled appointment if it scheduled not completed or cancelled or inprogress. 
// 4. Admin and Super admin can update to any status.

const changeAppointmentStatus = async (appointmentId: string, appointmentStatus: AppointmentStatus, user: IRequestUser) => {
    const appointmentData = await prisma.appointment.findUniqueOrThrow({
        where: {
            id: appointmentId,
            // status: AppointmentStatus.SCHEDULED
        },
        include: {
            doctor: true
        }
    });

    // if (!appointmentData) {
    //     throw new AppError(status.NOT_FOUND, "Appointment not found or already completed/cancelled");
    // }

    if (user?.role === Role.DOCTOR) {
        if (!(user?.email === appointmentData.doctor.email))
            throw new AppError(status.BAD_REQUEST, "This is not your appointment")
    }

    return await prisma.appointment.update({
        where: {
            id: appointmentId
        },
        data: {
            status: appointmentStatus
        }
    })

}

// refactoring on include of doctor and patient data in appointment details, we can use query builder to get the data in single query instead of multiple queries in case of doctor and patient both
const getMySingleAppointment = async (appointmentId: string, user: IRequestUser) => {

    const patientData = await prisma.patient.findUnique({
        where: {
            email: user?.email
        }
    });

    const doctorData = await prisma.doctor.findUnique({
        where: {
            email: user?.email
        }
    });

    let appointment;

    if (patientData) {
        appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                patientId: patientData.id
            },
            include: {
                doctor: true,
                schedule: true
            }
        });
    } else if (doctorData) {
        appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                doctorId: doctorData.id
            },
            include: {
                patient: true,
                schedule: true
            }
        });
    }

    if (!appointment) {
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    return appointment;
}

// integrate query builder
const getAllAppointments = async () => {
    const appointments = await prisma.appointment.findMany({
        include: {
            doctor: true,
            patient: true,
            schedule: true
        }
    });
    return appointments;
}

const bookAppointmentWithPayLater = async (payload : IBookAppointmentPayload, user : IRequestUser) => {
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email,
        }
    });

    const doctorData = await prisma.doctor.findUniqueOrThrow({
        where: {
            id: payload.doctorId,
            isDeleted: false,
        }
    });

    const scheduleData = await prisma.schedule.findUniqueOrThrow({
        where: {
            id: payload.scheduleId,
        }
    });

    const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
        where: {
            doctorId_scheduleId: {
                doctorId: doctorData.id,
                scheduleId: scheduleData.id,
            }
        }
    });

    const videoCallingId = String(uuidv7());

    const result = await prisma.$transaction(async (tx) => {
        const appointmentData = await tx.appointment.create({
            data: {
                doctorId: payload.doctorId,
                patientId: patientData.id,
                scheduleId: doctorSchedule.scheduleId,
                videoCallingId,
            }
        });

        await tx.doctorSchedules.update({
            where: {
                doctorId_scheduleId: {
                    doctorId: payload.doctorId,
                    scheduleId: payload.scheduleId,
                }
            },
            data: {
                isBooked: true,
            }
        });

        const transactionId = String(uuidv7());

        const paymentData = await tx.payment.create({
            data: {
                appointmentId: appointmentData.id,
                amount: doctorData.appointmentFee,
                transactionId,
             }
        });

        return {
            appointment: appointmentData,
            payment: paymentData
        };

    });

    return result;
}  

const initiatePayment = async (appointmentId: string, user : IRequestUser) => {
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email,
        }
    });

    const appointmentData = await prisma.appointment.findUniqueOrThrow({
        where: {
            id: appointmentId,
            patientId: patientData.id,
        },
        include: {
            doctor: true,
            payment : true,
        }
    });

    if(!appointmentData){
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    if(!appointmentData.payment){
        throw new AppError(status.NOT_FOUND, "Payment data not found for this appointment");
    }

    if(appointmentData.payment?.status === PaymentStatus.PAID){
        throw new AppError(status.BAD_REQUEST, "Payment already completed for this appointment");
    };

    if(appointmentData.status === AppointmentStatus.CANCELED){
        throw new AppError(status.BAD_REQUEST, "Appointment is canceled");
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: "bdt",
                    product_data: {
                        name: `Appointment with Dr. ${appointmentData.doctor.name}`,
                    },
                    unit_amount: appointmentData.doctor.appointmentFee * 100,
                },
                quantity: 1,
            }
        ],
        metadata: {
            appointmentId: appointmentData.id,
            paymentId: appointmentData.payment.id,
        },

        success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${appointmentData.payment.id}`,

        // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
        cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments?error=payment_cancelled`,
    })

    return {
        paymentUrl: session.url,
    }
}

const cancelUnpaidAppointments = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const unpaidAppointments = await prisma.appointment.findMany({
        where: {
            // status: AppointmentStatus.SCHEDULED,
            createdAt: {
                lte: thirtyMinutesAgo,
            },
            paymentStatus: PaymentStatus.UNPAID,
        },
    });

    const appointmentToCancel = unpaidAppointments.map(appointment => appointment.id);

    await prisma.$transaction(async (tx) => {

        await tx.appointment.updateMany({
            where: {
                id: {
                    in: appointmentToCancel,
                },
            },
            data: {
                status: AppointmentStatus.CANCELED,
            },
        });

        await tx.payment.deleteMany({
            where: {
                appointmentId: {
                    in: appointmentToCancel,
                },
            },
        });

        for(const unpaidAppointment of unpaidAppointments){
            await tx.doctorSchedules.update({
                where: {
                    doctorId_scheduleId: {
                        doctorId: unpaidAppointment.doctorId,
                        scheduleId: unpaidAppointment.scheduleId,
                    },
                },
                data: {
                    isBooked: false,
                },
            });
        }
    });
}



export const AppointmentService = {
    bookAppointment,
    getMyAppointments,
    changeAppointmentStatus,
    getMySingleAppointment,
    getAllAppointments,
    bookAppointmentWithPayLater,
    initiatePayment,
    cancelUnpaidAppointments,
}
```

---

### File: `src/app/module/appointment/appointment.validation.ts`

```typescript
// File: src/app/module/appointment/appointment.validation.ts


```

---

### File: `src/app/module/auth/auth.controller.ts`

```typescript
// File: src/app/module/auth/auth.controller.ts

import { Request, Response } from "express";
import status from "http-status";
import ms, { StringValue } from "ms";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { CookieUtils } from "../../utils/cookie";
import { tokenUtils } from "../../utils/token";
import { AuthService } from "./auth.service";

const registerPatient = catchAsync(
    async (req: Request, res: Response) => {
        const maxAge = ms(envVars.ACCESS_TOKEN_EXPIRES_IN as StringValue);
        console.log({ maxAge });
        const payload = req.body;

        console.log(payload);

        const result = await AuthService.registerPatient(payload);

        const { accessToken, refreshToken, token, ...rest } = result

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, refreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, token as string);

        sendResponse(res, {
            httpStatusCode: status.CREATED,
            success: true,
            message: "Patient registered successfully",
            data: {
                token,
                accessToken,
                refreshToken,
                ...rest,
            }
        })
    }
)

const loginUser = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;
        const result = await AuthService.loginUser(payload);
        const { accessToken, refreshToken, token, ...rest } = result

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, refreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, token);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "User logged in successfully",
            data: {
                token,
                accessToken,
                refreshToken,
                ...rest,

            },
        })
    }
)

const getMe = catchAsync(
    async (req: Request, res: Response) => {
        const user = req.user;
        console.log({user});
        const result = await AuthService.getMe(user);
        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "User profile fetched successfully",
            data: result,
        })
    }
)

const getNewToken = catchAsync(
    async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        const betterAuthSessionToken = req.cookies["better-auth.session_token"];
        if (!refreshToken) {
            throw new AppError(status.UNAUTHORIZED, "Refresh token is missing");
        }
        const result = await AuthService.getNewToken(refreshToken, betterAuthSessionToken);

        const { accessToken, refreshToken: newRefreshToken, sessionToken } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, newRefreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, sessionToken);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "New tokens generated successfully",
            data: {
                accessToken,
                refreshToken: newRefreshToken,
                sessionToken,
            },
        });
    }
)

const changePassword = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;
        const betterAuthSessionToken = req.cookies["better-auth.session_token"];

        const result = await AuthService.changePassword(payload, betterAuthSessionToken);

        const { accessToken, refreshToken, token } = result;

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, refreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, token as string);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Password changed successfully",
            data: result,
        });
    }
)

const logoutUser = catchAsync(
    async (req: Request, res: Response) => {
        const betterAuthSessionToken = req.cookies["better-auth.session_token"];
        const result = await AuthService.logoutUser(betterAuthSessionToken);
        CookieUtils.clearCookie(res, 'accessToken', {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        CookieUtils.clearCookie(res, 'refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        CookieUtils.clearCookie(res, 'better-auth.session_token', {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "User logged out successfully",
            data: result,
        });
    }
)

const verifyEmail = catchAsync(
    async (req: Request, res: Response) => {
        const { email, otp } = req.body;
        await AuthService.verifyEmail(email, otp);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Email verified successfully",
        });
    }
)

const forgetPassword = catchAsync(
    async (req: Request, res: Response) => {
        const { email } = req.body;
        await AuthService.forgetPassword(email);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Password reset OTP sent to email successfully",
        });
    }
)

const resetPassword = catchAsync(
    async (req: Request, res: Response) => {
        const { email, otp, newPassword } = req.body;
        await AuthService.resetPassword(email, otp, newPassword);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Password reset successfully",
        });
    }
)

// /api/v1/auth/login/google?redirect=/profile
const googleLogin = catchAsync((req: Request, res: Response) => {
    const redirectPath = req.query.redirect || "/dashboard";

    const encodedRedirectPath = encodeURIComponent(redirectPath as string);

    const callbackURL = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;

    res.render("googleRedirect", {
        callbackURL : callbackURL,
        betterAuthUrl : envVars.BETTER_AUTH_URL,
    })
})

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
    const redirectPath = req.query.redirect as string || "/dashboard";

    const sessionToken = req.cookies["better-auth.session_token"];

    if(!sessionToken){
        return res.redirect(`${envVars.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const session = await auth.api.getSession({
        headers:{
            "Cookie" : `better-auth.session_token=${sessionToken}`
        }
    })

    if (!session) {
        return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_session_found`);
    }


    if(session && !session.user){
        return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_user_found`);
    }

    const result = await AuthService.googleLoginSuccess(session);

    const {accessToken, refreshToken} = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);
 // ?redirect=//profile -> /profile
    const isValidRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//");
    const finalRedirectPath = isValidRedirectPath ? redirectPath : "/dashboard";

    res.redirect(`${envVars.FRONTEND_URL}${finalRedirectPath}`);
})

const handleOAuthError = catchAsync((req: Request, res: Response) => {
    const error = req.query.error as string || "oauth_failed";
    res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
})

export const AuthController = {
    registerPatient,
    loginUser,
    getMe,
    getNewToken,
    changePassword,
    logoutUser,
    verifyEmail,
    forgetPassword,
    resetPassword,
    googleLogin,
    googleLoginSuccess,
    handleOAuthError,
};
```

---

### File: `src/app/module/auth/auth.interface.ts`

```typescript
// File: src/app/module/auth/auth.interface.ts

export interface ILoginUserPayload {
    email: string;
    password: string;
}

export interface IRegisterPatientPayload {
    name: string;
    email: string;
    password: string;
}

export interface IChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}
```

---

### File: `src/app/module/auth/auth.route.ts`

```typescript
// File: src/app/module/auth/auth.route.ts

import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";

const router = Router()

router.post("/register", AuthController.registerPatient)
router.post("/login", AuthController.loginUser)
router.get("/me", checkAuth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN), AuthController.getMe)
router.post("/refresh-token", AuthController.getNewToken)
router.post("/change-password", checkAuth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN), AuthController.changePassword)
router.post("/logout", checkAuth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN), AuthController.logoutUser)
router.post("/verify-email", AuthController.verifyEmail)
router.post("/forget-password", AuthController.forgetPassword)
router.post("/reset-password", AuthController.resetPassword)

router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);

export const AuthRoutes = router;
```

---

### File: `src/app/module/auth/auth.service.ts`

```typescript
// File: src/app/module/auth/auth.service.ts

import status from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { UserStatus } from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import { tokenUtils } from "../../utils/token";
import { IChangePasswordPayload, ILoginUserPayload, IRegisterPatientPayload } from "./auth.interface";



const registerPatient = async (payload: IRegisterPatientPayload) => {
    const { name, email, password } = payload;

    const data = await auth.api.signUpEmail({
        body: {
            name,
            email,
            password,
            //default values
            // needsPasswordChange: false,
            // role: Role.PATIENT
        }
    })

    if (!data.user) {
        // throw new Error("Failed to register patient");
        throw new AppError(status.BAD_REQUEST, "Failed to register patient");
    }

    //TODO : Create Patient Profile In Transaction After Sign Up Of Patient In USer Model
    try {
        const patient = await prisma.$transaction(async (tx) => {

            const patientTx = await tx.patient.create({
                data: {
                    userId: data.user.id,
                    name: payload.name,
                    email: payload.email,
                }
            })

            return patientTx
        })

        const accessToken = tokenUtils.getAccessToken({
            userId: data.user.id,
            role: data.user.role,
            name: data.user.name,
            email: data.user.email,
            status: data.user.status,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });

        const refreshToken = tokenUtils.getRefreshToken({
            userId: data.user.id,
            role: data.user.role,
            name: data.user.name,
            email: data.user.email,
            status: data.user.status,
            isDeleted: data.user.isDeleted,
            emailVerified: data.user.emailVerified,
        });

        return {
            ...data,
            accessToken,
            refreshToken,
            patient
        }

    } catch (error) {
        console.log("Transaction error : ", error);
        await prisma.user.delete({
            where: {
                id: data.user.id
            }
        })
        throw error;
    }

}


const loginUser = async (payload: ILoginUserPayload) => {
    const { email, password } = payload;

    const data = await auth.api.signInEmail({
        body: {
            email,
            password,
        }
    })

    if (data.user.status === UserStatus.BLOCKED) {
        throw new AppError(status.FORBIDDEN, "User is blocked");
    }

    if (data.user.isDeleted || data.user.status === UserStatus.DELETED) {
        throw new AppError(status.NOT_FOUND, "User is deleted");
    }

    const accessToken = tokenUtils.getAccessToken({
        userId: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
        status: data.user.status,
        isDeleted: data.user.isDeleted,
        emailVerified: data.user.emailVerified,
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
        status: data.user.status,
        isDeleted: data.user.isDeleted,
        emailVerified: data.user.emailVerified,
    });

    return {
        ...data,
        accessToken,
        refreshToken,
    };

}

const getMe = async (user : IRequestUser) => {
    const isUserExists = await prisma.user.findUnique({
        where : {
            id : user.userId,
        },
        include : {
            patient : {
                include : {
                    appointments : true,
                    reviews : true,
                    prescriptions : true,
                    medicalReports : true,
                    patientHealthData : true,
                }
            },
            doctor : {
                include : {
                    specialties : true,
                    appointments : true,
                    reviews : true,
                    prescriptions : true,
                }
            },
            admin : true,
        }
    })

    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    return isUserExists;
}

const getNewToken = async (refreshToken : string, sessionToken : string) => {

    const isSessionTokenExists = await prisma.session.findUnique({
        where : {
            token : sessionToken,
        },
        include : {
            user : true,
        }
    })

    if(!isSessionTokenExists){
        throw new AppError(status.UNAUTHORIZED, "Invalid session token");
    }

    const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET)


    if(!verifiedRefreshToken.success && verifiedRefreshToken.error){
        throw new AppError(status.UNAUTHORIZED, "Invalid refresh token");
    }

    const data = verifiedRefreshToken.data as JwtPayload;

    const newAccessToken = tokenUtils.getAccessToken({
        userId: data.userId,
        role: data.role,
        name: data.name,
        email: data.email,
        status: data.status,
        isDeleted: data.isDeleted,
        emailVerified: data.emailVerified,
    });

    const newRefreshToken = tokenUtils.getRefreshToken({
        userId: data.userId,
        role: data.role,
        name: data.name,
        email: data.email,
        status: data.status,
        isDeleted: data.isDeleted,
        emailVerified: data.emailVerified,
    });

    const {token} = await prisma.session.update({
        where : {
            token : sessionToken
        },
        data : {
            token : sessionToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 60 * 24 * 1000),
            updatedAt: new Date(),
        }
    })

    return {
        accessToken : newAccessToken,
        refreshToken : newRefreshToken,
        sessionToken : token,
    }

}

const changePassword = async (payload : IChangePasswordPayload, sessionToken : string) =>{
    const session = await auth.api.getSession({
        headers : new Headers({
            Authorization : `Bearer ${sessionToken}`
        })
    })

    if(!session){
        throw new AppError(status.UNAUTHORIZED, "Invalid session token");
    }

    const {currentPassword, newPassword} = payload;

    const result = await auth.api.changePassword({
        body :{
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
        },
        headers : new Headers({
            Authorization : `Bearer ${sessionToken}`
        })
    })

    if(session.user.needPasswordChange){
        await prisma.user.update({
            where: {
                id: session.user.id,
            },
            data: {
                needPasswordChange: false,
            }
        })
    }

    const accessToken = tokenUtils.getAccessToken({
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
        status: session.user.status,
        isDeleted: session.user.isDeleted,
        emailVerified: session.user.emailVerified,
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
        status: session.user.status,
        isDeleted: session.user.isDeleted,
        emailVerified: session.user.emailVerified,
    });
    

    return {
        ...result,
        accessToken,
        refreshToken,
    }
}

const logoutUser = async (sessionToken : string) => {
    const result = await auth.api.signOut({
        headers : new Headers({
            Authorization : `Bearer ${sessionToken}`
        })
    })

    return result;
}

const verifyEmail = async (email : string, otp : string) => {

    const result = await auth.api.verifyEmailOTP({
        body:{
            email,
            otp,
        }
    })

    if(result.status && !result.user.emailVerified){
        await prisma.user.update({
            where : {
                email,
            },
            data : {
                emailVerified: true,
            }
        })
    }
}

const forgetPassword = async (email : string) => {
    const isUserExist = await prisma.user.findUnique({
        where : {
            email,
        }
    })

    if(!isUserExist){
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    if(!isUserExist.emailVerified){
        throw new AppError(status.BAD_REQUEST, "Email not verified");
    }

    if(isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED){
        throw new AppError(status.NOT_FOUND, "User not found"); 
    }

    await auth.api.requestPasswordResetEmailOTP({
        body:{
            email,
        }
    })
}

const resetPassword = async (email : string, otp : string, newPassword : string) => {
    const isUserExist = await prisma.user.findUnique({
        where: {
            email,
        }
    })

    if (!isUserExist) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    if (!isUserExist.emailVerified) {
        throw new AppError(status.BAD_REQUEST, "Email not verified");
    }

    if (isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    await auth.api.resetPasswordEmailOTP({
        body:{
            email,
            otp,
            password : newPassword,
        }
    })

    if (isUserExist.needPasswordChange) {
        await prisma.user.update({
            where: {
                id: isUserExist.id,
            },
            data: {
                needPasswordChange: false,
            }
        })
    }

    await prisma.session.deleteMany({
        where:{
            userId : isUserExist.id,
        }
    })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const googleLoginSuccess = async (session : Record<string, any>) =>{
    const isPatientExists = await prisma.patient.findUnique({
        where : {
            userId : session.user.id,
        }
    })

    if(!isPatientExists){
        await prisma.patient.create({
            data : {
                userId : session.user.id,
                name : session.user.name,
                email : session.user.email,
            }
        
        })
    }

    const accessToken = tokenUtils.getAccessToken({
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: session.user.id,
        role: session.user.role,
        name: session.user.name,
    });

    return {
        accessToken,
        refreshToken,
    }
}

export const AuthService = {
    registerPatient,
    loginUser,
    getMe,
    getNewToken,
    changePassword,
    logoutUser,
    verifyEmail,
    forgetPassword,
    resetPassword,
    googleLoginSuccess,
};
```

---

### File: `src/app/module/doctorSchedule/doctorSchedule.constant.ts`

```typescript
// File: src/app/module/doctorSchedule/doctorSchedule.constant.ts

import { Prisma } from "../../../generated/prisma/client"

export const doctorScheduleSearchableFields = [
    'id',
    'doctorId',
    'scheduleId',
]

export const doctorScheduleFilterableFields = [
    'id',
    'doctorId',
    'scheduleId',
    'createdAt',
    'updatedAt',
    'isBooked',
    'schedule.startDateTime',
    'schedule.endDateTime',
]

export const doctorScheduleIncludeConfig : Partial<Record<keyof Prisma.DoctorSchedulesInclude, Prisma.DoctorSchedulesInclude[keyof Prisma.DoctorSchedulesInclude]>> ={
    doctor: {
        include: {
            user: true,
            appointments: true,
            specialties: true,
        }
    },
    schedule: true

}
```

---

### File: `src/app/module/doctorSchedule/doctorSchedule.controller.ts`

```typescript
// File: src/app/module/doctorSchedule/doctorSchedule.controller.ts

import { Request, Response } from "express";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DoctorScheduleService } from "./doctorSchedule.service";

const createMyDoctorSchedule = catchAsync( async (req : Request, res : Response) => {
    const payload = req.body;
    const user = req.user;
    const doctorSchedule = await DoctorScheduleService.createMyDoctorSchedule(user, payload);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.CREATED,
        message: 'Doctor schedule created successfully',
        data: doctorSchedule
    });
});

const getMyDoctorSchedules = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const query = req.query;
    const result = await DoctorScheduleService.getMyDoctorSchedules(user, query as IQueryParams);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Doctor schedules retrieved successfully',
        data: result.data,
        meta: result.meta
    });
});

const getAllDoctorSchedules = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result  = await DoctorScheduleService.getAllDoctorSchedules(query as IQueryParams);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'All doctor schedules retrieved successfully',
        data: result.data,
        meta: result.meta
    });
});

const getDoctorScheduleById = catchAsync(async (req: Request, res: Response) => {
    const doctorId = req.params.doctorId;
    const scheduleId = req.params.scheduleId;
    const doctorSchedule = await DoctorScheduleService.getDoctorScheduleById(doctorId as string, scheduleId as string);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Doctor schedule retrieved successfully',
        data: doctorSchedule
    });
});

const updateMyDoctorSchedule = catchAsync( async (req : Request, res : Response) => {
    const payload = req.body;
    const user = req.user;
    const updatedDoctorSchedule = await DoctorScheduleService.updateMyDoctorSchedule(user, payload);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,  
        message: 'Doctor schedule updated successfully',
        data: updatedDoctorSchedule
    });
});

const deleteMyDoctorSchedule = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const user = req.user;
    await DoctorScheduleService.deleteMyDoctorSchedule(id as string, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Doctor schedule deleted successfully',
    });
});


export const DoctorScheduleController = {
    createMyDoctorSchedule,
    getMyDoctorSchedules,
    getAllDoctorSchedules,
    getDoctorScheduleById,
    updateMyDoctorSchedule,
    deleteMyDoctorSchedule
}

```

---

### File: `src/app/module/doctorSchedule/doctorSchedule.interface.ts`

```typescript
// File: src/app/module/doctorSchedule/doctorSchedule.interface.ts

export interface ICreateDoctorSchedulePayload {
    scheduleIds : string[];
}

export interface IUpdateDoctorSchedulePayload {
    scheduleIds :{
        shouldDelete : boolean;
        id : string;
    }[]
}
```

---

### File: `src/app/module/doctorSchedule/doctorSchedule.route.ts`

```typescript
// File: src/app/module/doctorSchedule/doctorSchedule.route.ts

import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { DoctorScheduleController } from "./doctorSchedule.controller";


const router = Router();

router.post("/create-my-doctor-schedule",
    checkAuth(Role.DOCTOR),
     DoctorScheduleController.createMyDoctorSchedule);
router.get("/my-doctor-schedules", checkAuth(Role.DOCTOR), DoctorScheduleController.getMyDoctorSchedules);
router.get("/", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), DoctorScheduleController.getAllDoctorSchedules);
router.get("/:doctorId/schedule/:scheduleId", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), DoctorScheduleController.getDoctorScheduleById);
router.patch("/update-my-doctor-schedule",
    checkAuth(Role.DOCTOR),
    DoctorScheduleController.updateMyDoctorSchedule);
router.delete("/delete-my-doctor-schedule/:id", checkAuth(Role.DOCTOR), DoctorScheduleController.deleteMyDoctorSchedule);

export const DoctorScheduleRoutes = router;
```

---

### File: `src/app/module/doctorSchedule/doctorSchedule.service.ts`

```typescript
// File: src/app/module/doctorSchedule/doctorSchedule.service.ts

import { DoctorSchedules, Prisma } from "../../../generated/prisma/client";
import { IQueryParams } from "../../interfaces/query.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { doctorScheduleFilterableFields, doctorScheduleIncludeConfig, doctorScheduleSearchableFields } from "./doctorSchedule.constant";
import { ICreateDoctorSchedulePayload, IUpdateDoctorSchedulePayload } from "./doctorSchedule.interface";

const createMyDoctorSchedule = async (user : IRequestUser, payload : ICreateDoctorSchedulePayload) => {
    const doctorData = await prisma.doctor.findUniqueOrThrow({
        where:{
            email : user.email
        }
    });

    const doctorScheduleData = payload.scheduleIds.map((scheduleId) => ({
        doctorId : doctorData.id,
        scheduleId
    }) )

    await prisma.doctorSchedules.createMany({
        data : doctorScheduleData
    });

    const result = await prisma.doctorSchedules.findMany({
        where : {
            doctorId : doctorData.id,
            scheduleId : {
                in : payload.scheduleIds
            }
        },
        include : {
            schedule: true
        }
    })
    

    return result;
}

const getMyDoctorSchedules = async (user : IRequestUser, query : IQueryParams) => {
    const doctorData = await prisma.doctor.findUniqueOrThrow({
        where:{
            email : user.email
        }
    });
    const queryBuilder = new QueryBuilder<DoctorSchedules, Prisma.DoctorSchedulesWhereInput, Prisma.DoctorSchedulesInclude>(prisma.doctorSchedules,
    {
    doctorId: doctorData.id,
    ...query
    }, 
    {
        filterableFields: doctorScheduleFilterableFields,
        searchableFields: doctorScheduleSearchableFields
    })
    const doctorSchedules = await queryBuilder
    .search()
    .filter()
    .paginate()
    .include({
        schedule: true,
        doctor : {
            include:{
                user: true,
            }
        }
    })
    .sort()
    .fields()
    .dynamicInclude(doctorScheduleIncludeConfig)
    .execute();
    return doctorSchedules;
}

const getAllDoctorSchedules = async (query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<DoctorSchedules, Prisma.DoctorSchedulesWhereInput, Prisma.DoctorSchedulesInclude>(prisma.doctorSchedules, query, {
        filterableFields: doctorScheduleFilterableFields,
        searchableFields: doctorScheduleSearchableFields
    })

    const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .dynamicInclude(doctorScheduleIncludeConfig)
    .sort()
    .execute();

    return result;
}

const getDoctorScheduleById = async (doctorId: string, scheduleId: string) => {
    const doctorSchedule = await prisma.doctorSchedules.findUnique({
        where: {
            doctorId_scheduleId: {
                doctorId: doctorId,
                scheduleId: scheduleId
            }
        },
        include: {
            schedule: true,
            doctor: true
        }
    });
    return doctorSchedule;
}


const updateMyDoctorSchedule = async (user : IRequestUser, payload: IUpdateDoctorSchedulePayload) => {
        const doctorData = await prisma.doctor.findUniqueOrThrow({
            where:{
                email : user.email
            }
        });

        const deleteIds = payload.scheduleIds.filter(schedule => schedule.shouldDelete).map(schedule => schedule.id);

        const createIds = payload.scheduleIds.filter(schedule => !schedule.shouldDelete).map(schedule => schedule.id);

        const result = await prisma.$transaction(async (tx) => {

            await tx.doctorSchedules.deleteMany({
                where : {
                    isBooked: false,
                    doctorId : doctorData.id,
                    scheduleId : {
                        in : deleteIds
                    }
                }
            });

            const doctorScheduleData = createIds.map((scheduleId) => ({
                doctorId : doctorData.id,
                scheduleId
            }) )

            const result = await tx.doctorSchedules.createMany({
                data : doctorScheduleData
            });

            return result;
        })

        return result;
}

const deleteMyDoctorSchedule = async (id: string, user: IRequestUser) => {
    const doctorData = await prisma.doctor.findUniqueOrThrow({
        where: {
            email: user.email
        }
    });

    await prisma.doctorSchedules.deleteMany({
        where: {
            isBooked: false,
            doctorId: doctorData.id,
            scheduleId: id
        }
    });
}



export const DoctorScheduleService = {
    createMyDoctorSchedule,
    getAllDoctorSchedules,
    getDoctorScheduleById,
    updateMyDoctorSchedule,
    deleteMyDoctorSchedule,
    getMyDoctorSchedules
}
```

---

### File: `src/app/module/doctorSchedule/doctorSchedule.validation.ts`

```typescript
// File: src/app/module/doctorSchedule/doctorSchedule.validation.ts


```

---

### File: `src/app/module/doctor/doctor.constant.ts`

```typescript
// File: src/app/module/doctor/doctor.constant.ts

import { Prisma } from "../../../generated/prisma/client";

export const doctorSearchableFields = ['name', 'email', 'qualification', 'designation', 'currentWorkingPlace', 'registrationNumber', 'specialties.specialty.title'];

export const doctorFilterableFields = ['gender', 'isDeleted', 'appointmentFee', 'experience', 'registrationNumber', 'specialties.specialtyId', 'currentWorkingPlace', 'designation', 'qualification', 'specialties.specialty.title', 'user.role'];

export const doctorIncludeConfig : Partial<Record<keyof Prisma.DoctorInclude, Prisma.DoctorInclude[keyof Prisma.DoctorInclude]>> ={
    user: true,
    specialties: {
        include:{
            specialty: true
        }
    },
    appointments: {
        include: {
            patient: true,
            doctor: true,

        }
    },
    doctorSchedules: {
        include: {
            schedule: true
        }
    },
    prescriptions: true,
    reviews: true,
}
```

---

### File: `src/app/module/doctor/doctor.controller.ts`

```typescript
// File: src/app/module/doctor/doctor.controller.ts

import { Request, Response } from "express";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DoctorService } from "./doctor.service";

const getAllDoctors = catchAsync(
    async (req: Request, res: Response) => {
        const query = req.query;

        const result = await DoctorService.getAllDoctors(query as IQueryParams);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctors fetched successfully",
            data: result.data,
            meta: result.meta,
        })
    }
)

const getDoctorById = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const doctor = await DoctorService.getDoctorById(id as string);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctor fetched successfully",
            data: doctor,
        })
    }
)

const updateDoctor = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const payload = req.body;

        const updatedDoctor = await DoctorService.updateDoctor(id as string, payload);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctor updated successfully",
            data: updatedDoctor,
        })
    }
)

const deleteDoctor = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const result = await DoctorService.deleteDoctor(id as string);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Doctor deleted successfully",
            data: result,
        })
    }
)

export const DoctorController = {
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
};
```

---

### File: `src/app/module/doctor/doctor.interface.ts`

```typescript
// File: src/app/module/doctor/doctor.interface.ts

import { Gender } from "../../../generated/prisma/enums";

export interface IUpdateDoctorSpecialtyPayload {
    specialtyId: string;
    shouldDelete?: boolean;
}
export interface IUpdateDoctorPayload {
    doctor?: {
        name?: string;
        profilePhoto?: string;
        contactNumber?: string;
        address?: string;
        experience?: number
        registrationNumber?: string;
        gender?: Gender;
        appointmentFee?: number;
        qualification?: string;
        currentWorkingPlace?: string;
        designation?: string;
    },
    specialties?: IUpdateDoctorSpecialtyPayload[];
}
```

---

### File: `src/app/module/doctor/doctor.route.ts`

```typescript
// File: src/app/module/doctor/doctor.route.ts

//doctor.route.ts
import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { DoctorController } from "./doctor.controller";
import { updateDoctorZodSchema } from "./doctor.validation";

const router = Router();

router.get("/",
    // checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    DoctorController.getAllDoctors);
router.get("/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    DoctorController.getDoctorById);
router.patch("/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateDoctorZodSchema), DoctorController.updateDoctor);
router.delete("/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    DoctorController.deleteDoctor);

export const DoctorRoutes = router;
```

---

### File: `src/app/module/doctor/doctor.service.ts`

```typescript
// File: src/app/module/doctor/doctor.service.ts

import status from "http-status";
import { Doctor, Prisma } from "../../../generated/prisma/client";
import { UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { doctorFilterableFields, doctorIncludeConfig, doctorSearchableFields } from "./doctor.constant";
import { IUpdateDoctorPayload } from "./doctor.interface";

// /doctors?specialty=cardiology&include=doctorSchedules,appointments
const getAllDoctors = async (query : IQueryParams) => {
    // const doctors = await prisma.doctor.findMany({
    //     where: {
    //         isDeleted: false,
    //     },
    //     include: {
    //         user: true,
    //         specialties: {
    //             include: {
    //                 specialty: true
    //             }
    //         }
    //     }
    // })

    // // const query = new QueryBuilder().paginate().search().filter();
    // return doctors;

    const queryBuilder = new QueryBuilder<Doctor, Prisma.DoctorWhereInput, Prisma.DoctorInclude>(
        prisma.doctor,
        query,
        {
            searchableFields: doctorSearchableFields,
            filterableFields: doctorFilterableFields,
        }
    )

    const result = await queryBuilder
        .search()
        .filter()
        .where({
            isDeleted: false,
        })
        .include({
            user: true,
            // specialties: true,
            specialties: {
                include:{
                    specialty: true
                }
            },
        })
        .dynamicInclude(doctorIncludeConfig)
        .paginate()
        .sort()
        .fields()
        .execute();

        console.log(result);
    return result;
}

const getDoctorById = async (id: string) => {
    const doctor = await prisma.doctor.findUnique({
        where: {
            id,
            isDeleted: false,
        },
        include: {
            user: true,
            specialties: {
                include: {
                    specialty: true
                }
            },
            appointments: {
                include: {
                    patient: true,
                    schedule: true,
                    prescription: true,
                }
            },
            doctorSchedules: {
                include: {
                    schedule: true,
                }
            },
            reviews: true
        }
    })
    return doctor;
}

const updateDoctor = async (id: string, payload: IUpdateDoctorPayload) => {
    const isDoctorExist = await prisma.doctor.findUnique({
        where: {
            id,
        }
    })

    if (!isDoctorExist) {
        throw new AppError(status.NOT_FOUND, "Doctor not found");
    }

    const { doctor: doctorData, specialties } = payload;

    await prisma.$transaction(async (tx) => {
        if (doctorData) {
            await tx.doctor.update({
                where: {
                    id,
                },
                data: {
                    ...doctorData,
                }
            })
        }

        if (specialties && specialties.length > 0) {
            for (const specialty of specialties) {
                const { specialtyId, shouldDelete } = specialty;
                if (shouldDelete) {
                    await tx.doctorSpecialty.delete({
                        where: {
                            doctorId_specialtyId: {
                                doctorId: id,
                                specialtyId,
                            }
                        }
                    })
                } else {
                    await tx.doctorSpecialty.upsert({
                        where: {
                            doctorId_specialtyId: {
                                doctorId: id,
                                specialtyId,
                            }
                        },
                        create: {
                            doctorId: id,
                            specialtyId,
                        },
                        update: {}
                    })
                }
            }
        }
    })

    const doctor = await getDoctorById(id);

    return doctor;
}

//soft delete
const deleteDoctor = async (id: string) => {
    const isDoctorExist = await prisma.doctor.findUnique({
        where: { id },
        include: { user: true }
    })

    if (!isDoctorExist) {
        throw new AppError(status.NOT_FOUND, "Doctor not found");
    }

    await prisma.$transaction(async (tx) => {
        await tx.doctor.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        })

        await tx.user.update({
            where: { id: isDoctorExist.userId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                status: UserStatus.DELETED // Optional: you may also want to block the user
            },
        })

        await tx.session.deleteMany({
            where: { userId: isDoctorExist.userId }
        })

        await tx.doctorSpecialty.deleteMany({
            where: { doctorId: id }
        })
    })

    return { message: "Doctor deleted successfully" };
}

export const DoctorService = {
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
}
```

---

### File: `src/app/module/doctor/doctor.validation.ts`

```typescript
// File: src/app/module/doctor/doctor.validation.ts

import z from "zod";
import { Gender } from "../../../generated/prisma/enums";
export const updateDoctorZodSchema = z.object({
    doctor: z.object({
        name: z.string("Name must be string").min(5, "Name must be at least 5 characters").max(30, "Name must be at most 30 characters").optional(),
        profilePhoto: z.url("Profile photo must be a valid URL").optional(),
        contactNumber: z.string("Contact number must be string").min(11, "Contact number must be at least 11 characters").max(14, "Contact number must be at most 15 characters").optional(),
        address: z.string("Address must be string").min(10, "Address must be at least 10 characters").max(100, "Address must be at most 100 characters").optional(),
        registrationNumber: z.string("Registration number must be string").optional(),
        experience: z.int("Experience must be an integer").nonnegative("Experience cannot be negative").optional(),
        gender: z.enum([Gender.MALE, Gender.FEMALE], "Gender must be either MALE or FEMALE").optional(),
        appointmentFee: z.number("Appointment fee must be a number").nonnegative("Appointment fee cannot be negative").optional(),
        qualification: z.string("Qualification must be string").min(2, "Qualification must be at least 2 characters").max(50, "Qualification must be at most 50 characters").optional(),
        currentWorkingPlace: z.string("Current working place must be string").min(2, "Current working place must be at least 2 characters").max(50, "Current working place must be at most 50 characters").optional(),
        designation: z.string("Designation must be string").min(2, "Designation must be at least 2 characters").max(50, "Designation must be at most 50 characters").optional(),
    }).optional(),
    specialties: z.array(z.object({
        specialtyId: z.uuid("Specialty ID must be a valid UUID"),
        shouldDelete: z.boolean("shouldDelete must be a boolean").optional(),
    })).optional()
})

```

---

### File: `src/app/module/payment/payment.controller.ts`

```typescript
// File: src/app/module/payment/payment.controller.ts

 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";

const handleStripeWebhookEvent = catchAsync(async (req : Request, res : Response) => {
    const signature = req.headers['stripe-signature'] as string
    const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

    if(!signature || !webhookSecret){
        console.error("Missing Stripe signature or webhook secret");
        return res.status(status.BAD_REQUEST).json({message : "Missing Stripe signature or webhook secret"})
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error : any) {
        console.error("Error processing Stripe webhook:", error);
        return res.status(status.BAD_REQUEST).json({message : "Error processing Stripe webhook"})
    }

    try {
        const result = await PaymentService.handlerStripeWebhookEvent(event);

        sendResponse(res, {
            httpStatusCode : status.OK,
            success : true,
            message : "Stripe webhook event processed successfully",
            data : result
        })
    } catch (error) {
        console.error("Error handling Stripe webhook event:", error);
        sendResponse(res, {
            httpStatusCode : status.INTERNAL_SERVER_ERROR,
            success : false,
            message : "Error handling Stripe webhook event"
        })
    }
})

export const PaymentController = {
    handleStripeWebhookEvent
}
```

---

### File: `src/app/module/payment/payment.interface.ts`

```typescript
// File: src/app/module/payment/payment.interface.ts


```

---

### File: `src/app/module/payment/payment.route.ts`

```typescript
// File: src/app/module/payment/payment.route.ts


```

---

### File: `src/app/module/payment/payment.service.ts`

```typescript
// File: src/app/module/payment/payment.service.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { PaymentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";


const handlerStripeWebhookEvent = async (event : Stripe.Event) =>{

    const existingPayment = await prisma.payment.findFirst({
        where:{
            stripeEventId : event.id
        }
    })

    if(existingPayment){
        console.log(`Event ${event.id} already processed. Skipping`);
        return {message : `Event ${event.id} already processed. Skipping`}
    }

    switch(event.type){
        case "checkout.session.completed" : {
            const session = event.data.object 

            const appointmentId = session.metadata?.appointmentId

            const paymentId = session.metadata?.paymentId

            if(!appointmentId || !paymentId){
                console.error("Missing appointmentId or paymentId in session metadata");
                return {message : "Missing appointmentId or paymentId in session metadata"}
            }

            const appointment = await prisma.appointment.findUnique({
                where : {
                    id : appointmentId
                }
            })

            if(!appointment){
                console.error(`Appointment with id ${appointmentId} not found`);
                return {message : `Appointment with id ${appointmentId} not found`}
            }

            await prisma.$transaction(async (tx) => {
                await tx.appointment.update({
                    where : {
                        id : appointmentId
                    },
                    data : {
                        paymentStatus : session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID
                    }
                });

                await tx.payment.update({
                    where : {
                        id : paymentId
                    },
                    data : {
                        stripeEventId : event.id,
                        status : session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID,
                        paymentGatewayData : session as any,
                    }
                });
            });

            console.log(`Processed checkout.session.completed for appointment ${appointmentId} and payment ${paymentId}`);
            break;
        }
        case "checkout.session.expired" : {
                const session = event.data.object

                console.log(`Checkout session ${session.id} expired. Marking associated payment as failed.`);
                break;

        }
        case "payment_intent.payment_failed" : {
            const session = event.data.object

            console.log(`Payment intent ${session.id} failed. Marking associated payment as failed.`);
            break;
        }
        default :
            console.log(`Unhandled event type ${event.type}`);
    }

    return {message : `Webhook Event ${event.id} processed successfully`}
}

export const PaymentService = {
    handlerStripeWebhookEvent
}
```

---

### File: `src/app/module/payment/payment.validation.ts`

```typescript
// File: src/app/module/payment/payment.validation.ts


```

---

### File: `src/app/module/schedule/schedule.constant.ts`

```typescript
// File: src/app/module/schedule/schedule.constant.ts

import { Prisma } from "../../../generated/prisma/client"

export const scheduleFilterableFields = [
    'id',
    'startDateTime',
    'endDateTime',
    // 'appointments.doctors.id',
]

export const scheduleSearchableFields = [
    'id',
    'startDateTime',
    'endDateTime',
]

export const scheduleIncludeConfig : Partial<Record<keyof Prisma.ScheduleInclude, Prisma.ScheduleInclude[keyof Prisma.ScheduleInclude]>> ={
    appointments: {
        include: {
            doctor: true,
            patient: true,
            payment: true,
            prescription: true,
            review: true,
        }
    },
    doctorSchedules: true
}
```

---

### File: `src/app/module/schedule/schedule.controller.ts`

```typescript
// File: src/app/module/schedule/schedule.controller.ts

import { Request, Response } from "express";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ScheduleService } from "./schedule.service";

const createSchedule = catchAsync( async (req : Request, res : Response) => {
    const payload = req.body;
    const schedule = await ScheduleService.createSchedule(payload);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.CREATED,
        message: 'Schedule created successfully',
        data: schedule
    });
});

const getAllSchedules = catchAsync( async (req : Request, res : Response) => {
    const query = req.query;
    const result = await ScheduleService.getAllSchedules(query as IQueryParams);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Schedules retrieved successfully',
        data: result.data,
        meta: result.meta
    });
});

const getScheduleById = catchAsync( async (req : Request, res : Response) => {
    const { id } = req.params;
    const schedule = await ScheduleService.getScheduleById(id as string);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Schedule retrieved successfully',
        data: schedule
    });
});

const updateSchedule = catchAsync( async (req : Request, res : Response) => {
    const { id } = req.params;
    const payload = req.body;
    const updatedSchedule = await ScheduleService.updateSchedule(id as string, payload);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Schedule updated successfully',
        data: updatedSchedule
    });
});

const deleteSchedule = catchAsync( async (req : Request, res : Response) => {
    const { id } = req.params;
    await ScheduleService.deleteSchedule(id as string);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Schedule deleted successfully',
    });
}
);

export const ScheduleController = {
    createSchedule,
    getAllSchedules,
    getScheduleById,
    updateSchedule,
    deleteSchedule
}
```

---

### File: `src/app/module/schedule/schedule.interface.ts`

```typescript
// File: src/app/module/schedule/schedule.interface.ts

export interface ICreateSchedulePayload {
    startDate : string;
    endDate : string;
    startTime : string;
    endTime : string;
}

export interface IUpdateSchedulePayload {
    startDate : string;
    endDate : string;
    startTime : string;
    endTime : string;
}
```

---

### File: `src/app/module/schedule/schedule.route.ts`

```typescript
// File: src/app/module/schedule/schedule.route.ts

import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { ScheduleController } from "./schedule.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { ScheduleValidation } from "./schedule.validation";

const router = Router();

router.post('/', checkAuth(Role.ADMIN, Role.SUPER_ADMIN), validateRequest(ScheduleValidation.createScheduleZodSchema) , ScheduleController.createSchedule);
router.get('/', checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR), ScheduleController.getAllSchedules);
router.get('/:id', checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR), ScheduleController.getScheduleById);
router.patch('/:id', checkAuth(Role.ADMIN, Role.SUPER_ADMIN),validateRequest(ScheduleValidation.updateScheduleZodSchema), ScheduleController.updateSchedule);
router.delete('/:id', checkAuth(Role.ADMIN, Role.SUPER_ADMIN), ScheduleController.deleteSchedule);

export const scheduleRoutes = router;
```

---

### File: `src/app/module/schedule/schedule.service.ts`

```typescript
// File: src/app/module/schedule/schedule.service.ts

import { addHours, addMinutes, format } from "date-fns";
import { Prisma, Schedule } from "../../../generated/prisma/client";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { scheduleFilterableFields, scheduleIncludeConfig, scheduleSearchableFields } from "./schedule.constant";
import { ICreateSchedulePayload, IUpdateSchedulePayload } from "./schedule.interface";
import { convertDateTime } from "./schedule.utils";

const createSchedule = async (payload: ICreateSchedulePayload) =>{
    const { startDate, endDate, startTime, endTime } = payload;

    const interval = 30;

    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    const schedules = [];

    while (currentDate <= lastDate) {
        const startDateTime = new Date(
            addMinutes(
                addHours(
                    `${format(currentDate, "yyyy-MM-dd")}`,
                    Number(startTime.split(":")[0])
                ),
                Number(startTime.split(":")[1])
            )
        );

        const endDateTime = new Date(
            addMinutes(
                addHours(
                    `${format(currentDate, "yyyy-MM-dd")}`,
                    Number(endTime.split(":")[0])
                ),
                Number(endTime.split(":")[1])
            )
        );

        while (startDateTime < endDateTime) {
            const s = await convertDateTime(startDateTime);
            const e = await convertDateTime(addMinutes(startDateTime, interval));

            const scheduleData = {
                startDateTime: s,
                endDateTime: e
            }

            const existingSchedule = await prisma.schedule.findFirst({
                where: {
                    startDateTime: scheduleData.startDateTime,
                    endDateTime: scheduleData.endDateTime
                }
            })

            if (!existingSchedule) {
                const result = await prisma.schedule.create({
                    data: scheduleData
                })
                console.log(result);
                schedules.push(result);
            }

            startDateTime.setMinutes(startDateTime.getMinutes() + interval)
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return schedules;
}

const getAllSchedules = async (query : IQueryParams) => {
    const queryBuilder = new QueryBuilder<Schedule, Prisma.ScheduleWhereInput, Prisma.ScheduleInclude>(
        prisma.schedule,
        query,
        {
            searchableFields: scheduleSearchableFields,
            filterableFields:scheduleFilterableFields
        }
    )

    const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .dynamicInclude(scheduleIncludeConfig)
    .sort()
    .fields()
    .execute();

    return result;
}

const getScheduleById = async (id: string) => {
    const schedule = await prisma.schedule.findUnique({
        where: {
            id: id
        }
    });
    return schedule;
}

// refactoring - doctor's appointment or booked slot conflict check
const updateSchedule = async (id: string, payload: IUpdateSchedulePayload) => {
    const { startDate, endDate, startTime, endTime } = payload;
    const startDateTime = new Date(
        addMinutes(
            addHours(
                `${format(new Date(startDate), 'yyyy-MM-dd')}`,
                Number(startTime.split(':')[0])
            ),
            Number(startTime.split(':')[1])
        )
    );

    const endDateTime = new Date(
        addMinutes(
            addHours(
                `${format(new Date(endDate), 'yyyy-MM-dd')}`,
                Number(endTime.split(':')[0])
            ),
            Number(endTime.split(':')[1])
        )
    );

    const updatedSchedule = await prisma.schedule.update({
        where: {
            id: id
        },
        data: {
            startDateTime: startDateTime,
            endDateTime: endDateTime
        }
    });

    return updatedSchedule;
}

const deleteSchedule = async (id: string) => {
    await prisma.schedule.delete({
        where: {
            id: id
        }
    });
    return true;
}

export const ScheduleService = {
    createSchedule,
    getAllSchedules,
    getScheduleById,
    updateSchedule,
    deleteSchedule
}
```

---

### File: `src/app/module/schedule/schedule.utils.ts`

```typescript
// File: src/app/module/schedule/schedule.utils.ts

export const convertDateTime = async (date : Date) =>{
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + offset);
}
```

---

### File: `src/app/module/schedule/schedule.validation.ts`

```typescript
// File: src/app/module/schedule/schedule.validation.ts

import z from "zod";

const createScheduleZodSchema = z.object({
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
    }),
    startTime: z.string().refine((time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
        message: "Invalid time format",
    }),
    endTime: z.string().refine((time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
        message: "Invalid time format",
    }),
});


const updateScheduleZodSchema = z.object({
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
    }).optional(),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
    }).optional(),
    startTime: z.string().refine((time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
        message: "Invalid time format",
    }).optional(),
    endTime: z.string().refine((time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
        message: "Invalid time format",
    }).optional(),
});

export const ScheduleValidation = {
    createScheduleZodSchema,
    updateScheduleZodSchema
}
```

---

### File: `src/app/module/specialty/specialty.controller.ts`

```typescript
// File: src/app/module/specialty/specialty.controller.ts


import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SpecialtyService } from "./specialty.service";

const createSpecialty = catchAsync(
    async (req: Request, res: Response) => {
        console.log(req.body);
        console.log(req.file);
        const payload = {
            ...req.body,
            icon : req.file?.path
        };
        const result = await SpecialtyService.createSpecialty(payload);
        sendResponse(res, {
            httpStatusCode: 201,
            success: true,
            message: 'Specialty created successfully',
            data: result
        });
    }
)


const getAllSpecialties = catchAsync(
    async (req: Request, res: Response) => {
        const result = await SpecialtyService.getAllSpecialties();
        sendResponse(res, {
            httpStatusCode: 200,
            success: true,
            message: 'Specialties fetched successfully',
            data: result
        });
    }
)

const deleteSpecialty = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const result = await SpecialtyService.deleteSpecialty(id as string);
        sendResponse(res, {
            httpStatusCode: 200,
            success: true,
            message: 'Specialty deleted successfully',
            data: result
        });
    }
)

export const SpecialtyController = {
    createSpecialty,
    getAllSpecialties,
    deleteSpecialty
}
```

---

### File: `src/app/module/specialty/specialty.route.ts`

```typescript
// File: src/app/module/specialty/specialty.route.ts


import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SpecialtyController } from "./specialty.controller";
import { SpecialtyValidation } from "./specialty.validation";

const router = Router();

router.post('/', 
    // checkAuth(Role.ADMIN, Role.SUPER_ADMIN), 
    multerUpload.single("file"), 
    validateRequest(SpecialtyValidation.createSpecialtyZodSchema),
    SpecialtyController.createSpecialty);
router.get('/', SpecialtyController.getAllSpecialties);
router.delete('/:id', checkAuth(Role.ADMIN, Role.SUPER_ADMIN), SpecialtyController.deleteSpecialty);

export const SpecialtyRoutes = router;
```

---

### File: `src/app/module/specialty/specialty.service.ts`

```typescript
// File: src/app/module/specialty/specialty.service.ts

import { Specialty } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createSpecialty = async (payload: Specialty): Promise<Specialty> => {
    // throw new Error("Testing error handling in create specialty service");
    const specialty = await prisma.specialty.create({
        data: payload
    })

    return specialty;

}

const getAllSpecialties = async (): Promise<Specialty[]> => {

    const specialties = await prisma.specialty.findMany();
    return specialties;
}

const deleteSpecialty = async (id: string): Promise<Specialty> => {

    const specialty = await prisma.specialty.delete({
        where: { id }
    })

    return specialty;
}


export const SpecialtyService = {
    createSpecialty,
    getAllSpecialties,
    deleteSpecialty
}
```

---

### File: `src/app/module/specialty/specialty.validation.ts`

```typescript
// File: src/app/module/specialty/specialty.validation.ts

import z from "zod";

const createSpecialtyZodSchema = z.object({
    title : z.string("Title is required"),
    description : z.string("Description is required").optional(),
})

export const SpecialtyValidation = {
    createSpecialtyZodSchema
}
```

---

### File: `src/app/module/user/user.controller.ts`

```typescript
// File: src/app/module/user/user.controller.ts

import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { UserService } from "./user.service";

const createDoctor = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;

        const result = await UserService.createDoctor(payload);

        sendResponse(res, {
            httpStatusCode: status.CREATED,
            success: true,
            message: "Doctor registered successfully",
            data: result,
        })
    }
)

const createAdmin = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;

        const result = await UserService.createAdmin(payload);

        sendResponse(res, {
            httpStatusCode: status.CREATED,
            success: true,
            message: "Admin registered successfully",
            data: result,
        })
    }
)

export const UserController = {
    createDoctor,
    createAdmin,
};
```

---

### File: `src/app/module/user/user.interface.ts`

```typescript
// File: src/app/module/user/user.interface.ts

import { Gender } from "../../../generated/prisma/enums";
export interface ICreateDoctorPayload {
    password: string;
    doctor: {
        name: string;
        email: string;
        profilePhoto?: string;
        contactNumber?: string;
        address?: string;
        registrationNumber: string;
        experience?: number;
        gender: Gender;
        appointmentFee: number;
        qualification: string;
        currentWorkingPlace: string;
        designation: string;
    }
    specialties: string[];
}
export interface ICreateAdminPayload {
    password: string;
    admin: {
        name: string;
        email: string;
        profilePhoto?: string;
        contactNumber?: string;
    }
    role: "ADMIN" | "SUPER_ADMIN";
}
```

---

### File: `src/app/module/user/user.route.ts`

```typescript
// File: src/app/module/user/user.route.ts

import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { createDoctorZodSchema } from "./user.validation";




const router = Router();


router.post("/create-doctor",

    //     (req: Request, res: Response, next: NextFunction) => {

    //     const parsedResult = createDoctorZodSchema.safeParse(req.body);

    //     if (!parsedResult.success) {
    //         next(parsedResult.error)
    //     }

    //     //sanitizing the data
    //     req.body = parsedResult.data;

    //     next()

    // }, 

    validateRequest(createDoctorZodSchema),

    UserController.createDoctor);


router.post("/create-admin",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    UserController.createAdmin);

export const UserRoutes = router;
```

---

### File: `src/app/module/user/user.service.ts`

```typescript
// File: src/app/module/user/user.service.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import { Role, Specialty } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { ICreateAdminPayload, ICreateDoctorPayload } from "./user.interface";

const createDoctor = async (payload: ICreateDoctorPayload) => {

    const specialties: Specialty[] = [];

    for (const specialtyId of payload.specialties) {
        const specialty = await prisma.specialty.findUnique({
            where: {
                id: specialtyId
            }
        })
        if (!specialty) {
            // throw new Error(`Specialty with id ${specialtyId} not found`);
            throw new AppError(status.NOT_FOUND, `Specialty with id ${specialtyId} not found`);
        }
        specialties.push(specialty);
    }


    const userExists = await prisma.user.findUnique({
        where: {
            email: payload.doctor.email
        }
    })

    if (userExists) {
        // throw new Error("User with this email already exists");
        throw new AppError(status.CONFLICT, "User with this email already exists");
    }

    const userData = await auth.api.signUpEmail({
        body: {
            email: payload.doctor.email,
            password: payload.password,
            role: Role.DOCTOR,
            name: payload.doctor.name,
            needPasswordChange: true,
        }
    })


    try {
        const result = await prisma.$transaction(async (tx) => {
            const doctorData = await tx.doctor.create({
                data: {
                    userId: userData.user.id,
                    ...payload.doctor,
                }
            })

            const doctorSpecialtyData = specialties.map((specialty) => {
                return {
                    doctorId: doctorData.id,
                    specialtyId: specialty.id,
                }
            })

            await tx.doctorSpecialty.createMany({
                data: doctorSpecialtyData
            })

            const doctor = await tx.doctor.findUnique({
                where: {
                    id: doctorData.id
                },
                select: {
                    id: true,
                    userId: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    contactNumber: true,
                    address: true,
                    registrationNumber: true,
                    experience: true,
                    gender: true,
                    appointmentFee: true,
                    qualification: true,
                    currentWorkingPlace: true,
                    designation: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            status: true,
                            emailVerified: true,
                            image: true,
                            isDeleted: true,
                            deletedAt: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    },
                    specialties: {
                        select: {
                            specialty: {
                                select: {
                                    title: true,
                                    id: true
                                }
                            }
                        }
                    }
                }
            })

            return doctor;

        })

        return result;
    } catch (error) {
        console.log("Transaction error : ", error);
        await prisma.user.delete({
            where: {
                id: userData.user.id
            }
        })
        throw error;
    }
}

const createAdmin = async (payload: ICreateAdminPayload) => {
    //TODO: Validate who is creating the admin user. Only super admin can create admin user and only super admin can create super admin user but admin user cannot create super admin user

    const userExists = await prisma.user.findUnique({
        where: {
            email: payload.admin.email
        }
    })

    if (userExists) {
        throw new AppError(status.CONFLICT, "User with this email already exists");
    }

    const { admin, role, password } = payload;



    const userData = await auth.api.signUpEmail({
        body: {
            ...admin,
            password,
            role,
            needPasswordChange: true,
        }
    })

    try {
        const adminData = await prisma.admin.create({
            data: {
                userId: userData.user.id,
                ...admin,
            }
        })

        return adminData;


    } catch (error: any) {
        console.log("Error creating admin: ", error);
        await prisma.user.delete({
            where: {
                id: userData.user.id
            }
        })
        throw error;
    }


}

export const UserService = {
    createDoctor,
    createAdmin,
}
```

---

### File: `src/app/module/user/user.validation.ts`

```typescript
// File: src/app/module/user/user.validation.ts

import z from "zod";
import { Gender } from "../../../generated/prisma/enums";

export const createDoctorZodSchema = z.object({
    password: z.string("Password is required").min(6, "Password must be at least 6 characters").max(20, "Password must be at most 20 characters"),
    doctor: z.object({
        name: z.string("Name is required and must be string").min(5, "Name must be at least 5 characters").max(30, "Name must be at most 30 characters"),

        email: z.email("Invalid email address"),

        contactNumber: z.string("Contact number is required").min(11, "Contact number must be at least 11 characters").max(14, "Contact number must be at most 15 characters"),

        address: z.string("Address is required").min(10, "Address must be at least 10 characters").max(100, "Address must be at most 100 characters").optional(),

        registrationNumber: z.string("Registration number is required"),

        experience: z.int("Experience must be an integer").nonnegative("Experience cannot be negative").optional(),

        gender: z.enum([Gender.MALE, Gender.FEMALE], "Gender must be either MALE or FEMALE"),

        appointmentFee: z.number("Appointment fee must be a number").nonnegative("Appointment fee cannot be negative"),

        qualification: z.string("Qualification is required").min(2, "Qualification must be at least 2 characters").max(50, "Qualification must be at most 50 characters"),

        currentWorkingPlace: z.string("Current working place is required").min(2, "Current working place must be at least 2 characters").max(50, "Current working place must be at most 50 characters"),

        designation: z.string("Designation is required").min(2, "Designation must be at least 2 characters").max(50, "Designation must be at most 50 characters"),

    }),
    specialties: z.array(z.uuid(), "Specialties must be an array of strings").min(1, "At least one specialty is required")
})

export const createAdminZodSchema = z.object({
    password: z.string("Password is required").min(6, "Password must be at least 6 characters").max(20, "Password must be at most 20 characters"),
    admin: z.object({
        name: z.string("Name is required and must be string").min(5, "Name must be at least 5 characters").max(30, "Name must be at most 30 characters"),
        email: z.email("Invalid email address"),
        contactNumber: z.string("Contact number is required").min(11, "Contact number must be at least 11 characters").max(14, "Contact number must be at most 15 characters").optional(),
        profilePhoto: z.url("Profile photo must be a valid URL").optional(),
    }),
    role: z.enum(["ADMIN", "SUPER_ADMIN"], "Role must be either ADMIN or SUPER_ADMIN")
})

```

---

### File: `src/app/routes/index.ts`

```typescript
// File: src/app/routes/index.ts

import { Router } from "express";
import { AdminRoutes } from "../module/admin/admin.route";
import { AppointmentRoutes } from "../module/appointment/appointment.route";
import { AuthRoutes } from "../module/auth/auth.route";
import { DoctorRoutes } from "../module/doctor/doctor.route";
import { DoctorScheduleRoutes } from "../module/doctorSchedule/doctorSchedule.route";
import { scheduleRoutes } from "../module/schedule/schedule.route";
import { SpecialtyRoutes } from "../module/specialty/specialty.route";
import { UserRoutes } from "../module/user/user.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/specialties", SpecialtyRoutes)
router.use("/users", UserRoutes)
router.use("/doctors", DoctorRoutes)
router.use("/admins", AdminRoutes)
router.use("/schedules", scheduleRoutes)
router.use("/doctor-schedules", DoctorScheduleRoutes)
router.use("/appointments", AppointmentRoutes)


export const IndexRoutes = router;
```

---

### File: `src/app/shared/catchAsync.ts`

```typescript
// File: src/app/shared/catchAsync.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, RequestHandler, Response } from "express";

export const catchAsync = (fn: RequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await fn(req, res, next);
        } catch (error: any) {
            next(error);
        }
    }
}
```

---

### File: `src/app/shared/sendResponse.ts`

```typescript
// File: src/app/shared/sendResponse.ts

import { Response } from "express";

interface IResponseData<T> {
    httpStatusCode: number;
    success: boolean;
    message: string;
    data?: T;
    meta ?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }
}


export const sendResponse = <T>(res: Response, responseData: IResponseData<T>) => {
    const { httpStatusCode, success, message, data, meta } = responseData;

    res.status(httpStatusCode).json({
        success,
        message,
        data,
        meta
    });
}
```

---

### File: `src/app/templates/googleRedirect.ejs`

```html
// File: src/app/templates/googleRedirect.ejs

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Login</title>
</head>
<body>
    <div>
        <p>Redirecting To Google...</p>
    </div>
</body>
<script>
    (
        async () => {
            try {
                const response = await fetch("<%= betterAuthUrl %>/api/auth/sign-in/social", {
                    method : "POST",
                    headers : {
                        "Content-Type" : "application/json"
                    },
                    credentials : "include",
                    body: JSON.stringify({
                        provider : "google",
                        callbackURL: "<%= callbackURL %>"
                    })
                })

                const data = await response.json();

                if(data.url){
                    window.location.href = data.url
                }else{
                    document.body.innerHTML = `<div>
                    <p>
                        Error Occurred While Redirecting To Google. Please Try Again Later.
                    </p>
                    </div>`
                }
            } catch (error) {
                document.body.innerHTML = `<div>
                    <p>
                        Error Occurred While Redirecting To Google. Please Try Again Later.
                        ${error.message}
                    </p>
                    </div>`
            }
        }
    )()
</script>
</html>
```

---

### File: `src/app/templates/otp.ejs`

```html
// File: src/app/templates/otp.ejs

<h2>Hello <%= name %></h2>
<p>Your OTP is <b><%= otp %></b>. It will expire in 2 minutes.</p>
```

---

### File: `src/app/utils/QueryBuilder.ts`

```typescript
// File: src/app/utils/QueryBuilder.ts

import { IQueryConfig, IQueryParams, IQueryResult, PrismaCountArgs, PrismaFindManyArgs, PrismaModelDelegate, PrismaNumberFilter, PrismaStringFilter, PrismaWhereConditions } from "../interfaces/query.interface";

// T = Model Type
export class QueryBuilder<
T, 
TWhereInput = Record<string, unknown>,
TInclude = Record<string, unknown>

> {
    private query : PrismaFindManyArgs;
    private countQuery : PrismaCountArgs;
    private page : number = 1;
    private limit : number = 10;
    private skip : number = 0;
    private sortBy : string = 'createdAt';
    private sortOrder : 'asc' | 'desc' = 'desc';
    private selectFields: Record<string, boolean> | undefined;


    constructor(
        private model : PrismaModelDelegate,
        private queryParams : IQueryParams,
        private config : IQueryConfig = {}
    ){
        this.query = {
            where : {},
            include : {},
            orderBy : {},
            skip : 0,
            take : 10,
        };

        this.countQuery ={
            where : {},
        }
    }

    search() : this {
        const {searchTerm} = this.queryParams;
        const { searchableFields} = this.config;
        // doctorSearchableFields = ['user.name', 'user.email', 'specialties.specialty.title' , 'specialties.specialty.description']
        if(searchTerm && searchableFields && searchableFields.length > 0){
            const searchConditions : Record<string, unknown>[] = searchableFields.map((field) => {
                if(field.includes(".")){
                    const parts = field.split(".");

                    if(parts.length === 2){
                        const [relation, nestedField] = parts;

                        const stringFilter : PrismaStringFilter = {
                            contains : searchTerm,
                            mode : 'insensitive' as const,
                        }

                        return {
                            [relation] : {
                                [nestedField] : stringFilter
                            }
                        }
                    }else if(parts.length === 3){
                        const [relation, nestedRelation, nestedField] = parts;

                        const stringFilter : PrismaStringFilter = {
                            contains : searchTerm,
                            mode : 'insensitive' as const,
                        }

                        return {
                            [relation] : {
                                some :{
                                    [nestedRelation]: {
                                        [nestedField]: stringFilter
                                    }
                                }
                            }
                        }
                    }
                    
                }
                // direct field
                const stringFilter: PrismaStringFilter = {
                    contains: searchTerm,
                    mode: 'insensitive' as const,
                }

                return {
                    [field]: stringFilter
                }
            }
        )

        const whereConditions = this.query.where as PrismaWhereConditions

        whereConditions.OR = searchConditions;

        const countWhereConditions = this.countQuery.where as PrismaWhereConditions;
        countWhereConditions.OR = searchConditions;
        }

        return this;
    }
    // /doctors?searchTerm=john&page=1&sortBy=name&specialty=cardiology&appointmentFee[lt]=100 => {}
    // { specialty: 'cardiology', appointmentFee: { lt: '100' } }
    filter() : this {

        const { filterableFields } = this.config;
        const excludedField = ['searchTerm', 'page', 'limit', 'sortBy', 'sortOrder', 'fields', 'include'];

        const filterParams : Record<string, unknown> = {};

        Object.keys(this.queryParams).forEach((key) => {
            if(!excludedField.includes(key)){
                filterParams[key] = this.queryParams[key];
            }
        })

        const queryWhere = this.query.where as Record<string, unknown>;
        const countQueryWhere = this.countQuery.where as Record<string, unknown>;

        Object.keys(filterParams).forEach((key) => {
            const value = filterParams[key];

            if(value === undefined || value === ""){
                return;
            }

            const isAllowedField = !filterableFields || filterableFields.length === 0 || filterableFields.includes(key);

            
            // doctorFilterableFields = ['specialties.specialty.title', 'appointmentFee']
            // /doctors?appointmentFee[lt]=100&appointmentFee[gt]=50 => { appointmentFee: { lt: '100', gt: '50' } }

            // /doctors?user.name=John => { user: { name: 'John' } }
            if(key.includes(".")){
                const parts = key.split(".");

                if(filterableFields && !filterableFields.includes(key)){
                    return;
                }



                if(parts.length === 2){
                    const [relation, nestedField] = parts;

                    if(!queryWhere[relation]){
                        queryWhere[relation] = {};
                        countQueryWhere[relation] = {};
                    }

                    const queryRelation = queryWhere[relation] as Record<string, unknown>;
                    const countRelation = countQueryWhere[relation] as Record<string, unknown>;

                    queryRelation[nestedField] = this.parseFilterValue(value);
                    countRelation[nestedField] = this.parseFilterValue(value);
                    return;
                }
                else if(parts.length === 3){
                    const [relation, nestedRelation, nestedField] = parts;

                    if(!queryWhere[relation]){
                        queryWhere[relation] = {
                            some: {}
                        };
                        countQueryWhere[relation] = {
                            some: {}
                        };
                    }
                    
                    const queryRelation = queryWhere[relation] as Record<string, unknown>;
                    const countRelation = countQueryWhere[relation] as Record<string, unknown>;

                    if(!queryRelation.some){
                        queryRelation.some = {};
                    }
                    if(!countRelation.some){
                        countRelation.some = {};
                    }

                    const querySome = queryRelation.some as Record<string, unknown>;
                    const countSome = countRelation.some as Record<string, unknown>;

                    if(!querySome[nestedRelation]){
                        querySome[nestedRelation] = {};
                    }

                    if(!countSome[nestedRelation]){
                        countSome[nestedRelation] = {};
                    }

                    const queryNestedRelation = querySome[nestedRelation] as Record<string, unknown>;
                    const countNestedRelation = countSome[nestedRelation] as Record<string, unknown>;

                    queryNestedRelation[nestedField] = this.parseFilterValue(value);
                    countNestedRelation[nestedField] = this.parseFilterValue(value);

                    return;
                }

            }
            if (!isAllowedField) {
                return;
            }


            // Range filter parsing
            if(typeof value === 'object' && value !== null && !Array.isArray(value)){
                queryWhere[key] = this.parseRangeFilter(value as Record<string, string | number>);
                countQueryWhere[key] = this.parseRangeFilter(value as Record<string, string | number>);
                return;
            }

            //direct value parsing
            queryWhere[key] = this.parseFilterValue(value);
            countQueryWhere[key] = this.parseFilterValue(value);
        })
        return this;
    }

    paginate() : this {
        const page = Number(this.queryParams.page) || 1;
        const limit = Number(this.queryParams.limit) || 10;

        this.page = page;
        this.limit = limit;
        this.skip = (page - 1) * limit;

        this.query.skip = this.skip;
        this.query.take = this.limit;

        return this;
    }

    sort () : this {
        const sortBy = this.queryParams.sortBy || 'createdAt';
        const sortOrder = this.queryParams.sortOrder === 'asc' ? 'asc' : 'desc';

        this.sortBy = sortBy;
        this.sortOrder = sortOrder;

        // /doctors?sortBy=user.name&sortOrder=asc => orderBy: { user: { name: 'asc' } }

        if(sortBy.includes(".")){
            const parts = sortBy.split(".");

            if(parts.length === 2){
                const [relation, nestedField] = parts;

                this.query.orderBy = {
                    [relation] : {
                        [nestedField] : sortOrder
                    }
                }
            }else if(parts.length === 3){
                const [relation, nestedRelation, nestedField] = parts;

                this.query.orderBy = {
                    [relation] : {
                        [nestedRelation] : {
                            [nestedField] : sortOrder
                        }
                    }
                }
            }else{
                this.query.orderBy = {
                    [sortBy] : sortOrder
                }
            }
        }else{
            this.query.orderBy = {
                [sortBy]: sortOrder
            }
        }
        return this;
    }

    fields() : this {
        const fieldsParam = this.queryParams.fields;
        // /doctors?fields=id,name,user => select: { id: true, name: true, user: { select: { name: true } } }

        //no nested field selection for now, only direct fields
        if(fieldsParam && typeof fieldsParam === 'string'){
            const fieldsArray = fieldsParam?.split(",").map(field => field.trim());
            this.selectFields = {};

            fieldsArray?.forEach((field) => {
                if (this.selectFields) {
                    this.selectFields[field] = true;
                }
            })

            this.query.select = this.selectFields as Record<string, boolean | Record<string, unknown>>;

            delete this.query.include;
        }
        return this;
    }

    include(relation : TInclude) : this{
        if(this.selectFields){
            return this
        }

        //if fields method is, include method will be ignored to prevent conflict between select and include
        this.query.include = { ...(this.query.include as Record<string, unknown>), ...(relation as Record<string, unknown>) };

        return this;
    }

    dynamicInclude(
        includeConfig : Record<string, unknown>,
        defaultInclude ?: string[]
    ) : this{

        if(this.selectFields){
            return this;
        }

        const result : Record<string, unknown> = {};

        defaultInclude?.forEach((field) => {
            if(includeConfig[field]){
                result[field] = includeConfig[field];
            }
        })

        const includeParam = this.queryParams.include as string | undefined;

        if(includeParam && typeof includeParam === 'string'){
            const requestedRelations = includeParam.split(",").map(relation => relation.trim());

            requestedRelations.forEach((relation) => {
                if(includeConfig[relation]){
                    result[relation] = includeConfig[relation];
                }
            })
        }

        this.query.include = {...(this.query.include as Record<string, unknown>), ...result };

        return this;
    }

    where(condition : TWhereInput) : this {

        this.query.where =  this.deepMerge(this.query.where as Record<string, unknown>, condition as Record<string, unknown>);

        this.countQuery.where = this.deepMerge(this.countQuery.where as Record<string, unknown>, condition as Record<string, unknown>);

        return this;
    }

    async execute() : Promise<IQueryResult<T>> {
        const [total, data] = await Promise.all([
            this.model.count(this.countQuery as Parameters<typeof this.model.count>[0]),
            this.model.findMany(this.query as Parameters<typeof this.model.findMany>[0])
        ])

        const totalPages = Math.ceil(total / this.limit);

        return {
            data : data as T[],
            meta : {
                page : this.page,
                limit : this.limit,
                total,
                totalPages,
            }
        }

    }

    async count() : Promise<number> {
        return await this.model.count(this.countQuery as Parameters<typeof this.model.count>[0]);
    }

    getQuery() : PrismaFindManyArgs {
        return this.query;
    }

    private deepMerge(target : Record<string, unknown>, source : Record<string, unknown>) : Record<string, unknown> {

        const result = {...target};

        for(const key in source){
            if(source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])){
                if(result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])){
                    result[key] = this.deepMerge(result[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
                }else{
                    result[key] = source[key];
                }
            }else{
                result[key] = source[key];
            }
        }
        return result;
    }

    private parseFilterValue(value : unknown) : unknown {

        if(value === 'true'){
            return true;
        }
        if(value === 'false'){
            return false;
        }

        if(typeof value === 'string' && !isNaN(Number(value)) && value != ""){
            return Number(value);
        }

        if(Array.isArray(value)){
            return { in : value.map((item) => this.parseFilterValue(item)) }
        }

        return value;
    }

    private parseRangeFilter(value : Record<string, string | number>) : PrismaNumberFilter | PrismaStringFilter | Record<string, unknown> {

        const rangeQuery: Record<string, string | number | (string | number)[] > = {};

        Object.keys(value).forEach((operator) => {
            const operatorValue = value[operator];


            const parsedValue : string | number = typeof operatorValue === 'string' && !isNaN(Number(operatorValue)) ? Number(operatorValue) : operatorValue;

            switch(operator){
                case 'lt':
                case 'lte':
                case 'gt':
                case 'gte':
                case 'equals':
                case 'not':
                case 'contains':
                case 'startsWith':
                case 'endsWith':
                    rangeQuery[operator] = parsedValue;
                    break;

                case 'in':
                case 'notIn':
                    if(Array.isArray(operatorValue)){
                        rangeQuery[operator] = operatorValue
                    }else {
                        rangeQuery[operator] = [parsedValue];
                    }
                    break;
                default:
                    break;

            }
        });

        return Object.keys(rangeQuery).length > 0 ? rangeQuery : value;
    }
}
```

---

### File: `src/app/utils/cookie.ts`

```typescript
// File: src/app/utils/cookie.ts

import { CookieOptions, Request, Response } from "express";

const setCookie = (res: Response, key: string, value: string, options: CookieOptions) => {
    res.cookie(key, value, options);
}

const getCookie = (req: Request, key: string) => {
    return req.cookies[key];
}

const clearCookie = (res: Response, key: string, options: CookieOptions) => {
    res.clearCookie(key, options);
}

export const CookieUtils = {
    setCookie,
    getCookie,
    clearCookie,
}
```

---

### File: `src/app/utils/email.ts`

```typescript
// File: src/app/utils/email.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from "ejs";
import status from "http-status";
import nodemailer from "nodemailer";
import path from "path";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";

const transporter = nodemailer.createTransport({
    host : envVars.EMAIL_SENDER.SMTP_HOST,
    secure: true,
    auth: {
        user: envVars.EMAIL_SENDER.SMTP_USER,
        pass: envVars.EMAIL_SENDER.SMTP_PASS
    },
    port: Number(envVars.EMAIL_SENDER.SMTP_PORT)
})

interface SendEmailOptions {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType: string;
    }[]
}

export const sendEmail = async ({subject, templateData, templateName, to, attachments} : SendEmailOptions) => {
   
    
    try {
        const templatePath = path.resolve(process.cwd(), `src/app/templates/${templateName}.ejs`);

        const html = await ejs.renderFile(templatePath, templateData);

        const info = await transporter.sendMail({
            from: envVars.EMAIL_SENDER.SMTP_FROM,
            to : to,
            subject : subject,
            html : html,
            attachments: attachments?.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType: attachment.contentType,
            }))
        })

        console.log(`Email sent to ${to} : ${info.messageId}`);
    } catch (error : any) {
        console.log("Email Sending Error", error.message);
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
    }
}
```

---

### File: `src/app/utils/jwt.ts`

```typescript
// File: src/app/utils/jwt.ts


/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";


const createToken = (payload: JwtPayload, secret: string, { expiresIn }: SignOptions) => {
    const token = jwt.sign(payload, secret, { expiresIn });
    return token;
}

const verifyToken = (token: string, secret: string) => {
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        return {
            success: true,
            data: decoded
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message,
            error
        }
    }
}

const decodeToken = (token: string) => {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded;
}


export const jwtUtils = {
    createToken,
    verifyToken,
    decodeToken,
}
```

---

### File: `src/app/utils/seed.ts`

```typescript
// File: src/app/utils/seed.ts

import { Role } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const seedSuperAdmin = async () => {
    try {
        const isSuperAdminExist = await prisma.user.findFirst({
            where:{
                role : Role.SUPER_ADMIN
            }
        })

        if(isSuperAdminExist) {
            console.log("Super admin already exists. Skipping seeding super admin.");
            return;
        }

        const superAdminUser = await auth.api.signUpEmail({
            body:{
                email : envVars.SUPER_ADMIN_EMAIL,
                password : envVars.SUPER_ADMIN_PASSWORD,
                name : "Super Admin",
                role : Role.SUPER_ADMIN,
                needPasswordChange : false,
                rememberMe : false,
            }
        })

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where : {
                    id : superAdminUser.user.id
                },
                data : {
                    emailVerified : true,
                }
            });

            await tx.admin.create({
                data : {
                    userId : superAdminUser.user.id,
                    name : "Super Admin",
                    email : envVars.SUPER_ADMIN_EMAIL,
                }
            })

            
            
        });

        const superAdmin = await prisma.admin.findFirst({
            where : {
                email : envVars.SUPER_ADMIN_EMAIL,
            },
            include : {
                user : true,
            }
        })

        console.log("Super Admin Created ", superAdmin);
    } catch (error) {
        console.error("Error seeding super admin: ", error);
        try {
            await prisma.user.deleteMany({
                where: {
                    email: envVars.SUPER_ADMIN_EMAIL,
                },
            });
        } catch (cleanupError) {
            console.error("Failed to clean up super admin after error:", cleanupError);
        }
    }
}
```

---

### File: `src/app/utils/token.ts`

```typescript
// File: src/app/utils/token.ts

import { Response } from "express";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import { envVars } from "../config/env";
import { CookieUtils } from "./cookie";
import { jwtUtils } from "./jwt";


//Creating access token
const getAccessToken = (payload: JwtPayload) => {
    const accessToken = jwtUtils.createToken(
        payload,
        envVars.ACCESS_TOKEN_SECRET,
        { expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN } as SignOptions
    );

    return accessToken;
}

const getRefreshToken = (payload: JwtPayload) => {
    const refreshToken = jwtUtils.createToken(
        payload,
        envVars.REFRESH_TOKEN_SECRET,
        { expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN } as SignOptions
    );
    return refreshToken;
}


const setAccessTokenCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, 'accessToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: '/',
        //1 day
        maxAge: 60 * 60 * 24 * 1000,
    });
}

const setRefreshTokenCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, 'refreshToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: '/',
        //7d
        maxAge: 60 * 60 * 24 * 1000 * 7,
    });
}

const setBetterAuthSessionCookie = (res: Response, token: string) => {
    CookieUtils.setCookie(res, "better-auth.session_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: '/',
        //1 day
        maxAge: 60 * 60 * 24 * 1000,
    });
}



export const tokenUtils = {
    getAccessToken,
    getRefreshToken,
    setAccessTokenCookie,
    setRefreshTokenCookie,
    setBetterAuthSessionCookie,
}
```

---

### File: `src/server.ts`

```typescript
// File: src/server.ts

import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seed";

const bootstrap = async () => {
    try {
        app.listen(envVars.PORT, () => {
            console.log(`Server is running on http://localhost:${envVars.PORT}`);
        });

        // Run seedSuperAdmin non-blockingly so server start is instant
        seedSuperAdmin().catch((err) => {
            console.error('Error during initial super admin seeding:', err);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

bootstrap();
```

---

### File: `tsconfig.json`

```json
// File: tsconfig.json

{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "target": "es2023",
    "rootDir": "./",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "ignoreDeprecations": "5.0"
  },
  "include": ["src", "prisma.config.ts"],
  "exclude": ["node_modules", "dist"]
}

```

---

