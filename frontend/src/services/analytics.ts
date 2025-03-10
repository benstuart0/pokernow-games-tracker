import posthog from 'posthog-js'

// Initialize PostHog with write key
posthog.init('phc_G8A6QzlUE4dce3rSTgR0YTZQ5p6fpc6lodgFbDAhyM7', {
    api_host: 'https://app.posthog.com',
    persistence: 'localStorage',
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
    loaded: (posthog) => {
        console.log('PostHog loaded successfully');
        posthog.capture('app_loaded');
    }
})

// Enable debug mode in development
if (import.meta.env.DEV) {
    posthog.debug();
}

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

const logEvent = (eventName: string, properties: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
        console.log(`[PostHog Event] ${eventName}:`, properties);
    }
};

export const trackStartTracking = (data: TrackingData) => {
    const properties = {
        ...data,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
    };
    logEvent('start_tracking', properties);
    posthog.capture('start_tracking', properties);
}

export const trackStopTracking = (data: TrackingData & { 
    duration: number;  // in seconds
    finalProfit: number;
    hasErrors: boolean;
}) => {
    const properties = {
        ...data,
        timestamp: new Date().toISOString()
    };
    logEvent('stop_tracking', properties);
    posthog.capture('stop_tracking', properties);
}

export const trackError = (error: string, context: ErrorContext) => {
    const properties = {
        error,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href
    };
    logEvent('error', properties);
    posthog.capture('error', properties);
}

export const trackGameAdded = (gameUrl: string, isInCents: boolean) => {
    const properties = {
        gameUrl,
        isInCents,
        timestamp: new Date().toISOString()
    };
    logEvent('game_added', properties);
    posthog.capture('game_added', properties);
}

export const trackGameRemoved = (gameUrl: string) => {
    const properties = {
        gameUrl,
        timestamp: new Date().toISOString()
    };
    logEvent('game_removed', properties);
    posthog.capture('game_removed', properties);
}

export const trackCentsToggled = (gameUrl: string, isInCents: boolean) => {
    const properties = {
        gameUrl,
        isInCents,
        timestamp: new Date().toISOString()
    };
    logEvent('cents_toggled', properties);
    posthog.capture('cents_toggled', properties);
} 