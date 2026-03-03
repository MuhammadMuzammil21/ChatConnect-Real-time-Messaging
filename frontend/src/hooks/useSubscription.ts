import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments';
import { message } from 'antd';

export const useSubscription = () => {
    const [isLoading, setIsLoading] = useState(false);

    const { data: subscriptionData, refetch } = useQuery({
        queryKey: ['subscription'],
        queryFn: paymentsApi.getSubscriptionStatus,
        staleTime: 30000,
    });

    const startCheckout = useCallback(async () => {
        setIsLoading(true);
        try {
            const { url } = await paymentsApi.createCheckoutSession();
            window.location.href = url;
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Failed to start checkout';
            message.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const openBillingPortal = useCallback(async () => {
        setIsLoading(true);
        try {
            const { url } = await paymentsApi.createBillingPortalSession();
            window.location.href = url;
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Failed to open billing portal';
            message.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        subscription: subscriptionData?.subscription || null,
        role: subscriptionData?.role || 'FREE',
        subscriptionStatus: subscriptionData?.subscriptionStatus || 'INACTIVE',
        isLoading,
        startCheckout,
        openBillingPortal,
        refetch,
    };
};
