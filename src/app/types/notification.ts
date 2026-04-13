import { Parameter } from './parameter';

export interface NotificationUser {
    id: string;
    name: string;
    lastName: string;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    route: string;
    createdAt: string;
    type: Parameter;
    createdByUser: NotificationUser;
    read: boolean;
}

export interface NotificationRead {
    id: string;
    notificationId: string;
    userId: string;
    readAt: string;
}

export interface NotificationResponse {
    data: AppNotification[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
