export interface ILoginUserPayload {
    email: string;
    password: string;
}

export interface IRegisterPatientPayload {
    name: string;
    email: string;
    password: string;
    contactNumber: string;
    address: string;
    dateOfBirth: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    bloodGroup: string;
    emergencyContactName: string;
    emergencyContactNumber: string;
    emergencyContactRelationship: string;
}

export interface IChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}
