/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import {
    DoctorApplication,
    DoctorApplicationStatus,
    DocumentVerificationStatus,
    Gender,
    NotificationType,
    Prisma,
    Role,
    UserStatus,
} from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { NotificationService } from "../notification/notification.service";
import {
    doctorApplicationFilterableFields,
    doctorApplicationIncludeConfig,
    doctorApplicationSearchableFields,
} from "./doctorApplication.constant";

const initializeApplication = async (
    payload: Record<string, any>,
    files?: { [fieldname: string]: Express.Multer.File[] }
) => {
    // 1. Check if user already exists
    const userExists = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (userExists) {
        throw new AppError(status.CONFLICT, "User with this email already exists");
    }

    // 2. Register user via Better Auth
    const userData = await auth.api.signUpEmail({
        body: {
            email: payload.email,
            password: payload.password,
            role: Role.DOCTOR,
            name: payload.fullName,
            needPasswordChange: false,
        },
    });

    if (!userData || !userData.user) {
        throw new AppError(status.BAD_REQUEST, "Failed to create user account");
    }

    try {
        // Block the user until application is approved
        await prisma.user.update({
            where: { id: userData.user.id },
            data: { status: UserStatus.BLOCKED },
        });

        // Create submitted application with full credentials
        const application = await prisma.doctorApplication.create({
            data: {
                userId: userData.user.id,
                fullName: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                address: payload.address || null,
                city: payload.city || null,
                country: payload.country || null,
                bmdcRegistrationNumber: payload.bmdcRegistrationNumber || null,
                registrationType: payload.registrationType || null,
                qualifications: payload.qualifications || null,
                experienceYears: payload.experienceYears !== undefined && payload.experienceYears !== null ? Number(payload.experienceYears) : null,
                currentWorkplace: payload.currentWorkplace || null,
                designation: payload.designation || null,
                consultationFee: payload.consultationFee !== undefined && payload.consultationFee !== null ? Number(payload.consultationFee) : null,
                about: payload.about || null,
                specialtyId: payload.specialtyId || null,
                status: DoctorApplicationStatus.SUBMITTED,
            },
        });

        // Insert documents if files were uploaded
        if (files) {
            const documentEntries: Prisma.DoctorApplicationDocumentCreateManyInput[] = [];

            if (files.bmdc && files.bmdc[0]) {
                documentEntries.push({
                    applicationId: application.id,
                    documentType: "BMDC_CERTIFICATE",
                    documentName: files.bmdc[0].originalname || "BMDC Registration Certificate",
                    fileUrl: files.bmdc[0].path,
                    verificationStatus: DocumentVerificationStatus.PENDING,
                });
            }

            if (files.degree && files.degree[0]) {
                documentEntries.push({
                    applicationId: application.id,
                    documentType: "MEDICAL_DEGREE",
                    documentName: files.degree[0].originalname || "Medical Degree Certificate",
                    fileUrl: files.degree[0].path,
                    verificationStatus: DocumentVerificationStatus.PENDING,
                });
            }

            if (files.photo && files.photo[0]) {
                documentEntries.push({
                    applicationId: application.id,
                    documentType: "GOVERNMENT_ID",
                    documentName: files.photo[0].originalname || "Government ID / Passport",
                    fileUrl: files.photo[0].path,
                    verificationStatus: DocumentVerificationStatus.PENDING,
                });
            }

            if (documentEntries.length > 0) {
                await prisma.doctorApplicationDocument.createMany({
                    data: documentEntries,
                });
            }
        }

        return application;
    } catch (error) {
        // Rollback user creation on failure
        await prisma.user
            .delete({
                where: { id: userData.user.id },
            })
            .catch(() => {});
        throw error;
    }
};

const getMyApplication = async (user: IRequestUser) => {
    const application = await prisma.doctorApplication.findUnique({
        where: { userId: user.userId },
        include: { documents: true, specialty: true },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "Application not found");
    }

    return application;
};

