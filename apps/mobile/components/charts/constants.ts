// Chart geometry (docs: dataviz mark specs). Not theme tokens: they are the shape of the marks.

/** Height of the drawing area. */
export const PLOT_HEIGHT = 140;
/** Column with the value labels, left of the drawing area. */
export const AXIS_WIDTH = 52;
/** Bars are at most 24 px wide: the rest of each slot is air. */
export const BAR_MAX_WIDTH = 24;
/** Rounded top of a bar. */
export const BAR_RADIUS = 4;
/** Lines are 2 px. */
export const LINE_WIDTH = 2;
/** Selected point: 8 px dot with a 2 px ring in the card color. */
export const MARKER_RADIUS = 4;
export const MARKER_RING = 2;
/** The area under a line is a light wash of its color. */
export const AREA_OPACITY = 0.1;
/** Bars other than the selected one. */
export const UNSELECTED_OPACITY = 0.45;
