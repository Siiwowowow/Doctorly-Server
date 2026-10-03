import z from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registerPatientZodSchema = z.preprocess((val: any) => {
    if (val && typeof val === "object") {
        const rawPhone = val.contactNumber || val.phone || val.phoneNumber;
        if (rawPhone !== undefined && rawPhone !== null) {
            // Strip out spaces, dashes, parentheses but preserve digits and plus
            const cleaned = String(rawPhone).trim().replace(/[\s\-()]/g, "");
            val.contactNumber = cleaned;
            val.phoneNumber = cleaned;
        }
        if (val.name && typeof val.name === "string") {
            val.name = val.name.trim();
        }
        if (val.email && typeof val.email === "string") {
            val.email = val.email.trim().toLowerCase();
        }
    }
    return val;
}, z.object({
    name: z.string({ message: "Name is required" }).min(2, { message: "Name must be at least 2 characters" }).max(50, { message: "Name must be at most 50 characters" }),
    email: z.string({ message: "Email is required" }).email({ message: "Invalid email address" }),
    password: z.string({ message: "Password is required" }).min(6, { message: "Password must be at least 6 characters" }).max(50, { message: "Password must be at most 50 characters" }),
    contactNumber: z.string({ message: "Contact number is required" })
        .min(10, { message: "Contact number must be at least 10 characters" })
        .max(20, { message: "Contact number must be at most 20 characters" }),
    phoneNumber: z.string().optional(),
    address: z.string({ message: "Home address is required" }).trim().min(5, "Home address must be at least 5 characters").max(200, "Home address must be at most 200 characters"),
    dateOfBirth: z.string({ message: "Date of birth is required" })
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format")
        .refine((value) => {
            const date = new Date(`${value}T00:00:00.000Z`);
            return !Number.isNaN(date.getTime()) && date <= new Date();
        }, "Date of birth cannot be in the future"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Gender is required" }),
    bloodGroup: z.enum(["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"], { message: "Blood group is required" }),
    emergencyContactName: z.string({ message: "Emergency contact name is required" }).trim().min(2).max(80),
    emergencyContactNumber: z.string({ message: "Emergency contact number is required" })
        .trim().transform((value) => value.replace(/[\s\-()]/g, ""))
        .pipe(z.string().min(10, "Emergency contact number must be at least 10 characters").max(20)),
    emergencyContactRelationship: z.string({ message: "Emergency contact relationship is required" }).trim().min(2).max(50),
    confirmPassword: z.string().optional(),
    role: z.string().optional(),
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