const updateMyApplication = async (user: IRequestUser, payload: Record<string, any>) => {
    const application = await prisma.doctorApplication.findUnique({
        where: { userId: user.userId },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "Application not found");
    }

    if (
        application.status === DoctorApplicationStatus.APPROVED ||
        application.status === DoctorApplicationStatus.UNDER_REVIEW
    ) {
        throw new AppError(status.BAD_REQUEST, "Cannot update application in current status");
    }

    const updated = await prisma.doctorApplication.update({
        where: { id: application.id },
        data: payload,
    });

    return updated;
};

const submitMyApplication = async (user: IRequestUser) => {
    const application = await prisma.doctorApplication.findUnique({
        where: { userId: user.userId },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "Application not found");
    }

    if (
        application.status !== DoctorApplicationStatus.DRAFT &&
        application.status !== DoctorApplicationStatus.RESUBMISSION_REQUIRED
    ) {
        throw new AppError(status.BAD_REQUEST, "Application is not in a submittable state");
    }

    const updated = await prisma.doctorApplication.update({
        where: { id: application.id },
        data: { status: DoctorApplicationStatus.SUBMITTED },
    });

    return updated;
};

const uploadDocument = async (user: IRequestUser, file: Express.Multer.File | undefined, documentType: string) => {
    const application = await prisma.doctorApplication.findUnique({
        where: { userId: user.userId },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "Application not found");
    }

    if (
        application.status === DoctorApplicationStatus.APPROVED ||
        application.status === DoctorApplicationStatus.UNDER_REVIEW
    ) {
        throw new AppError(status.BAD_REQUEST, "Cannot upload documents in current status");
    }

    if (!file || !file.path) {
        throw new AppError(status.BAD_REQUEST, "File is required");
    }

    const document = await prisma.doctorApplicationDocument.create({
        data: {
            applicationId: application.id,
            documentType,
            documentName: file.originalname || "Document",
            fileUrl: file.path,
        },
    });

    return document;
};

const deleteDocument = async (user: IRequestUser, documentId: string) => {
    const application = await prisma.doctorApplication.findUnique({
        where: { userId: user.userId },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "Application not found");
    }

    const document = await prisma.doctorApplicationDocument.findFirst({
        where: {
            id: documentId,
            applicationId: application.id,
        },
    });

    if (!document) {
        throw new AppError(status.NOT_FOUND, "Document not found");
    }

    await prisma.doctorApplicationDocument.delete({
        where: { id: documentId },
    });

    return { message: "Document deleted successfully" };
};

