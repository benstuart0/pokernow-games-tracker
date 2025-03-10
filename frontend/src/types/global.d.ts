declare global {
    var process: {
        env: Record<string, string>;
        cwd(): string;
    };
} 