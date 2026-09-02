import z from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registerPatientZodSchema = z.preprocess((val: any) => {
    if (val && typeof val === "object") {
        if (!val.contactNumber && (val.phone || val.phoneNumber)) {
            val.contactNumber = val.phone || val.phoneNumber;
        }
    }
    return val;
}, z.object({
    name: z.string({ message: "Name is required" }).min(2, { message: "Name must be at least 2 characters" }).max(50, { message: "Name must be at most 50 characters" }),
    email: z.string({ message: "Email is required" }).email({ message: "Invalid email address" }),
    password: z.string({ message: "Password is required" }).min(6, { message: "Password must be at least 6 characters" }).max(30, { message: "Password must be at most 30 characters" }),
    contactNumber: z.string({ message: "Contact number is required" }).min(11, { message: "Contact number must be at least 11 characters" }).max(15, { message: "Contact number must be at most 15 characters" }),
    address: z.string().optional(),
}));

const loginUserZodSchema = z.object({
    email: z.string({ message: "Email is required" }).email({ message: "Invalid email address" }),
    password: z.string({ message: "Password is required" }).min(1, { message: "Password is required" }),
});

const changePasswordZodSchema = z.object({
    currentPassword: z.string({ message: "Current password is required" }).min(1, { message: "Current password is required" }),
    newPassword: z.string({ message: "New password is required" }).min(6, { message: "New password must be at least 6 characters" }).max(30, { message: "New password must be at most 30 characters" }),
});

const verifyEmailZodSchema = z.object({
    email: z.string({ message: "Email is required" }).email({ message: "Invalid email address" }),
    otp: z.string({ message: "OTP is required" }).min(4, { message: "OTP must be at least 4 characters" }).max(10, { message: "OTP must be at most 10 characters" }),
});

const forgetPasswordZodSchema = z.object({
    email: z.string({ message: "Email is required" }).email({ message: "Invalid email address" }),
});

const resetPasswordZodSchema = z.object({
    email: z.string({ message: "Email is required" }).email({ message: "Invalid email address" }),
    otp: z.string({ message: "OTP is required" }).min(4, { message: "OTP must be at least 4 characters" }).max(10, { message: "OTP must be at most 10 characters" }),
    newPassword: z.string({ message: "New password is required" }).min(6, { message: "New password must be at least 6 characters" }).max(30, { message: "New password must be at most 30 characters" }),
});

export const AuthValidation = {
    registerPatientZodSchema,
    loginUserZodSchema,
    changePasswordZodSchema,
    verifyEmailZodSchema,
    forgetPasswordZodSchema,
    resetPasswordZodSchema,
};
