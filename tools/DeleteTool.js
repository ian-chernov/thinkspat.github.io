// ============================================================================
// tools/DeleteTool.js
// ============================================================================

export class DeleteTool {
  constructor(toolManager, map, hitDetector) {
    this.toolManager = toolManager;
    this.map = map;
    this.hitDetector = hitDetector;
  }

  add(latlng) {
    const tools = this.toolManager.getAllTools().filter(t => !t.isMoveTool);
    const hit = this.hitDetector.pickForDelete(latlng, tools);
    if (!hit) return;

    const { tool, index } = hit;
    tool.splice(index, 1);
  }

  draw() {
    // Delete tool doesn't draw anything
  }
}