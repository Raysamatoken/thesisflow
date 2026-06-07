import type { Cell, Node, Edge } from '@antv/x6';

/** X6 node event payload */
export interface X6NodeEvent {
  node: Node;
  e: MouseEvent;
}

/** X6 edge event payload */
export interface X6EdgeEvent {
  edge: Edge;
  e: MouseEvent;
}

/** X6 blank (canvas background) click event */
export interface X6BlankEvent {
  e: MouseEvent;
}

/** X6 selection change event */
export interface X6SelectEvent {
  selected: Cell[];
}

/** X6 scale change event */
export interface X6ScaleEvent {
  sx: number;
  sy: number;
}
