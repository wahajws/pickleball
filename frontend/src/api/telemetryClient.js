import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';

// Debounce map for high-volume events
const debounceMap = new Map();
const DEBOUNCE_DELAY = 2000; // 2 seconds for search events

/**
 * Telemetry Client
 * Sends behavior events to backend
 */
class TelemetryClient {
  /**
   * Send a telemetry event
   * @param {string} eventName - Event name (e.g., 'auth.login', 'booking.confirmed')
   * @param {Object} payload - Event payload
   * @param {string|null} payload.company_id - Company ID
   * @param {string|null} payload.branch_id - Branch ID
   * @param {string|null} payload.entity_type - Entity type
   * @param {string|null} payload.entity_id - Entity ID
   * @param {Object} payload.properties - Event properties
   * @param {boolean} debounce - Whether to debounce this event (for high-volume events)
   */
  static async sendEvent(eventName, payload = {}, debounce = false) {
    try {
      // Get session ID from localStorage if available
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        apiClient.defaults.headers.common['x-session-id'] = sessionId;
      }

      // Debounce high-volume events
      if (debounce) {
        const key = `${eventName}_${payload.entity_id || 'global'}`;
        const existing = debounceMap.get(key);
        
        if (existing) {
          clearTimeout(existing.timeout);
        }

        const timeout = setTimeout(async () => {
          debounceMap.delete(key);
          await this._sendEvent(eventName, payload);
        }, DEBOUNCE_DELAY);

        debounceMap.set(key, { timeout });
        return;
      }

      // Send immediately for non-debounced events
      await this._sendEvent(eventName, payload);
    } catch (error) {
      // Silently fail - telemetry should never break the app
      console.warn('Telemetry error:', error);
    }
  }

  /**
   * Internal method to send event
   */
  static async _sendEvent(eventName, payload) {
    try {
      await apiClient.post(API_ENDPOINTS.TELEMETRY, {
        event_name: eventName,
        company_id: payload.company_id || null,
        branch_id: payload.branch_id || null,
        entity_type: payload.entity_type || null,
        entity_id: payload.entity_id || null,
        properties: payload.properties || {},
      });
    } catch (error) {
      // Silently fail
      console.warn('Telemetry send failed:', error);
    }
  }

  /**
   * Track page view
   */
  static trackPageView(path, referrer = null) {
    this.sendEvent('page.view', {
      properties: {
        page_path: path,
        referrer: referrer || document.referrer,
      },
    });
  }
}

export default TelemetryClient;


