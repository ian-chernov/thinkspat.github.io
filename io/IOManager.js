// ============================================================================
// io/IOManager.js
// Handles import/export of GeoJSON data
// ============================================================================

export class IOManager {
  constructor(toolManager, eventBus = null) {
    this.toolManager = toolManager;
    this.eventBus = eventBus;
  }

  /**
   * Initialize file input/output controls
   */
  init() {
    const exportBtn = document.getElementById('export');
    const importBtn = document.getElementById('import');
    const fileInput = document.getElementById('file');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.export());
    }

    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', async e => {
        await this.import(e.target.files[0]);
        fileInput.value = ''; // Reset so same file can be imported again
      });
    }
  }

  /**
   * Export all tool data as GeoJSON
   * @param {string} filename - Output filename
   */
  export(filename = 'geometry-data.geojson') {
    try {
      // Get all drawing tools (excludes move/delete)
      const tools = this.toolManager.getDrawingTools();

      // Collect all GeoJSON features
      const features = [];
      for (const tool of tools) {
        if (tool.toGeoJSON) {
          const toolFeatures = tool.toGeoJSON();
          features.push(...toolFeatures);
        }
      }

      // Create GeoJSON FeatureCollection
      const geojson = {
        type: 'FeatureCollection',
        features: features,
        properties: {
          exported: new Date().toISOString(),
          version: '1.0'
        }
      };

      // Download the file
      this.downloadJSON(geojson, filename);

      // Emit event
      this.eventBus?.emit('export:complete', {
        filename,
        featureCount: features.length
      });

      console.log(`Exported ${features.length} features to ${filename}`);

      return geojson;

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
      return null;
    }
  }

  /**
   * Import GeoJSON data from a file
   * @param {File} file - File object to import
   */
  async import(file) {
    if (!file) return;

    try {
      // Read file contents
      const json = await this.readJSONFile(file);

      // Validate GeoJSON
      if (!this.validateGeoJSON(json)) {
        alert('Invalid GeoJSON format');
        return;
      }

      // Import features
      const count = this.importGeoJSON(json);

      // Emit event
      this.eventBus?.emit('import:complete', {
        filename: file.name,
        featureCount: count
      });

      console.log(`Imported ${count} features from ${file.name}`);

      // Trigger redraw
      this.eventBus?.emit('redraw');

    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed: ' + error.message);
    }
  }

  /**
   * Import GeoJSON object into tools
   * @param {Object} geojson - GeoJSON object
   * @returns {number} Number of features imported
   */
  importGeoJSON(geojson) {
    if (!geojson || geojson.type !== 'FeatureCollection') {
      return 0;
    }

    const tools = this.toolManager.getAllTools();
    let count = 0;

    for (const feature of geojson.features) {
      // Find the appropriate tool for this feature
      for (const tool of tools) {
        if (tool?.constructor.accepts?.(feature)) {
          tool.fromGeoJSON(feature);
          count++;
          break; // Move to next feature
        }
      }
    }

    return count;
  }

  /**
   * Validate GeoJSON structure
   * @param {Object} json - JSON object to validate
   * @returns {boolean} Valid or not
   */
  validateGeoJSON(json) {
    if (!json || typeof json !== 'object') {
      return false;
    }

    if (json.type !== 'FeatureCollection') {
      return false;
    }

    if (!Array.isArray(json.features)) {
      return false;
    }

    return true;
  }

  /**
   * Download a JSON object as a file
   * @param {Object} obj - Object to download
   * @param {string} filename - Filename
   */
  downloadJSON(obj, filename) {
    const blob = new Blob(
      [JSON.stringify(obj, null, 2)],
      { type: 'application/json' }
    );

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();

    URL.revokeObjectURL(a.href);
  }

  /**
   * Read a JSON file
   * @param {File} file - File object
   * @returns {Promise<Object>} Parsed JSON object
   */
  readJSONFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result);
          resolve(json);
        } catch (error) {
          reject(new Error('Invalid JSON: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Export to different formats (for future implementation)
   * @param {string} format - Format (geojson, kml, gpx, etc.)
   */
  exportAs(format) {
    switch (format) {
      case 'geojson':
        return this.export();

      case 'kml':
        console.log('KML export not yet implemented');
        break;

      case 'gpx':
        console.log('GPX export not yet implemented');
        break;

      default:
        console.warn('Unknown export format:', format);
    }
  }

  /**
   * Import from different formats (for future implementation)
   * @param {File} file - File to import
   * @param {string} format - Format hint
   */
  async importAs(file, format) {
    switch (format) {
      case 'geojson':
        return await this.import(file);

      case 'kml':
        console.log('KML import not yet implemented');
        break;

      case 'gpx':
        console.log('GPX import not yet implemented');
        break;

      default:
        console.warn('Unknown import format:', format);
    }
  }

  /**
   * Get export statistics
   * @returns {Object} Stats about current data
   */
  getExportStats() {
    const tools = this.toolManager.getDrawingTools();
    const stats = {
      totalFeatures: 0,
      byType: {}
    };

    for (const tool of tools) {
      if (tool.toGeoJSON) {
        const features = tool.toGeoJSON();
        const typeName = tool.constructor.name.replace('Tool', '');

        stats.totalFeatures += features.length;
        stats.byType[typeName] = features.length;
      }
    }

    return stats;
  }
}