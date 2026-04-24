import { useState, useEffect } from 'react';

/**
 * useFormSecurity Hook
 * Implements anti-bot measures including:
 * - Time-based form completion check
 * - Honeypot field validation
 */
export const useFormSecurity = () => {
    const [startTime, setStartTime] = useState<number>(0);
    const [botCheck, setBotCheck] = useState<string>('');

    useEffect(() => {
        setStartTime(Date.now());
    }, []);

    // Time in milliseconds. If submitted faster than this, consider it a bot.
    const MINIMUM_COMPLETION_TIME = 2000;

    const verifySecurity = (): boolean => {
        // If the visually hidden honeypot field is filled, it's a bot
        if (botCheck !== '') {
            console.warn("Security Error: Honeypot field was filled.");
            return false;
        }

        // If form is submitted too fast, it's a bot
        const completionTime = Date.now() - startTime;
        if (completionTime < MINIMUM_COMPLETION_TIME) {
            console.warn(`Security Error: Form completed too fast (${completionTime}ms).`);
            return false;
        }

        return true;
    };

    return {
        botCheck,
        setBotCheck,
        verifySecurity,
    };
};
