import { Tooltip } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import './OnlineStatusBadge.css';

export const UserStatusEnum = {
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE',
    AWAY: 'AWAY',
} as const;

export type UserStatusEnum = typeof UserStatusEnum[keyof typeof UserStatusEnum];

interface OnlineStatusBadgeProps {
    status: UserStatusEnum;
    lastSeen?: Date;
    size?: 'small' | 'default' | 'large';
    showTooltip?: boolean;
}

export const OnlineStatusBadge: React.FC<OnlineStatusBadgeProps> = ({
    status,
    lastSeen,
    size = 'default',
    showTooltip = true,
}) => {
    const getStatusColor = (): string => {
        switch (status) {
            case UserStatusEnum.ONLINE:
                return '#52c41a'; // Green
            case UserStatusEnum.AWAY:
                return '#faad14'; // Yellow/Orange
            case UserStatusEnum.OFFLINE:
            default:
                return '#d9d9d9'; // Gray
        }
    };

    const getTooltipText = (): string => {
        switch (status) {
            case UserStatusEnum.ONLINE:
                return 'Online';
            case UserStatusEnum.AWAY:
                return 'Away';
            case UserStatusEnum.OFFLINE:
                if (lastSeen) {
                    return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`;
                }
                return 'Offline';
            default:
                return 'Unknown';
        }
    };

    const getBadgeSize = (): number => {
        switch (size) {
            case 'small':
                return 8;
            case 'large':
                return 12;
            case 'default':
            default:
                return 10;
        }
    };

    const badgeStyle: React.CSSProperties = {
        backgroundColor: getStatusColor(),
        width: getBadgeSize(),
        height: getBadgeSize(),
        borderRadius: '50%',
        border: '2px solid white',
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
        animation: status === UserStatusEnum.ONLINE ? 'online-status-pulse 2s infinite' : 'none',
    };

    const badge = (
        <span style={badgeStyle} className="online-status-badge" />
    );

    if (showTooltip) {
        return <Tooltip title={getTooltipText()}>{badge}</Tooltip>;
    }

    return badge;
};
