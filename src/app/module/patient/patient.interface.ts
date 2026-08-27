import { BloodGroup, Gender } from "../../../generated/prisma/enums";

export interface IUpdatePatientHealthDataPayload {
    gender?: Gender;
    dateOfBirth?: string;
    bloodGroup?: BloodGroup;
    hasAllergies?: boolean;
    hasDiabetes?: boolean;
    height?: string;
    weight?: string;
    smokingStatus?: boolean;
    dietaryPreferences?: string;
    pregnancyStatus?: boolean;
    mentalHealthHistory?: string;
    immunizationStatus?: string;
    hasPastSurgeries?: boolean;
    recentAnxiety?: boolean;
    recentDepression?: boolean;
    maritalStatus?: string;
}

export interface IUpdatePatientPayload {
    name?: string;
    profilePhoto?: string;
    contactNumber?: string;
    address?: string;
    patientHealthData?: IUpdatePatientHealthDataPayload;
}
