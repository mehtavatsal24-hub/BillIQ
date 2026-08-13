/**
 * Parses box strings to determine individual physical boxes (e.g. "Box 1-5" -> 1, 2, 3, 4, 5).
 * Resolves overlapping boxes gracefully so a physical box is only counted once.
 */
export function getUniquePhysicalBoxesCount(boxes: { boxNo?: string }[] | string[]): number {
  const uniqueBoxes = new Set<string>();
  
  if (!boxes || !Array.isArray(boxes)) return 0;
  boxes.forEach(b => {
    if (!b) return;
    const boxStr = typeof b === 'string' ? b : (typeof b === 'object' && b.boxNo ? String(b.boxNo) : "");
    const trimmed = (boxStr || "").trim();
    if (!trimmed) return;

    // Remove prefix "Box" or "Pkg" (case-insensitive) to normalize
    const clean = trimmed.replace(/^(box|pkg)\s*/i, "").trim();

    // Split by comma or semicolon
    const parts = clean.split(/[,;]+/);
    
    parts.forEach(part => {
      const p = part.trim();
      if (!p) return;

      // Match ranges like "1-5", "1to5", "1 - 5", "1 to 5"
      const rangeMatch = p.match(/^(\d+)\s*(?:-|to)\s*(\d+)$/i);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.min(start, end);
          const max = Math.max(start, end);
          if (max - min <= 5000) { // Safety guard to avoid massive loops
            for (let i = min; i <= max; i++) {
              uniqueBoxes.add(`Box ${i}`);
            }
            return;
          }
        }
      }

      // Check if it's a number
      const num = parseInt(p, 10);
      if (!isNaN(num) && /^\d+$/.test(p)) {
        uniqueBoxes.add(`Box ${num}`);
      } else {
        // Fallback to literal name (in lowercase/normalized to prevent duplication e.g. "box a" vs "Box A")
        uniqueBoxes.add((p || "").toLowerCase());
      }
    });
  });

  return uniqueBoxes.size;
}

/**
 * Returns the exact physical count of boxes for a single boxNo string expression.
 * E.g., "Box 1-5" -> 5 (representing Box 1, 2, 3, 4, 5).
 */
export function getSingleBoxNoCount(boxNo: string): number {
  if (!boxNo) return 0;
  return getUniquePhysicalBoxesCount([boxNo]);
}
