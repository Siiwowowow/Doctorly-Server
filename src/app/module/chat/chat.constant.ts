export const messageSearchableFields = [
    "content",
];

export const messageFilterableFields = [
    "messageType",
    "status",
    "senderId",
    "createdAt",
];

export const defaultMessageInclude = {
    sender: {
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
        },
    },
    attachments: true,
};

export const defaultConversationInclude = {
    patient: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            contactNumber: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    status: true,
                },
            },
        },
    },
    doctor: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            designation: true,
            qualification: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    status: true,
                },
            },
        },
    },
    participants: {
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                },
            },
        },
    },
};
