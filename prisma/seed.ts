import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.interviewMessage.deleteMany();
  await prisma.interviewSession.deleteMany();
  await prisma.processEntry.deleteMany();
  await prisma.projectConfiguration.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.lLMProviderConfig.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.verification.deleteMany();

  // Create demo Consultant
  const consultantPassword = await hashPassword("consultant123");
  const consultant = await prisma.user.create({
    data: {
      email: "consultant@demo.com",
      name: "Anna Schmidt",
      role: "CONSULTANT",
      preferredLang: "DE",
      emailVerified: true,
    },
  });

  // Create account for consultant (Better Auth stores passwords in account table)
  await prisma.account.create({
    data: {
      accountId: consultant.id,
      providerId: "credential",
      userId: consultant.id,
      password: consultantPassword,
    },
  });

  // Create demo Employee
  const employee = await prisma.user.create({
    data: {
      email: "employee@client.com",
      name: "Max Mueller",
      role: "EMPLOYEE",
      preferredLang: "DE",
      emailVerified: true,
    },
  });

  // Create demo Project
  const project = await prisma.project.create({
    data: {
      name: "Acme Corp Process Capture",
      industry: "Manufacturing",
      status: "ACTIVE",
    },
  });

  // Create ProjectConfiguration
  await prisma.projectConfiguration.create({
    data: {
      projectId: project.id,
      industryClassification: {
        sector: "Manufacturing",
        subSector: "Automotive",
      },
      processCategories: [
        {
          key: "procurement",
          labelDe: "Beschaffung",
          labelEn: "Procurement",
        },
        {
          key: "quality",
          labelDe: "Qualitätssicherung",
          labelEn: "Quality Assurance",
        },
        {
          key: "production",
          labelDe: "Produktion",
          labelEn: "Production",
        },
        {
          key: "logistics",
          labelDe: "Logistik",
          labelEn: "Logistics",
        },
      ],
      customTerminology: {
        process: { de: "Vorgang", en: "Process" },
        step: { de: "Schritt", en: "Step" },
        department: { de: "Abteilung", en: "Department" },
      },
      version: 1,
    },
  });

  // Add members to project
  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: consultant.id,
      role: "CONSULTANT",
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: employee.id,
      role: "EMPLOYEE",
    },
  });

  // Create sample ProcessEntry with Markdown and BPMN
  const sampleMarkdown = `# Order-to-Cash Process

## Trigger
A customer places an order via the online portal or sales representative.

## Process Steps

### 1. Order Receipt
- Order is received and logged in the system
- Automatic confirmation email sent to customer
- Order assigned to responsible department

### 2. Order Validation
- Check product availability
- Verify customer credit status
- Confirm pricing and discounts

### 3. Production Planning
- Schedule production based on order requirements
- Allocate necessary resources
- Estimate delivery timeline

### 4. Production Execution
- Manufacture products per order specifications
- Quality checks at each production stage
- Package finished goods

### 5. Shipping & Delivery
- Arrange logistics and transportation
- Generate shipping documents
- Track delivery status

### 6. Invoicing & Payment
- Generate invoice upon delivery confirmation
- Send invoice to customer
- Process payment and close order

## Key Metrics
- **Average cycle time**: 5-7 business days
- **On-time delivery rate**: 95%
- **First-pass quality rate**: 98%

## Responsible Departments
- Sales, Production, Quality Assurance, Logistics, Finance`;

  const sampleBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             id="Definitions_1"
             targetNamespace="http://bpmn.io/schema/bpmn">
  <process id="OrderToCash" name="Order-to-Cash" isExecutable="false">
    <startEvent id="Start" name="Order Received">
      <outgoing>Flow_1</outgoing>
    </startEvent>
    <task id="Task_Validate" name="Validate Order">
      <incoming>Flow_1</incoming>
      <outgoing>Flow_2</outgoing>
    </task>
    <exclusiveGateway id="Gateway_Valid" name="Order Valid?">
      <incoming>Flow_2</incoming>
      <outgoing>Flow_3</outgoing>
      <outgoing>Flow_Reject</outgoing>
    </exclusiveGateway>
    <task id="Task_Plan" name="Plan Production">
      <incoming>Flow_3</incoming>
      <outgoing>Flow_4</outgoing>
    </task>
    <task id="Task_Produce" name="Execute Production">
      <incoming>Flow_4</incoming>
      <outgoing>Flow_5</outgoing>
    </task>
    <task id="Task_QA" name="Quality Check">
      <incoming>Flow_5</incoming>
      <outgoing>Flow_6</outgoing>
    </task>
    <task id="Task_Ship" name="Ship &amp; Deliver">
      <incoming>Flow_6</incoming>
      <outgoing>Flow_7</outgoing>
    </task>
    <task id="Task_Invoice" name="Invoice &amp; Payment">
      <incoming>Flow_7</incoming>
      <outgoing>Flow_8</outgoing>
    </task>
    <endEvent id="End_Complete" name="Order Completed">
      <incoming>Flow_8</incoming>
    </endEvent>
    <endEvent id="End_Rejected" name="Order Rejected">
      <incoming>Flow_Reject</incoming>
    </endEvent>
    <sequenceFlow id="Flow_1" sourceRef="Start" targetRef="Task_Validate" />
    <sequenceFlow id="Flow_2" sourceRef="Task_Validate" targetRef="Gateway_Valid" />
    <sequenceFlow id="Flow_3" name="Yes" sourceRef="Gateway_Valid" targetRef="Task_Plan" />
    <sequenceFlow id="Flow_Reject" name="No" sourceRef="Gateway_Valid" targetRef="End_Rejected" />
    <sequenceFlow id="Flow_4" sourceRef="Task_Plan" targetRef="Task_Produce" />
    <sequenceFlow id="Flow_5" sourceRef="Task_Produce" targetRef="Task_QA" />
    <sequenceFlow id="Flow_6" sourceRef="Task_QA" targetRef="Task_Ship" />
    <sequenceFlow id="Flow_7" sourceRef="Task_Ship" targetRef="Task_Invoice" />
    <sequenceFlow id="Flow_8" sourceRef="Task_Invoice" targetRef="End_Complete" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="OrderToCash">
      <bpmndi:BPMNShape id="Start_di" bpmnElement="Start">
        <dc:Bounds x="180" y="200" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="158" y="243" width="80" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Validate_di" bpmnElement="Task_Validate">
        <dc:Bounds x="270" y="178" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Valid_di" bpmnElement="Gateway_Valid" isMarkerVisible="true">
        <dc:Bounds x="425" y="193" width="50" height="50" />
        <bpmndi:BPMNLabel><dc:Bounds x="418" y="163" width="64" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Plan_di" bpmnElement="Task_Plan">
        <dc:Bounds x="530" y="178" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Produce_di" bpmnElement="Task_Produce">
        <dc:Bounds x="680" y="178" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_QA_di" bpmnElement="Task_QA">
        <dc:Bounds x="830" y="178" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Ship_di" bpmnElement="Task_Ship">
        <dc:Bounds x="980" y="178" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Invoice_di" bpmnElement="Task_Invoice">
        <dc:Bounds x="1130" y="178" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Complete_di" bpmnElement="End_Complete">
        <dc:Bounds x="1282" y="200" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="1258" y="243" width="84" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Rejected_di" bpmnElement="End_Rejected">
        <dc:Bounds x="432" y="322" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="414" y="365" width="73" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="216" y="218" /><di:waypoint x="270" y="218" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="370" y="218" /><di:waypoint x="425" y="218" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="475" y="218" /><di:waypoint x="530" y="218" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Reject_di" bpmnElement="Flow_Reject">
        <di:waypoint x="450" y="243" /><di:waypoint x="450" y="322" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="630" y="218" /><di:waypoint x="680" y="218" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5">
        <di:waypoint x="780" y="218" /><di:waypoint x="830" y="218" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6">
        <di:waypoint x="930" y="218" /><di:waypoint x="980" y="218" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_7_di" bpmnElement="Flow_7">
        <di:waypoint x="1080" y="218" /><di:waypoint x="1130" y="218" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_8_di" bpmnElement="Flow_8">
        <di:waypoint x="1230" y="218" /><di:waypoint x="1282" y="218" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

  await prisma.processEntry.create({
    data: {
      projectId: project.id,
      createdById: employee.id,
      title: "Order-to-Cash",
      status: "COMPLETED",
      markdownContent: sampleMarkdown,
      bpmnXml: sampleBpmn,
    },
  });

  // Create sample in-progress InterviewSession
  const interview = await prisma.interviewSession.create({
    data: {
      projectId: project.id,
      employeeId: employee.id,
      processCategory: "procurement",
      title: "Raw Materials Procurement",
      status: "IN_PROGRESS",
      currentSummaryJson: {
        processName: "Raw Materials Procurement",
        trigger: {
          description: "A department submits a purchase request",
          type: "manual",
        },
        steps: [
          {
            id: "step-1",
            name: "Submit Purchase Request",
            description: "Department head fills out purchase request form",
            type: "task",
            actor: "Department Head",
            system: "SAP",
          },
          {
            id: "step-2",
            name: "Manager Approval",
            description: "Manager reviews and approves the request",
            type: "decision",
            actor: "Manager",
            conditions: {
              "Under 5000 EUR": "step-3",
              "Over 5000 EUR": "step-2b",
            },
          },
        ],
        roles: [
          { name: "Department Head", description: "Initiates the purchase request" },
          { name: "Manager", description: "Approves requests under 5000 EUR" },
        ],
        systems: [
          { name: "SAP", description: "Enterprise resource planning system" },
        ],
        metrics: [],
      },
    },
  });

  // Add sample interview messages
  await prisma.interviewMessage.createMany({
    data: [
      {
        interviewSessionId: interview.id,
        role: "ASSISTANT",
        content:
          "Hello! I'm here to help document your business process for Raw Materials Procurement. Let's get started.\n\nCould you tell me what triggers this process? What event or action starts it?",
        orderIndex: 0,
      },
      {
        interviewSessionId: interview.id,
        role: "USER",
        content:
          "The process starts when a department submits a purchase request. Usually the department head fills out the form in SAP.",
        orderIndex: 1,
      },
      {
        interviewSessionId: interview.id,
        role: "ASSISTANT",
        content:
          "Thank you! So the trigger is a purchase request submitted by a department head through SAP. That's clear.\n\nNow, what happens after the purchase request is submitted? Could you walk me through the next steps?",
        orderIndex: 2,
      },
      {
        interviewSessionId: interview.id,
        role: "USER",
        content:
          "The manager reviews the request. If it's under 5000 EUR, the manager can approve it directly. If it's over 5000 EUR, it needs to go to the director for approval.",
        orderIndex: 3,
      },
      {
        interviewSessionId: interview.id,
        role: "ASSISTANT",
        content:
          "I see, so there's an approval decision point based on the amount. Under 5000 EUR the manager approves, over 5000 EUR it escalates to the director.\n\nWhat happens after the approval is given? What are the next steps in the procurement process?",
        orderIndex: 4,
      },
    ],
  });

  // Create LLM Provider Configs
  await prisma.lLMProviderConfig.create({
    data: {
      providerKey: "mock",
      displayName: "Mock Provider (Testing)",
      apiEndpoint: "http://localhost:3000/api/llm/mock",
      credentialRef: "MOCK_API_KEY",
      modelId: "mock-v1",
      maxTokens: 4096,
      dpaActive: true,
      isDefault: false,
    },
  });

  await prisma.lLMProviderConfig.create({
    data: {
      providerKey: "claude",
      displayName: "Anthropic Claude",
      apiEndpoint: "https://api.anthropic.com/v1/messages",
      credentialRef: "ANTHROPIC_API_KEY",
      modelId: "claude-sonnet-4-6",
      maxTokens: 4096,
      dpaActive: true,
      isDefault: true,
    },
  });

  console.log("Seed complete!");
  console.log("  Consultant: consultant@demo.com / consultant123");
  console.log("  Employee: employee@client.com (magic link)");
  console.log("  Project: Acme Corp Process Capture");
  console.log("  Sample process: Order-to-Cash");
  console.log("  LLM Providers: mock, claude (default)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
