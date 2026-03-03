import { Tag } from 'antd';
import { CrownFilled } from '@ant-design/icons';
import { useRole } from '../hooks/useRole';

const SubscriptionBadge = () => {
    const { isPremium, isAdmin } = useRole();

    if (isAdmin) {
        return (
            <Tag color="red" style={{ borderRadius: '12px', fontWeight: 600 }}>
                ADMIN
            </Tag>
        );
    }

    if (isPremium) {
        return (
            <Tag
                icon={<CrownFilled />}
                color="gold"
                style={{ borderRadius: '12px', fontWeight: 600 }}
            >
                PREMIUM
            </Tag>
        );
    }

    return (
        <Tag color="default" style={{ borderRadius: '12px', fontWeight: 600 }}>
            FREE
        </Tag>
    );
};

export default SubscriptionBadge;
