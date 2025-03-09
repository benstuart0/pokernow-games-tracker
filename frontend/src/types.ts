export interface Game {
    url: string;
    isInCents: boolean;
}

export interface TrackingResults {
    results: Record<string, number | string>;
    total_profit: number;
    has_errors: boolean;
}

export interface ApiResponse {
    results: TrackingResults;
    error?: string;
} 