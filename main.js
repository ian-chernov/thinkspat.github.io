// ============================================================================
// main.js - Application Entry Point
// ============================================================================

// Import core systems
import { AppState } from './core/AppState.js';
import { MapView } from './core/MapView.js';
import { HitDetector } from './utils/hitDetection.js';

// Import tools
import { PointsTool } from './tools/PointsTool.js';
import { PolylineTool } from './tools/PolylineTool.js';
import { PolygonTool } from './tools/PolygonTool.js';
import { SectorTool } from './tools/SectorTool.js';
import { TextTool } from './tools/TextTool.js';
import { MoveTool } from './tools/MoveTool.js';
import { DeleteTool } from './tools/DeleteTool.js';

// Import UI and I18N
import { UIManager } from './ui/UIManager.js';
import { StatusBar } from './ui/StatusBar.js';
import { KeyboardShortcuts } from './ui/KeyboardShortcuts.js';
import { renderI18n, initLangSelector } from './i18n/i18n.js';

// Import IO
import { IOManager } from './io/IOManager.js';

/* ===================== INITIALIZATION ===================== */

// 1. Initialize canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 2. Initialize core systems
const appState = new AppState();
const map = new MapView();

// ⭐ IMPORTANT: Set map reference in appState BEFORE creating UIManager
appState.setMap(map);

const hitDetector = new HitDetector(map);

// 3. Create draw callback
const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const tools = appState.toolManager.getAllTools();
  for (const tool of tools) {
    tool.draw?.(ctx, map);
  }
};

// 4. Initialize tools with dependencies
const points = new PointsTool(appState.styleManager, draw);
const line = new PolylineTool(appState.styleManager);
const polygon = new PolygonTool(appState.styleManager);
const sector = new SectorTool(appState.styleManager);
const text = new TextTool(appState.styleManager);
const move = new MoveTool(appState.toolManager, map, hitDetector);
const deleteTool = new DeleteTool(appState.toolManager, map, hitDetector);

// 5. Register tools
appState.toolManager.register('explore', null);
appState.toolManager.register('points', points);
appState.toolManager.register('line', line);
appState.toolManager.register('polygon', polygon);
appState.toolManager.register('sector', sector);
appState.toolManager.register('text', text);
appState.toolManager.register('move', move);
appState.toolManager.register('delete', deleteTool);

appState.setMode('explore');

// 6. Initialize UI (now that appState.map is set)
const uiManager = new UIManager(appState, draw);
uiManager.init();

// 7. Initialize status bar
const statusBar = new StatusBar(document.getElementById('status'));

// 8. Initialize keyboard shortcuts
const keyboard = new KeyboardShortcuts(appState, draw);
keyboard.init();

// 9. Initialize I18N
renderI18n();
initLangSelector(document.getElementById('langSelect'));

// 10. Initialize IO
const ioManager = new IOManager(appState.toolManager, appState.eventBus);
ioManager.init();

// 11. Setup resize handler
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}

window.addEventListener('resize', resize);
resize();

// 12. Setup map events
map.onClick(latlng => {
  const tool = appState.toolManager.getActive();
  tool?.add?.(latlng);
  draw();
});

map.onDoubleClick(() => {
  const tool = appState.toolManager.getActive();
  tool?.finish?.();
  draw();
});

map.onMouseDown(latlng => {
  const tool = appState.toolManager.getActive();
  tool?.onMouseDown?.(latlng);
});

map.onMouseUp(() => {
  const tool = appState.toolManager.getActive();
  if (tool?.isMoveTool) {
    tool.finish();
    draw();
  }
});

map.onMouseMove(latlng => {
  // Update status bar
  statusBar.update(latlng);

  // Update tool
  const tool = appState.toolManager.getActive();
  tool?.onMouseMove?.(latlng);
  draw();
});

map.onMove(draw);

/* ===================== EXPORTS FOR DEBUGGING ===================== */
window.__debug__ = {
  appState,
  map,
  draw,
  tools: { points, line, polygon, sector, text, move, deleteTool },
  uiManager,
  statusBar,
  keyboard,
  ioManager
};

console.log('✅ Geometry Editor initialized');
console.log('📍 Available tools:', appState.toolManager.getAllToolNames());