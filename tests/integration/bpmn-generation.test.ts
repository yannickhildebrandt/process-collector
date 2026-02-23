import { describe, it, expect } from "vitest";
import { generateBpmnXml } from "../../src/lib/interview/bpmn-generator";
import type { ProcessSummary } from "../../src/lib/interview/schemas";

describe("BPMN Generation", () => {
  it("generates valid BPMN XML with start and end events for a simple process", () => {
    const summary: ProcessSummary = {
      processName: "Simple Process",
      steps: [
        {
          id: "step-1",
          name: "Do Task",
          description: "A simple task",
          type: "task",
        },
      ],
    };

    const xml = generateBpmnXml(summary);

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("bpmn:startEvent");
    expect(xml).toContain("bpmn:endEvent");
    expect(xml).toContain("bpmn:task");
    expect(xml).toContain('name="Do Task"');
    expect(xml).toContain("bpmn:sequenceFlow");
    expect(xml).toContain("bpmndi:BPMNDiagram");
  });

  it("generates BPMN with gateway for decision steps", () => {
    const summary: ProcessSummary = {
      processName: "Decision Process",
      steps: [
        {
          id: "step-1",
          name: "Review Request",
          description: "Review the incoming request",
          type: "task",
        },
        {
          id: "step-2",
          name: "Approve?",
          description: "Decision: approve or reject",
          type: "decision",
          conditions: [
            { condition: "Approved", nextStep: "step-3" },
            { condition: "Rejected", nextStep: "end" },
          ],
        },
        {
          id: "step-3",
          name: "Process Approved",
          description: "Handle approved request",
          type: "task",
        },
      ],
    };

    const xml = generateBpmnXml(summary);

    expect(xml).toContain("bpmn:exclusiveGateway");
    expect(xml).toContain('name="Approve?"');
    expect(xml).toContain("bpmn:startEvent");
    expect(xml).toContain("bpmn:endEvent");
  });

  it("generates minimal BPMN for empty steps", () => {
    const summary: ProcessSummary = {
      processName: "Empty Process",
      steps: [],
    };

    const xml = generateBpmnXml(summary);

    expect(xml).toContain("bpmn:startEvent");
    expect(xml).toContain("bpmn:endEvent");
    expect(xml).toContain('name="Empty Process"');
  });

  it("generates BPMN with multiple sequential tasks", () => {
    const summary: ProcessSummary = {
      processName: "Multi-Step Process",
      steps: [
        {
          id: "step-1",
          name: "Step One",
          description: "First step",
          type: "task",
          actor: "Employee",
        },
        {
          id: "step-2",
          name: "Step Two",
          description: "Second step",
          type: "task",
          system: "SAP",
        },
        {
          id: "step-3",
          name: "Step Three",
          description: "Third step",
          type: "task",
        },
      ],
    };

    const xml = generateBpmnXml(summary);

    expect(xml).toContain('name="Step One"');
    expect(xml).toContain('name="Step Two"');
    expect(xml).toContain('name="Step Three"');
    // Should have start + 3 tasks + end = 5 elements, 4 flows
    const taskMatches = xml.match(/bpmn:task/g);
    expect(taskMatches?.length).toBeGreaterThanOrEqual(6); // 3 tasks * 2 (open + close tags)
  });

  it("properly escapes XML special characters in names", () => {
    const summary: ProcessSummary = {
      processName: 'Process & "Quotes" <Special>',
      steps: [
        {
          id: "step-1",
          name: "Ship & Deliver",
          description: "Handle shipping",
          type: "task",
        },
      ],
    };

    const xml = generateBpmnXml(summary);

    expect(xml).toContain("&amp;");
    expect(xml).toContain("&quot;");
    expect(xml).not.toContain('name="Process & "');
  });
});