const trackApplication = async (identifier: string) => {
    const application = await prisma.doctorApplication.findFirst({
        where: {
            OR: [
                { id: identifier },
                { email: identifier },
            ],
        },
        include: {
            specialty: true,
            documents: {
                select: {
                    id: true,
                    documentType: true,
                    verificationStatus: true,
                    adminNote: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "No doctor application found with this ID or Email");
    }

    return application;
};

// ==========================================
// ADMIN WORKFLOWS & CONTROLS
// ==========================================

const getAllApplications = async (query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<
        DoctorApplication,
        Prisma.DoctorApplicationWhereInput,
        Prisma.DoctorApplicationInclude
    >(prisma.doctorApplication, query, {
        searchableFields: doctorApplicationSearchableFields,
        filterableFields: doctorApplicationFilterableFields,
    });

    const result = await queryBuilder
        .search()
        .filter()
        .dynamicInclude(doctorApplicationIncludeConfig)
        .paginate()
        .sort()
        .fields()
        .execute();

    return result;
};

const getApplicationById = async (id: string) => {
    const application = await prisma.doctorApplication.findUnique({
        where: { id },
        include: {
            documents: true,
            specialty: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "Doctor application not found");
    }

    return application;
};

const updateApplicationStatus = async (id: string, newStatus: DoctorApplicationStatus) => {
    const application = await prisma.doctorApplication.findUnique({
        where: { id },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "Doctor application not found");
    }

    const updated = await prisma.doctorApplication.update({
        where: { id },
        data: { status: newStatus },
        include: {
            documents: true,
            specialty: true,
        },
    });

    return updated;
};

const verifyDocument = async (
    applicationId: string,
    documentId: string,
    payload: {
        verificationStatus: DocumentVerificationStatus;
        adminNote?: string;
    }
) => {
    const document = await prisma.doctorApplicationDocument.findFirst({
        where: {
            id: documentId,
            applicationId,
        },
    });

    if (!document) {
        throw new AppError(status.NOT_FOUND, "Document not found in this application");
    }

    const updatedDocument = await prisma.doctorApplicationDocument.update({
        where: { id: documentId },
        data: {
            verificationStatus: payload.verificationStatus,
            adminNote: payload.adminNote !== undefined ? payload.adminNote : document.adminNote,
        },
    });

    return updatedDocument;
};

const approveApplication = async (applicationId: string, reviewer: IRequestUser) => {
    const application = await prisma.doctorApplication.findUnique({
        where: { id: applicationId },
        include: {
            documents: true,
            specialty: true,
            user: true,
        },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "Doctor application not found");
    }

    if (application.status === DoctorApplicationStatus.APPROVED) {
        throw new AppError(status.BAD_REQUEST, "Application is already approved");
    }

    // Validation: Check BMDC registration number
    if (!application.bmdcRegistrationNumber) {
        throw new AppError(
            status.BAD_REQUEST,
            "Cannot approve application without a valid BMDC registration number"
        );
    }

    // Check profile photo document if available
    const profilePhotoDoc = application.documents.find(
        (d) => d.documentType === "PROFILE_PHOTO" || d.documentType === "PHOTO"
    );
    const profilePhotoUrl = profilePhotoDoc?.fileUrl || application.user?.image || null;

    const fullAddress = [application.address, application.city, application.country]
        .filter(Boolean)
        .join(", ");

    const result = await prisma.$transaction(async (tx) => {
        // 1. Mark application as APPROVED and clear rejection reason
        const approvedApp = await tx.doctorApplication.update({
            where: { id: applicationId },
            data: {
                status: DoctorApplicationStatus.APPROVED,
                rejectionReason: null,
            },
        });

        // 2. Mark all documents as VERIFIED
        await tx.doctorApplicationDocument.updateMany({
            where: { applicationId },
            data: {
                verificationStatus: DocumentVerificationStatus.VERIFIED,
            },
        });

        // 3. Update User: set status to ACTIVE, role to DOCTOR, emailVerified to true
        await tx.user.update({
            where: { id: application.userId },
            data: {
                status: UserStatus.ACTIVE,
                role: Role.DOCTOR,
                emailVerified: true,
                name: application.fullName,
                ...(profilePhotoUrl ? { image: profilePhotoUrl } : {}),
            },
        });

        // 4. Upsert Doctor Profile
        const existingDoctor = await tx.doctor.findUnique({
            where: { userId: application.userId },
        });

        let doctorRecord;
        if (existingDoctor) {
            doctorRecord = await tx.doctor.update({
                where: { id: existingDoctor.id },
                data: {
                    name: application.fullName,
                    email: application.email,
                    contactNumber: application.phone,
                    address: fullAddress || existingDoctor.address,
                    registrationNumber: application.bmdcRegistrationNumber!,
                    experience: application.experienceYears || existingDoctor.experience,
                    appointmentFee: application.consultationFee || existingDoctor.appointmentFee,
                    qualification: application.qualifications || existingDoctor.qualification,
                    currentWorkingPlace: application.currentWorkplace || existingDoctor.currentWorkingPlace,
                    designation: application.designation || existingDoctor.designation,
                    profilePhoto: profilePhotoUrl || existingDoctor.profilePhoto,
                    isDeleted: false,
                },
            });
        } else {
            doctorRecord = await tx.doctor.create({
                data: {
                    userId: application.userId,
                    name: application.fullName,
                    email: application.email,
                    contactNumber: application.phone,
                    address: fullAddress || null,
                    registrationNumber: application.bmdcRegistrationNumber!,
                    experience: application.experienceYears || 0,
                    gender: Gender.MALE,
                    appointmentFee: application.consultationFee || 0,
                    qualification: application.qualifications || "MBBS",
                    currentWorkingPlace: application.currentWorkplace || "Healthcare Center",
                    designation: application.designation || "Medical Officer",
                    profilePhoto: profilePhotoUrl,
                },
            });
        }

        // 5. Connect specialty if provided
        if (application.specialtyId) {
            const specialtyExists = await tx.specialty.findUnique({
                where: { id: application.specialtyId },
            });

            if (specialtyExists) {
                const existingLink = await tx.doctorSpecialty.findUnique({
                    where: {
                        doctorId_specialtyId: {
                            doctorId: doctorRecord.id,
                            specialtyId: application.specialtyId,
                        },
                    },
                });

                if (!existingLink) {
                    await tx.doctorSpecialty.create({
                        data: {
                            doctorId: doctorRecord.id,
                            specialtyId: application.specialtyId,
                        },
                    });
                }
            }
        }

        // 6. Asynchronously create notification for doctor
        await NotificationService.createNotification(
            {
                recipientId: application.userId,
                type: NotificationType.SYSTEM_NOTIFICATION,
                title: "Doctor Application Approved",
                message: `Congratulations Dr. ${application.fullName}! Your doctor application has been approved. You now have full access to your Doctor Dashboard and can begin offering consultations.`,
                data: {
                    applicationId: application.id,
                    doctorId: doctorRecord.id,
                    status: DoctorApplicationStatus.APPROVED,
                    reviewedBy: reviewer.userId,
                },
            },
            tx
        );

        return {
            application: approvedApp,
            doctor: doctorRecord,
        };
    });

    return result;
};

const rejectApplication = async (
    applicationId: string,
    payload: { rejectionReason: string },
    reviewer: IRequestUser
) => {
    const application = await prisma.doctorApplication.findUnique({
        where: { id: applicationId },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "Doctor application not found");
    }

    if (application.status === DoctorApplicationStatus.APPROVED) {
        throw new AppError(status.BAD_REQUEST, "Cannot reject an already approved application");
    }

    const updated = await prisma.$transaction(async (tx) => {
        const app = await tx.doctorApplication.update({
            where: { id: applicationId },
            data: {
                status: DoctorApplicationStatus.REJECTED,
                rejectionReason: payload.rejectionReason,
            },
        });

        await NotificationService.createNotification(
            {
                recipientId: application.userId,
                type: NotificationType.SYSTEM_NOTIFICATION,
                title: "Doctor Application Rejected",
                message: `Your doctor application was not approved. Reason: ${payload.rejectionReason}`,
                data: {
                    applicationId: application.id,
                    status: DoctorApplicationStatus.REJECTED,
                    reason: payload.rejectionReason,
                    reviewedBy: reviewer.userId,
                },
            },
            tx
        );

        return app;
    });

    return updated;
};

const requestResubmission = async (
    applicationId: string,
    payload: { rejectionReason: string },
    reviewer: IRequestUser
) => {
    const application = await prisma.doctorApplication.findUnique({
        where: { id: applicationId },
    });

    if (!application) {
        throw new AppError(status.NOT_FOUND, "Doctor application not found");
    }

    if (application.status === DoctorApplicationStatus.APPROVED) {
        throw new AppError(
            status.BAD_REQUEST,
            "Cannot request resubmission for an already approved application"
        );
    }

    const updated = await prisma.$transaction(async (tx) => {
        const app = await tx.doctorApplication.update({
            where: { id: applicationId },
            data: {
                status: DoctorApplicationStatus.RESUBMISSION_REQUIRED,
                rejectionReason: payload.rejectionReason,
            },
        });

        await NotificationService.createNotification(
            {
                recipientId: application.userId,
                type: NotificationType.SYSTEM_NOTIFICATION,
                title: "Doctor Application: Resubmission Required",
                message: `Action is required on your doctor application. Instructions: ${payload.rejectionReason}`,
                data: {
                    applicationId: application.id,
                    status: DoctorApplicationStatus.RESUBMISSION_REQUIRED,
                    instructions: payload.rejectionReason,
                    reviewedBy: reviewer.userId,
                },
            },
            tx
        );

        return app;
    });

    return updated;
};

export const DoctorApplicationService = {
    initializeApplication,
    getMyApplication,
    updateMyApplication,
    submitMyApplication,
    uploadDocument,
    deleteDocument,
    trackApplication,
    // Admin features
    getAllApplications,
    getApplicationById,
    updateApplicationStatus,
    verifyDocument,
    approveApplication,
    rejectApplication,
    requestResubmission,
};
