// ============================================================================
// core/EventBus.js
// Pub/Sub event system for decoupled communication between components
// ============================================================================

export class EventBus {
  constructor() {
    // Map of event names to arrays of callback functions
    this.listeners = new Map();

    // Optional: Enable debug logging
    this.debug = false;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    // Create listener array if it doesn't exist
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    // Add callback to listeners
    this.listeners.get(event).push(callback);

    if (this.debug) {
      console.log(`[EventBus] Subscribed to "${event}"`, callback);
    }

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event, but only fire once
   * @param {string} event - Event name
   * @param {Function} callback - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };

    return this.on(event, wrapper);
  }

  /**
   * Emit an event to all subscribers
   * @param {string} event - Event name
   * @param {*} data - Data to pass to callbacks
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      if (this.debug) {
        console.log(`[EventBus] No listeners for "${event}"`);
      }
      return;
    }

    const callbacks = this.listeners.get(event);

    if (this.debug) {
      console.log(`[EventBus] Emitting "${event}" to ${callbacks.length} listeners`, data);
    }

    // Call each callback with the data
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in listener for "${event}":`, error);
      }
    });
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - The callback to remove
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);

    if (index > -1) {
      callbacks.splice(index, 1);

      if (this.debug) {
        console.log(`[EventBus] Unsubscribed from "${event}"`);
      }
    }

    // Clean up empty arrays
    if (callbacks.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Remove all listeners for an event, or all events if no event specified
   * @param {string} [event] - Optional event name
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);

      if (this.debug) {
        console.log(`[EventBus] Cleared all listeners for "${event}"`);
      }
    } else {
      this.listeners.clear();

      if (this.debug) {
        console.log('[EventBus] Cleared all listeners');
      }
    }
  }

  /**
   * Get count of listeners for an event
   * @param {string} event - Event name
   * @returns {number}
   */
  listenerCount(event) {
    return this.listeners.get(event)?.length || 0;
  }

  /**
   * Get all registered event names
   * @returns {string[]}
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
}

// ============================================================================
// Common Events - Documentation
// ============================================================================

/**
 * Standard events used in the application:
 *
 * 'mode:changed'       - Fired when tool mode changes
 *   data: { mode: string, previousMode: string, tool: Object }
 *
 * 'tool:changed'       - Fired when active tool instance changes
 *   data: { name: string, tool: Object }
 *
 * 'data:cleared'       - Fired when all data is cleared
 *   data: undefined
 *
 * 'redraw'             - Request a canvas redraw
 *   data: undefined
 *
 * 'style:changed'      - Fired when a tool style is updated
 *   data: { toolName: string, property: string, value: any }
 *
 * 'map:layer:changed'  - Fired when base map layer changes
 *   data: { layer: string }
 *
 * 'import:complete'    - Fired when GeoJSON import completes
 *   data: { featureCount: number }
 *
 * 'export:complete'    - Fired when GeoJSON export completes
 *   data: { filename: string }
 */