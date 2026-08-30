export const doctorApplicationSearchableFields = [
    "fullName",
    "email",
    "phone",
    "bmdcRegistrationNumber",
    "currentWorkplace",
    "designation",
    "qualifications",
];

export const doctorApplicationFilterableFields = [
    "status",
    "specialtyId",
    "searchTerm",
    "email",
    "phone",
    "bmdcRegistrationNumber",
];

export const doctorApplicationIncludeConfig = {
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
        },
    },
};
