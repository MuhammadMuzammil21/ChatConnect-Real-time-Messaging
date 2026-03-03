import axiosInstance from '../lib/axios';

export interface SubscriptionData {
    id: string;
    stripeSubscriptionId: string;
    status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'INCOMPLETE';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    createdAt: string;
}

export interface SubscriptionStatusResponse {
    subscription: SubscriptionData | null;
    role: string;
    subscriptionStatus: string;
}

export const paymentsApi = {
    createCheckoutSession: async (priceId?: string): Promise<{ url: string }> => {
        const response = await axiosInstance.post<{ url: string }>('/payments/checkout', {
            priceId,
        });
        return response.data;
    },

    createBillingPortalSession: async (): Promise<{ url: string }> => {
        const response = await axiosInstance.post<{ url: string }>('/payments/billing-portal');
        return response.data;
    },

    getSubscriptionStatus: async (): Promise<SubscriptionStatusResponse> => {
        const response = await axiosInstance.get<SubscriptionStatusResponse>('/payments/subscription');
        return response.data;
    },
};
