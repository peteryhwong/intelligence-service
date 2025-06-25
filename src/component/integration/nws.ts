import axios from 'axios';
import { logger } from '../logger';

export interface ForecastPeriod {
    name?: string;
    temperature?: number;
    temperatureUnit?: string;
    windSpeed?: string;
    windDirection?: string;
    shortForecast?: string;
}

export interface AlertFeature {
    properties: {
        event?: string;
        areaDesc?: string;
        severity?: string;
        status?: string;
        headline?: string;
    };
}

export interface AlertsResponse {
    features: AlertFeature[];
}

export interface PointsResponse {
    properties: {
        forecast?: string;
    };
}

export interface ForecastResponse {
    properties: {
        periods: ForecastPeriod[];
    };
}

// Helper function for making NWS API requests
export async function makeNWSRequest<T>(url: string): Promise<T> {
    try {
        logger.info(`Making NWS request to: ${url}`);
        const response = await axios.get<T>(url, {
            headers: {
                Accept: 'application/geo+json',
            },
        });
        if (!response.data) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        logger.info(`NWS request successful`);
        return response.data;
    } catch (error) {
        logger.error(`Error making NWS request: ${error.message}`);
        throw error;
    }
}

// Format alert data
export function formatAlert(feature: AlertFeature): string {
    const props = feature.properties;
    return [
        `Event: ${props.event || 'Unknown'}`,
        `Area: ${props.areaDesc || 'Unknown'}`,
        `Severity: ${props.severity || 'Unknown'}`,
        `Status: ${props.status || 'Unknown'}`,
        `Headline: ${props.headline || 'No headline'}`,
        '---',
    ].join('\n');
}
