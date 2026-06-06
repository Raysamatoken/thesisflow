// =====================================================================
// ThesisFlow - Custom node registration
// Academic style: black/white, uniform font, visible ports on hover
// =====================================================================

import { Graph } from '@antv/x6';

const ACADEMIC_STYLE = {
  fill: '#ffffff',
  stroke: '#333333',
  strokeWidth: 1.5,
  fontSize: 12,
  fontFamily: 'Microsoft YaHei, SimSun, sans-serif',
  fontColor: '#333333',
};

export function registerFlowShapes(): void {

  // flow-terminal (start/end): ellipse
  Graph.registerNode('flow-terminal', {
    inherit: 'ellipse',
    width: 120,
    height: 50,
    attrs: {
      body: {
        fill: ACADEMIC_STYLE.fill,
        stroke: ACADEMIC_STYLE.stroke,
        strokeWidth: ACADEMIC_STYLE.strokeWidth,
      },
      label: {
        fontSize: ACADEMIC_STYLE.fontSize,
        fontFamily: ACADEMIC_STYLE.fontFamily,
        fill: ACADEMIC_STYLE.fontColor,
      },
    },
    ports: defaultPorts(),
  });

  // flow-process (process step): rounded rect
  Graph.registerNode('flow-process', {
    inherit: 'rect',
    width: 140,
    height: 60,
    attrs: {
      body: {
        fill: ACADEMIC_STYLE.fill,
        stroke: ACADEMIC_STYLE.stroke,
        strokeWidth: ACADEMIC_STYLE.strokeWidth,
        rx: 6,
        ry: 6,
      },
      label: {
        fontSize: ACADEMIC_STYLE.fontSize,
        fontFamily: ACADEMIC_STYLE.fontFamily,
        fill: ACADEMIC_STYLE.fontColor,
      },
    },
    ports: defaultPorts(),
  });

  // flow-decision (condition): diamond
  Graph.registerNode('flow-decision', {
    inherit: 'polygon',
    width: 120,
    height: 80,
    attrs: {
      body: {
        fill: ACADEMIC_STYLE.fill,
        stroke: ACADEMIC_STYLE.stroke,
        strokeWidth: ACADEMIC_STYLE.strokeWidth,
        refPoints: '0,10 10,0 20,10 10,20',
      },
      label: {
        fontSize: ACADEMIC_STYLE.fontSize,
        fontFamily: ACADEMIC_STYLE.fontFamily,
        fill: ACADEMIC_STYLE.fontColor,
      },
    },
    ports: defaultPorts(),
  });

  // flow-io (input/output): parallelogram
  Graph.registerNode('flow-io', {
    inherit: 'polygon',
    width: 140,
    height: 60,
    attrs: {
      body: {
        fill: ACADEMIC_STYLE.fill,
        stroke: ACADEMIC_STYLE.stroke,
        strokeWidth: ACADEMIC_STYLE.strokeWidth,
        refPoints: '10,0 20,0 10,20 0,20',
      },
      label: {
        fontSize: ACADEMIC_STYLE.fontSize,
        fontFamily: ACADEMIC_STYLE.fontFamily,
        fill: ACADEMIC_STYLE.fontColor,
      },
    },
    ports: defaultPorts(),
  });

  // flow-subprocess (sub-process): double-stripe rect
  Graph.registerNode('flow-subprocess', {
    inherit: 'rect',
    width: 140,
    height: 60,
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'line', selector: 'stripeLeft' },
      { tagName: 'line', selector: 'stripeRight' },
      { tagName: 'text', selector: 'label' },
    ],
    attrs: {
      body: {
        fill: ACADEMIC_STYLE.fill,
        stroke: ACADEMIC_STYLE.stroke,
        strokeWidth: ACADEMIC_STYLE.strokeWidth,
        rx: 4,
        ry: 4,
      },
      stripeLeft: {
        stroke: ACADEMIC_STYLE.stroke,
        strokeWidth: 1.5,
        x1: 12, y1: 2,
        x2: 12, y2: 58,
      },
      stripeRight: {
        stroke: ACADEMIC_STYLE.stroke,
        strokeWidth: 1.5,
        x1: 128, y1: 2,
        x2: 128, y2: 58,
      },
      label: {
        fontSize: ACADEMIC_STYLE.fontSize,
        fontFamily: ACADEMIC_STYLE.fontFamily,
        fill: ACADEMIC_STYLE.fontColor,
      },
    },
    ports: defaultPorts(),
  });

  // module-component (system module): rect with subtitle
  Graph.registerNode('module-component', {
    inherit: 'rect',
    width: 200,
    height: 80,
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'text', selector: 'label' },
      { tagName: 'text', selector: 'subtitle' },
      { tagName: 'line', selector: 'divider' },
    ],
    attrs: {
      body: {
        fill: ACADEMIC_STYLE.fill,
        stroke: ACADEMIC_STYLE.stroke,
        strokeWidth: ACADEMIC_STYLE.strokeWidth,
        rx: 4,
        ry: 4,
      },
      label: {
        fontSize: 13,
        fontWeight: 'bold',
        fontFamily: ACADEMIC_STYLE.fontFamily,
        fill: ACADEMIC_STYLE.fontColor,
        textAnchor: 'middle',
        refX: 0.5,
        refY: 0.32,
        textVerticalAnchor: 'middle',
      },
      subtitle: {
        fontSize: 11,
        fontFamily: ACADEMIC_STYLE.fontFamily,
        fill: '#888888',
        textAnchor: 'middle',
        refX: 0.5,
        refY: 0.72,
        textVerticalAnchor: 'middle',
        text: '',
      },
      divider: {
        stroke: '#d9d9d9',
        strokeWidth: 1,
        x1: 8,
        y1: '50%',
        x2: 'calc(100% - 8)',
        y2: '50%',
      },
    },
    ports: defaultPorts(),
  });
}

// -------------------------------------------------------------------
//  Default port configuration
//  4 ports (top/right/bottom/left), visible on hover
// -------------------------------------------------------------------

function defaultPorts() {
  return {
    groups: {
      top: {
        position: 'top',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#333333',
            strokeWidth: 1.5,
            fill: '#ffffff',
            visibility: 'hidden',
          },
        },
      },
      right: {
        position: 'right',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#333333',
            strokeWidth: 1.5,
            fill: '#ffffff',
            visibility: 'hidden',
          },
        },
      },
      bottom: {
        position: 'bottom',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#333333',
            strokeWidth: 1.5,
            fill: '#ffffff',
            visibility: 'hidden',
          },
        },
      },
      left: {
        position: 'left',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#333333',
            strokeWidth: 1.5,
            fill: '#ffffff',
            visibility: 'hidden',
          },
        },
      },
    },
    items: [
      { group: 'top' },
      { group: 'right' },
      { group: 'bottom' },
      { group: 'left' },
    ],
  };
}