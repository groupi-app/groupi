import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function NotificationEmailTemplate({ notification, }) {
    const { event, post, type, datetime, author, rsvp } = notification;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // Use hosted logo URL for email compatibility
    const logoUrl = `${baseUrl}/groupi.svg`;
    // Helper to get a dynamic heading based on notification type
    const getEmailHeading = () => {
        switch (type) {
            case 'EVENT_EDITED':
            case 'DATE_CHANGED':
            case 'DATE_CHOSEN':
            case 'DATE_RESET':
                return 'Event Updated!';
            case 'NEW_POST':
                return 'New Post!';
            case 'NEW_REPLY':
                return 'New Reply!';
            case 'USER_JOINED':
            case 'USER_LEFT':
            case 'USER_PROMOTED':
            case 'USER_DEMOTED':
                return 'Membership Updated!';
            case 'USER_RSVP':
                return 'New RSVP!';
            default:
                return 'Groupi';
        }
    };
    // Helper to get the link for the notification
    const getNotificationLink = () => {
        switch (type) {
            case 'EVENT_EDITED':
            case 'DATE_CHANGED':
            case 'DATE_CHOSEN':
            case 'DATE_RESET':
            case 'USER_JOINED':
            case 'USER_LEFT':
            case 'USER_PROMOTED':
            case 'USER_DEMOTED':
            case 'USER_RSVP':
                return `${baseUrl}/event/${event === null || event === void 0 ? void 0 : event.id}`;
            case 'NEW_POST':
            case 'NEW_REPLY':
                return `${baseUrl}/post/${post === null || post === void 0 ? void 0 : post.id}`;
            default:
                return `${baseUrl}/event/${event === null || event === void 0 ? void 0 : event.id}`;
        }
    };
    // Helper to get the message for the notification
    const getNotificationMessage = () => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        switch (type) {
            case 'EVENT_EDITED':
                return (_jsxs("div", { children: ["The details of ", _jsx("strong", { children: event === null || event === void 0 ? void 0 : event.title }), " have been updated."] }));
            case 'DATE_CHANGED':
                return (_jsxs("div", { children: ["The date of ", _jsx("strong", { children: event === null || event === void 0 ? void 0 : event.title }), " has changed to", ' ', _jsx("strong", { children: datetime
                                ? new Date(datetime).toLocaleString(undefined, {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                })
                                : '' }), "."] }));
            case 'DATE_CHOSEN':
                return (_jsxs("div", { children: [_jsx("strong", { children: event === null || event === void 0 ? void 0 : event.title }), " will be held on", ' ', _jsx("strong", { children: datetime
                                ? new Date(datetime).toLocaleString(undefined, {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                })
                                : '' }), "."] }));
            case 'DATE_RESET':
                return (_jsxs("div", { children: ["A new poll has started for the date of", ' ', _jsx("strong", { children: event === null || event === void 0 ? void 0 : event.title }), "."] }));
            case 'NEW_POST':
                return (_jsxs("div", { children: [_jsx("strong", { children: (_b = (_a = author === null || author === void 0 ? void 0 : author.firstName) !== null && _a !== void 0 ? _a : author === null || author === void 0 ? void 0 : author.lastName) !== null && _b !== void 0 ? _b : author === null || author === void 0 ? void 0 : author.username }), ' ', "created a new post, ", _jsx("strong", { children: post === null || post === void 0 ? void 0 : post.title }), ", in", ' ', _jsx("strong", { children: event === null || event === void 0 ? void 0 : event.title }), "."] }));
            case 'NEW_REPLY':
                return (_jsxs("div", { children: [_jsx("strong", { children: (_d = (_c = author === null || author === void 0 ? void 0 : author.firstName) !== null && _c !== void 0 ? _c : author === null || author === void 0 ? void 0 : author.lastName) !== null && _d !== void 0 ? _d : author === null || author === void 0 ? void 0 : author.username }), ' ', "replied to a post, ", _jsx("strong", { children: post === null || post === void 0 ? void 0 : post.title }), ", in", ' ', _jsx("strong", { children: event === null || event === void 0 ? void 0 : event.title }), "."] }));
            case 'USER_JOINED':
                return (_jsxs("div", { children: [_jsx("strong", { children: (_f = (_e = author === null || author === void 0 ? void 0 : author.firstName) !== null && _e !== void 0 ? _e : author === null || author === void 0 ? void 0 : author.lastName) !== null && _f !== void 0 ? _f : author === null || author === void 0 ? void 0 : author.username }), ' ', "has joined ", _jsx("strong", { children: event === null || event === void 0 ? void 0 : event.title }), "."] }));
            case 'USER_LEFT':
                return (_jsxs("div", { children: [_jsx("strong", { children: (_h = (_g = author === null || author === void 0 ? void 0 : author.firstName) !== null && _g !== void 0 ? _g : author === null || author === void 0 ? void 0 : author.lastName) !== null && _h !== void 0 ? _h : author === null || author === void 0 ? void 0 : author.username }), ' ', "has left ", _jsx("strong", { children: event === null || event === void 0 ? void 0 : event.title }), "."] }));
            case 'USER_PROMOTED':
                return (_jsxs("div", { children: ["You are now a Moderator of ", _jsx("strong", { children: event === null || event === void 0 ? void 0 : event.title }), "."] }));
            case 'USER_DEMOTED':
                return (_jsxs("div", { children: ["You are no longer a Moderator of ", _jsx("strong", { children: event === null || event === void 0 ? void 0 : event.title }), "."] }));
            case 'USER_RSVP':
                return (_jsxs("div", { children: [_jsx("strong", { children: (_k = (_j = author === null || author === void 0 ? void 0 : author.firstName) !== null && _j !== void 0 ? _j : author === null || author === void 0 ? void 0 : author.lastName) !== null && _k !== void 0 ? _k : author === null || author === void 0 ? void 0 : author.username }), ' ', "has RSVP'd ", _jsx("strong", { children: rsvp }), " to", ' ', _jsx("strong", { children: event === null || event === void 0 ? void 0 : event.title }), "."] }));
            default:
                return null;
        }
    };
    return (_jsxs("div", { style: {
            fontFamily: 'sans-serif',
            color: '#222',
            background: '#fff',
            padding: 24,
            borderRadius: 8,
            maxWidth: 600,
            margin: '0 auto',
        }, children: [_jsx("img", { src: logoUrl, alt: 'Groupi Logo', style: { maxWidth: '200px', height: 'auto' } }), _jsx("h2", { style: {
                    color: '#1a202c',
                    fontSize: '24px',
                    marginBottom: 16,
                }, children: getEmailHeading() }), _jsx("p", { children: getNotificationMessage() }), _jsx("a", { href: getNotificationLink(), style: {
                    display: 'block',
                    marginTop: 24,
                    padding: '12px 24px',
                    background: '#007bff',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: 4,
                    textAlign: 'center',
                }, children: "View Notification" })] }));
}
