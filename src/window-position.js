function isPositionVisible(position, displays, windowSize) {
  if (!position) return false;
  return displays.some(({ workArea }) => {
    const horizontalOverlap =
      position.x + windowSize.width > workArea.x &&
      position.x < workArea.x + workArea.width;
    const verticalOverlap =
      position.y + windowSize.height > workArea.y &&
      position.y < workArea.y + workArea.height;
    return horizontalOverlap && verticalOverlap;
  });
}

function positionAtRightCenter(workArea, windowSize, margin = 28) {
  return {
    x: Math.round(workArea.x + workArea.width - windowSize.width - margin),
    y: Math.round(workArea.y + (workArea.height - windowSize.height) / 2),
  };
}

module.exports = { isPositionVisible, positionAtRightCenter };
