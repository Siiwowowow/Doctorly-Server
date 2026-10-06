export interface ICreateServicePayload {
    title: string;
    slug: string;
    description: string;
    icon?: string;
    isActive?: boolean;
    sortOrder?: number;
}

export type IUpdateServicePayload = Partial<ICreateServicePayload>;
