import posthog from 'posthog-js'

// Initialize PostHog with write key
posthog.init('phc_G8A6QzlUE4dce3rSTgR0YTZQ5p6fpc6lodgFbDAhyM7', {
    api_host: 'https://app.posthog.com',
    // Enable automatic event capturing
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage',
    bootstrap: {
        distinctID: 'user_' + Math.random().toString(36).substr(2, 9),
    },
    // Capture performance metrics
    enable_recording_console_log: true,
    // Session recording configuration
    disable_session_recording: false,
    session_recording: {
        maskAllInputs: false,
        maskTextSelector: '.mask-text'
    },
    // Advanced configuration
    property_blacklist: ['$current_url', '$pathname'],
    mask_all_text: false,
    mask_all_element_attributes: false,
    // Debug mode in development
    loaded: (ph) => {
        if (import.meta.env.DEV) {
            ph.debug();
            console.log('PostHog loaded in debug mode');
        }
        // Identify the environment
        ph.register({
            environment: import.meta.env.MODE,
            app_version: import.meta.env.VITE_APP_VERSION || '1.0.0'
        });
        // Initial pageview
        ph.capture('$pageview');
    }
})

// Set up super properties that will be sent with every event
posthog.register({
    app_name: 'PokerNow Games Tracker',
    platform: 'web',
    screen_size: `${window.innerWidth}x${window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
})

// Track route changes if using a router
window.addEventListener('popstate', () => {
    posthog.capture('$pageview')
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

const logEvent = (eventName: string, properties: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
        console.log(`[PostHog Event] ${eventName}:`, properties);
    }
};

// Track specific user actions
export const trackStartTracking = (data: TrackingData) => {
    const properties = {
        ...data,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer,
        url: window.location.href
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
        timestamp: new Date().toISOString(),
        url: window.location.href
    };
    logEvent('stop_tracking', properties);
    posthog.capture('stop_tracking', properties);
}

export const trackError = (error: string, context: ErrorContext) => {
    const properties = {
        error,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        referrer: document.referrer
    };
    logEvent('error', properties);
    posthog.capture('error', properties);
}

export const trackGameAdded = (gameUrl: string, isInCents: boolean) => {
    const properties = {
        gameUrl,
        isInCents,
        timestamp: new Date().toISOString(),
        url: window.location.href
    };
    logEvent('game_added', properties);
    posthog.capture('game_added', properties);
}

export const trackGameRemoved = (gameUrl: string) => {
    const properties = {
        gameUrl,
        timestamp: new Date().toISOString(),
        url: window.location.href
    };
    logEvent('game_removed', properties);
    posthog.capture('game_removed', properties);
}

export const trackCentsToggled = (gameUrl: string, isInCents: boolean) => {
    const properties = {
        gameUrl,
        isInCents,
        timestamp: new Date().toISOString(),
        url: window.location.href
    };
    logEvent('cents_toggled', properties);
    posthog.capture('cents_toggled', properties);
}

// Track form interactions
export const trackFormInteraction = (formId: string, action: 'focus' | 'blur' | 'submit', details?: Record<string, unknown>) => {
    posthog.capture(`form_${action}`, {
        form_id: formId,
        ...details,
        timestamp: new Date().toISOString()
    });
}

// Track error boundaries
export const trackErrorBoundary = (error: Error, componentStack: string) => {
    posthog.capture('error_boundary', {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: componentStack,
        timestamp: new Date().toISOString()
    });
}

// Expose PostHog instance for debugging
declare global {
    interface Window {
        posthog?: typeof posthog;
    }
}

if (import.meta.env.DEV) {
    window.posthog = posthog;
} 