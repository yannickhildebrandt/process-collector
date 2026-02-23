import type { ProcessSummary, ProcessStep } from "./schemas";

/**
 * Generates valid BPMN 2.0 XML from a process summary JSON.
 * This is deterministic code (not LLM-generated) using string-based XML construction
 * since bpmn-moddle types can be complex. The output includes BPMN DI for diagram layout.
 */
export function generateBpmnXml(summary: ProcessSummary): string {
  const steps = summary.steps || [];
  if (steps.length === 0) {
    return generateMinimalBpmn(summary.processName);
  }

  const elements: string[] = [];
  const flows: string[] = [];
  const shapes: string[] = [];
  const edges: string[] = [];

  let flowCounter = 0;
  const nextFlowId = () => `Flow_${++flowCounter}`;

  // Layout constants
  const startX = 180;
  const startY = 200;
  const stepWidth = 120;
  const stepHeight = 80;
  const gatewaySize = 50;
  const spacing = 60;
  let currentX = startX;

  // Start event
  const startId = "StartEvent_1";
  elements.push(
    `    <bpmn:startEvent id="${startId}" name="Start">`,
    `      <bpmn:outgoing>${nextFlowId()}</bpmn:outgoing>`,
    `    </bpmn:startEvent>`
  );
  shapes.push(generateShape(startId, currentX, startY, 36, 36));
  const firstFlowId = `Flow_${flowCounter}`;
  currentX += 36 + spacing;

  // Track previous element for sequential flow
  let prevElementId = startId;
  let prevFlowId = firstFlowId;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const elementId = `Activity_${step.id || i + 1}`;

    if (step.type === "decision") {
      // Gateway
      const gatewayId = `Gateway_${step.id || i + 1}`;
      const incomingFlow = prevFlowId;
      const outFlowYes = nextFlowId();
      const outFlowNo = nextFlowId();

      elements.push(
        `    <bpmn:exclusiveGateway id="${gatewayId}" name="${escapeXml(step.name)}">`,
        `      <bpmn:incoming>${incomingFlow}</bpmn:incoming>`,
        `      <bpmn:outgoing>${outFlowYes}</bpmn:outgoing>`,
        `      <bpmn:outgoing>${outFlowNo}</bpmn:outgoing>`,
        `    </bpmn:exclusiveGateway>`
      );
      shapes.push(
        generateShape(gatewayId, currentX, startY - 5, gatewaySize, gatewaySize, true)
      );

      // Connection from previous to gateway
      flows.push(generateFlow(incomingFlow, prevElementId, gatewayId));
      edges.push(generateEdge(incomingFlow, currentX - spacing, startY + 18, currentX, startY + 20));

      // "Yes" path continues forward
      const conditionLabels = step.conditions?.length
        ? step.conditions.map((c) => c.condition)
        : ["Yes", "No"];

      flows.push(
        generateFlow(outFlowYes, gatewayId, "", conditionLabels[0] || "Yes")
      );

      // "No" path goes to end event below
      const noEndId = `EndEvent_No_${i}`;
      elements.push(
        `    <bpmn:endEvent id="${noEndId}" name="${escapeXml(conditionLabels[1] || "No")}">`,
        `      <bpmn:incoming>${outFlowNo}</bpmn:incoming>`,
        `    </bpmn:endEvent>`
      );
      shapes.push(
        generateShape(noEndId, currentX + 7, startY + 100, 36, 36)
      );
      flows.push(generateFlow(outFlowNo, gatewayId, noEndId, conditionLabels[1] || "No"));
      edges.push(
        generateEdge(outFlowNo, currentX + 25, startY + gatewaySize - 5, currentX + 25, startY + 100)
      );

      prevElementId = gatewayId;
      prevFlowId = outFlowYes;
      currentX += gatewaySize + spacing;
    } else {
      // Task or subprocess
      const incomingFlow = prevFlowId;
      const outFlow = nextFlowId();

      elements.push(
        `    <bpmn:task id="${elementId}" name="${escapeXml(step.name)}">`,
        `      <bpmn:incoming>${incomingFlow}</bpmn:incoming>`,
        `      <bpmn:outgoing>${outFlow}</bpmn:outgoing>`,
        `    </bpmn:task>`
      );
      shapes.push(
        generateShape(elementId, currentX, startY - 22, stepWidth, stepHeight)
      );

      flows.push(generateFlow(incomingFlow, prevElementId, elementId));
      edges.push(
        generateEdge(
          incomingFlow,
          currentX - spacing,
          startY + 18,
          currentX,
          startY + 18
        )
      );

      prevElementId = elementId;
      prevFlowId = outFlow;
      currentX += stepWidth + spacing;
    }
  }

  // End event
  const endId = "EndEvent_1";
  const lastFlow = prevFlowId;
  elements.push(
    `    <bpmn:endEvent id="${endId}" name="End">`,
    `      <bpmn:incoming>${lastFlow}</bpmn:incoming>`,
    `    </bpmn:endEvent>`
  );
  shapes.push(generateShape(endId, currentX, startY, 36, 36));
  flows.push(generateFlow(lastFlow, prevElementId, endId));
  edges.push(
    generateEdge(lastFlow, currentX - spacing, startY + 18, currentX, startY + 18)
  );

  // Fix gateway Yes flows: set their targetRef to the next element
  const fixedFlows = flows.map((f) => {
    if (f.includes('targetRef=""')) {
      // Find the next task after this flow
      const idx = flows.indexOf(f);
      const nextFlow = flows[idx + 1];
      if (nextFlow) {
        const targetMatch = nextFlow.match(/targetRef="([^"]+)"/);
        if (targetMatch) {
          return f.replace('targetRef=""', `targetRef="${targetMatch[1]}"`);
        }
      }
    }
    return f;
  });

  const processName = escapeXml(summary.processName);

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" name="${processName}" isExecutable="false">
${elements.join("\n")}
${fixedFlows.join("\n")}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
${shapes.join("\n")}
${edges.join("\n")}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function generateMinimalBpmn(processName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" name="${escapeXml(processName)}" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_1</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="200" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="280" y="200" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function generateShape(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  isMarkerVisible = false
): string {
  const marker = isMarkerVisible ? ' isMarkerVisible="true"' : "";
  return `      <bpmndi:BPMNShape id="${id}_di" bpmnElement="${id}"${marker}>
        <dc:Bounds x="${x}" y="${y}" width="${width}" height="${height}" />
      </bpmndi:BPMNShape>`;
}

function generateEdge(
  id: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  return `      <bpmndi:BPMNEdge id="${id}_di" bpmnElement="${id}">
        <di:waypoint x="${x1}" y="${y1}" />
        <di:waypoint x="${x2}" y="${y2}" />
      </bpmndi:BPMNEdge>`;
}

function generateFlow(
  id: string,
  sourceRef: string,
  targetRef: string,
  name?: string
): string {
  const nameAttr = name ? ` name="${escapeXml(name)}"` : "";
  return `    <bpmn:sequenceFlow id="${id}"${nameAttr} sourceRef="${sourceRef}" targetRef="${targetRef}" />`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
