export const callFilterableFields = [
    "type",
    "status",
    "appointmentId",
    "startDate",
    "endDate",
    "searchTerm",
];

export const callSearchableFields = [
    "endReason",
];

export const RINGING_TIMEOUT_MS = 45000; // 45 seconds timeout for missed calls

export const defaultCallInclude = {
    caller: {
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            patient: {
                select: {
                    id: true,
                    name: true,
                    profilePhoto: true,
                    contactNumber: true,
                },
            },
            doctor: {
                select: {
                    id: true,
                    name: true,
                    profilePhoto: true,
                    designation: true,
                    qualification: true,
                },
            },
        },
    },
    receiver: {
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            patient: {
                select: {
                    id: true,
                    name: true,
                    profilePhoto: true,
                    contactNumber: true,
                },
            },
            doctor: {
                select: {
                    id: true,
                    name: true,
                    profilePhoto: true,
                    designation: true,
                    qualification: true,
                },
            },
        },
    },
    appointment: {
        select: {
            id: true,
            status: true,
            paymentStatus: true,
            schedule: {
                select: {
                    startDateTime: true,
                    endDateTime: true,
                },
            },
        },
    },
};
