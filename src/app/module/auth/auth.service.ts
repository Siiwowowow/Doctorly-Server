import status from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { BloodGroup, Gender, UserStatus } from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { logger } from "../../utils/logger";
import { tokenUtils } from "../../utils/token";
import { IChangePasswordPayload, ILoginUserPayload, IRegisterPatientPayload } from "./auth.interface";
import { jwtUtils } from "../../utils/jwt";



const registerPatient = async (payload: IRegisterPatientPayload) => {
    const { name, email, password } = payload;
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
    });

    if (existingUser) {
        if (existingUser.emailVerified) {
            throw new AppError(status.CONFLICT, "This email is already registered and verified. Please log in.");
        }

        // If the user already registered but hasn't verified their email, resend OTP
        await auth.api.sendVerificationOTP({
            body: {
                email: existingUser.email,
                type: "email-verification",
            },
        });

        logger.info(`Resent verification OTP for existing unverified user: ${existingUser.email}`);

        let patient = await prisma.patient.findFirst({
            where: { userId: existingUser.id },
        });

        if (!patient) {
            patient = await prisma.patient.create({
                data: {
                    userId: existingUser.id,
                    name: payload.name,
                    email: existingUser.email,
                    contactNumber: payload.contactNumber,
                    address: payload.address,
                    emergencyContactName: payload.emergencyContactName,
                    emergencyContactNumber: payload.emergencyContactNumber,
                    emergencyContactRelationship: payload.emergencyContactRelationship,
                    patientHealthData: {
                        create: {
                            dateOfBirth: new Date(`${payload.dateOfBirth}T00:00:00.000Z`),
                            gender: payload.gender as Gender,
                            bloodGroup: payload.bloodGroup as BloodGroup,
                            height: "",
                            weight: "",
                        },
                    },
                },
            });
        } else {
            patient = await prisma.patient.update({
                where: { id: patient.id },
                data: {
                    name: payload.name,
                    contactNumber: payload.contactNumber,
                    address: payload.address,
                    emergencyContactName: payload.emergencyContactName,
                    emergencyContactNumber: payload.emergencyContactNumber,
                    emergencyContactRelationship: payload.emergencyContactRelationship,
                    patientHealthData: {
                        upsert: {
                            create: {
                                dateOfBirth: new Date(`${payload.dateOfBirth}T00:00:00.000Z`),
                                gender: payload.gender as Gender,
                                bloodGroup: payload.bloodGroup as BloodGroup,
                                height: "",
                                weight: "",
                            },
                            update: {
                                dateOfBirth: new Date(`${payload.dateOfBirth}T00:00:00.000Z`),
                                gender: payload.gender as Gender,
                                bloodGroup: payload.bloodGroup as BloodGroup,
                            },
                        },
                    },
                },
            });
        }

        const accessToken = tokenUtils.getAccessToken({
            userId: existingUser.id,
            role: existingUser.role,
            name: existingUser.name,
            email: existingUser.email,
            status: existingUser.status,
            isDeleted: existingUser.isDeleted,
            emailVerified: false,
        });

        const refreshToken = tokenUtils.getRefreshToken({
            userId: existingUser.id,
            role: existingUser.role,
            name: existingUser.name,
            email: existingUser.email,
            status: existingUser.status,
            isDeleted: existingUser.isDeleted,
            emailVerified: false,
        });

        return {
            user: existingUser,
            patient,
            accessToken,
            refreshToken,
        };
    }

    const data = await auth.api.signUpEmail({
        body: {
            name,
            email: cleanEmail,
            password,
        }
    });

    if (!data.user) {
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
                    contactNumber: payload.contactNumber,
                    address: payload.address,
                    emergencyContactName: payload.emergencyContactName,
                    emergencyContactNumber: payload.emergencyContactNumber,
                    emergencyContactRelationship: payload.emergencyContactRelationship,
                    patientHealthData: {
                        create: {
                            dateOfBirth: new Date(`${payload.dateOfBirth}T00:00:00.000Z`),
                            gender: payload.gender as Gender,
                            bloodGroup: payload.bloodGroup as BloodGroup,
                            height: "",
                            weight: "",
                        },
                    },
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
        logger.error("Transaction error in registerPatient:", error);
        await prisma.user.delete({
            where: {
                id: data.user.id
            }
        }).catch(() => {})
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

const getMe = async (user: IRequestUser) => {
    const isUserExists = await prisma.user.findUnique({
        where: {
            id: user.userId,
        },
        include: {
            patient: {
                include: {
                    patientHealthData: true,
                },
            },
            doctor: {
                include: {
                    specialties: {
                        where: {
                            specialty: {
                                isDeleted: false,
                            },
                        },
                        include: {
                            specialty: true,
                        },
                    },
                },
            },
            admin: true,
        },
    });

    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    return isUserExists;
};

const getNewToken = async (refreshToken: string, sessionToken: string) => {
    if (!sessionToken) {
        throw new AppError(status.UNAUTHORIZED, "Session token is missing");
    }

    if (!refreshToken) {
        throw new AppError(status.UNAUTHORIZED, "Refresh token is missing");
    }

    const session = await prisma.session.findFirst({
        where: {
            token: sessionToken,
            expiresAt: {
                gt: new Date(),
            },
        },
        include: {
            user: true,
        },
    });

    if (!session || !session.user) {
        throw new AppError(status.UNAUTHORIZED, "Invalid or expired session token");
    }

    const user = session.user;

    if (user.status === UserStatus.BLOCKED) {
        throw new AppError(status.FORBIDDEN, "Unauthorized access! Your account is blocked.");
    }

    if (user.isDeleted || user.status === UserStatus.DELETED) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access! Your account has been deleted.");
    }

    const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET);

    if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
        throw new AppError(status.UNAUTHORIZED, "Invalid or expired refresh token");
    }

    const tokenData = verifiedRefreshToken.data as JwtPayload;

    if (tokenData.userId !== user.id) {
        throw new AppError(status.UNAUTHORIZED, "Session and refresh token identity mismatch");
    }

    const newAccessToken = tokenUtils.getAccessToken({
        userId: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        status: user.status,
        isDeleted: user.isDeleted,
        emailVerified: user.emailVerified,
    });

    const newRefreshToken = tokenUtils.getRefreshToken({
        userId: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        status: user.status,
        isDeleted: user.isDeleted,
        emailVerified: user.emailVerified,
    });

    const updatedSession = await prisma.session.update({
        where: {
            token: sessionToken,
        },
        data: {
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day extension
            updatedAt: new Date(),
        },
    });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        sessionToken: updatedSession.token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
        },
    };
};


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

const resendVerificationOtp = async (email: string) => {
    const isUserExist = await prisma.user.findUnique({
        where: { email },
    });

    if (!isUserExist) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    if (isUserExist.emailVerified) {
        throw new AppError(status.BAD_REQUEST, "Email is already verified");
    }

    if (isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    await auth.api.sendVerificationOTP({
        body: {
            email,
            type: "email-verification",
        },
    });
};

export const AuthService = {
    registerPatient,
    loginUser,
    getMe,
    getNewToken,
    changePassword,
    logoutUser,
    verifyEmail,
    resendVerificationOtp,
    forgetPassword,
    resetPassword,
};
