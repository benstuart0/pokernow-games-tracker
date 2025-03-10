import posthog from 'posthog-js'

// Initialize PostHog
posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: 'https://app.posthog.com'
})

interface TrackingData {
    playerName: string;
    gamesCount: number;
    aliasesCount: number;
    gameUrls: string[];
    isInCents: boolean[];
}

interface ErrorContext {
    playerName?: string;
    games?: unknown[];
    aliases?: string[];
    url?: string;
    [key: string]: unknown;
}

export const trackStartTracking = (data: TrackingData) => {
    posthog.capture('start_tracking', {
        ...data,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
    })
}

export const trackStopTracking = (data: TrackingData & { 
    duration: number;  // in seconds
    finalProfit: number;
    hasErrors: boolean;
}) => {
    posthog.capture('stop_tracking', {
        ...data,
        timestamp: new Date().toISOString()
    })
}

export const trackError = (error: string, context: ErrorContext) => {
    posthog.capture('error', {
        error,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href
    })
}

export const trackGameAdded = (gameUrl: string, isInCents: boolean) => {
    posthog.capture('game_added', {
        gameUrl,
        isInCents,
        timestamp: new Date().toISOString()
    })
}

export const trackGameRemoved = (gameUrl: string) => {
    posthog.capture('game_removed', {
        gameUrl,
        timestamp: new Date().toISOString()
    })
}

export const trackCentsToggled = (gameUrl: string, isInCents: boolean) => {
    posthog.capture('cents_toggled', {
        gameUrl,
        isInCents,
        timestamp: new Date().toISOString()
    })
} 