// ============================================================================
// ui/KeyboardShortcuts.js
// Handles keyboard shortcuts for tool switching and actions
// ============================================================================

export class KeyboardShortcuts {
  constructor(appState, renderCallback) {
    this.appState = appState;
    this.renderCallback = renderCallback;
    this.enabled = true;
  }

  /**
   * Initialize keyboard event listeners
   */
  init() {
    window.addEventListener('keydown', e => this.handleKeyDown(e));
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    if (!this.enabled) return;

    // Ignore if user is typing in an input field
    if (this.isTypingInInput(e)) return;

    const key = e.key.toLowerCase();

    // Handle the key
    if (this.handleKey(key, e)) {
      e.preventDefault(); // Prevent default browser behavior
    }
  }

  /**
   * Check if user is typing in an input field
   * @param {KeyboardEvent} e - Event
   * @returns {boolean}
   */
  isTypingInInput(e) {
    return (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    );
  }

  /**
   * Handle a specific key press
   * @param {string} key - Key pressed
   * @param {KeyboardEvent} e - Original event
   * @returns {boolean} True if key was handled
   */
  handleKey(key, e) {
    // STOP DRAWING (finish current operation)
    if (key === 'enter' || key === 'escape') {
      this.stopDrawing();
      return true;
    }

    // TOOL SHORTCUTS
    const toolShortcuts = {
      'e': 'explore',
      'p': 'points',
      's': 'sector',
      'l': 'line',
      'o': 'polygon',
      't': 'text',
      'm': 'move',
      'd': 'delete'
    };

    if (toolShortcuts[key]) {
      this.appState.setMode(toolShortcuts[key]);
      return true;
    }

    // UNDO (Ctrl+Z) - for future implementation
    if ((e.ctrlKey || e.metaKey) && key === 'z') {
      this.undo();
      return true;
    }

    // REDO (Ctrl+Y or Ctrl+Shift+Z)
    if ((e.ctrlKey || e.metaKey) && (key === 'y' || (e.shiftKey && key === 'z'))) {
      this.redo();
      return true;
    }

    // DELETE selected item (Delete or Backspace)
    if (key === 'delete' || key === 'backspace') {
      this.deleteSelected();
      return true;
    }

    // CLEAR ALL (Ctrl+Shift+Delete)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'delete') {
      this.clearAll();
      return true;
    }

    return false;
  }

  /**
   * Stop current drawing operation
   */
  stopDrawing() {
    const tool = this.appState.getActiveTool();

    if (tool?.finish) {
      tool.finish();
      this.renderCallback();
    }
  }

  /**
   * Undo last action (placeholder for future implementation)
   */
  undo() {
    console.log('Undo not yet implemented');
    // TODO: Implement undo/redo system
  }

  /**
   * Redo last undone action (placeholder)
   */
  redo() {
    console.log('Redo not yet implemented');
    // TODO: Implement undo/redo system
  }

  /**
   * Delete currently selected item (placeholder)
   */
  deleteSelected() {
    // This would require a selection system
    console.log('Delete selected not yet implemented');
  }

  /**
   * Clear all data with confirmation
   */
  clearAll() {
    if (confirm('Clear all data? This cannot be undone.')) {
      this.appState.clearAll();
      this.renderCallback();
    }
  }

  /**
   * Enable keyboard shortcuts
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable keyboard shortcuts
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Get help text for keyboard shortcuts
   * @returns {string} Help text
   */
  getHelpText() {
    return `
Keyboard Shortcuts:

TOOLS:
  E - Explore (pan/zoom)
  P - Points
  L - Line
  O - Polygon (O for "Outline")
  S - Sector
  T - Text
  M - Move
  D - Delete

ACTIONS:
  Enter/Escape - Finish drawing
  Ctrl+Z - Undo (coming soon)
  Ctrl+Y - Redo (coming soon)
  Delete - Delete selected (coming soon)
  Ctrl+Shift+Delete - Clear all
    `.trim();
  }

  /**
   * Show keyboard shortcuts help dialog
   */
  showHelp() {
    alert(this.getHelpText());
  }
}