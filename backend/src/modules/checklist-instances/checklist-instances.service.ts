import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { SubmitChecklistInstanceDto } from './dto/create-checklist-instance.dto';
import { QueryChecklistInstanceDto } from './dto/query-checklist-instance.dto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['in_progress', 'overdue', 'submitted'],
  in_progress: ['submitted'],
  submitted: ['approved', 'rejected'],
  rejected: ['in_progress'],
  overdue: [],
  approved: [],
};

@Injectable()
export class ChecklistInstancesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryChecklistInstanceDto, approverAssignmentIds?: string[]) {
    const { page = 1, pageSize = 10, search, sort = 'createdAt', order = 'desc', status, templateId, locationId, assignedUserId, frequency } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;
    if (templateId) where.templateId = templateId;
    if (locationId) where.locationId = locationId;
    if (assignedUserId) where.assignedUserId = assignedUserId;
    if (frequency) where.assignment = { recurrenceType: frequency };
    if (approverAssignmentIds) where.assignmentId = { in: approverAssignmentIds };
    if (search) {
      where.OR = [
        { template: { name: { contains: search, mode: 'insensitive' } } },
        { location: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.checklistInstance.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sort]: order },
        include: {
          template: { select: { id: true, name: true, description: true } },
          location: { select: { id: true, name: true, building: { select: { id: true, name: true } } } },
          assignment: { select: { id: true, recurrenceType: true, name: true, description: true } },
        },
      }),
      this.prisma.checklistInstance.count({ where }),
    ]);

    // Enrich with assignedUser data
    const userIds = [...new Set(data.map((d) => d.assignedUserId).filter(Boolean))] as string[];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Compute canSubmit (all required fields filled) for in-progress instances
    const inProgressIds = data
      .filter((d) => d.status === 'in_progress')
      .map((d) => d.id);
    const submitReadyMap = new Map<string, boolean>();
    if (inProgressIds.length) {
      const fullInstances = await this.prisma.checklistInstance.findMany({
        where: { id: { in: inProgressIds } },
        include: {
          template: { include: { fields: true } },
          responses: true,
        },
      });
      for (const inst of fullInstances) {
        submitReadyMap.set(
          inst.id,
          this.areRequiredResponsesComplete(inst.template?.fields ?? [], inst.responses ?? []),
        );
      }
    }

    const enrichedData = data.map((instance) => ({
      ...instance,
      assignedUser: instance.assignedUserId ? userMap.get(instance.assignedUserId) || null : null,
      canSubmit: instance.status === 'in_progress' ? submitReadyMap.get(instance.id) ?? false : false,
    }));

    return {
      data: enrichedData,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(id: string) {
    const instance = await this.prisma.checklistInstance.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            fields: { orderBy: { orderNo: 'asc' } },
            locations: { include: { location: { include: { floor: true, building: true } } } },
          },
        },
        location: { include: { building: true, floor: true } },
        responses: { include: { location: true } },
        assignment: {
          include: { approvalSteps: { orderBy: { stepOrder: 'asc' } } },
        },
      },
    });
    if (!instance) throw new NotFoundException('checklistInstance.notFound');

    // Get assignedUser
    let assignedUser = null;
    if (instance.assignedUserId) {
      assignedUser = await this.prisma.user.findUnique({
        where: { id: instance.assignedUserId },
        select: { id: true, firstName: true, lastName: true },
      });
    }

    // Enrich approval step approver names
    let assignment: any = instance.assignment;
    if (assignment?.approvalSteps?.length) {
      const approverIds = [...new Set(assignment.approvalSteps.map((s: any) => s.approverId))] as string[];
      const approvers = await this.prisma.user.findMany({
        where: { id: { in: approverIds } },
        select: { id: true, firstName: true, lastName: true },
      });
      const approverMap = new Map(approvers.map((u) => [u.id, u]));
      assignment = {
        ...assignment,
        approvalSteps: assignment.approvalSteps.map((s: any) => {
          const u = approverMap.get(s.approverId);
          return { ...s, approverName: u ? `${u.firstName} ${u.lastName}` : undefined };
        }),
      };
    }

    return { ...instance, assignment, assignedUser };
  }

  async start(id: string, userId: string) {
    const instance = await this.findOne(id);
    this.validateTransition(instance.status, 'in_progress');

    // Verify assignment
    if (instance.assignedUserId && instance.assignedUserId !== userId) {
      throw new BadRequestException('checklistInstance.notAssigned');
    }

    const updated = await this.prisma.checklistInstance.update({
      where: { id },
      data: {
        status: 'in_progress',
        startedAt: new Date(),
        assignedUserId: instance.assignedUserId || userId,
      },
    });

    await this.prisma.checklistInstanceHistory.create({
      data: { instanceId: id, action: 'started', performedBy: userId },
    });

    return { ...updated, message: 'checklistInstance.started', messageParams: { name: instance.template.name } };
  }

  async saveDraft(id: string, dto: SubmitChecklistInstanceDto, userId: string) {
    const instance = await this.findOne(id);

    // Verify user is the assignee
    if (instance.assignedUserId && instance.assignedUserId !== userId) {
      throw new BadRequestException('checklistInstance.notAssigned');
    }

    // Only draftable while the inspection is still being filled
    if (!['pending', 'in_progress', 'rejected'].includes(instance.status)) {
      throw new BadRequestException('checklistInstance.invalidTransition');
    }

    await this.prisma.$transaction(async (tx) => {
      // Replace existing responses with the latest snapshot
      await tx.checklistResponse.deleteMany({ where: { checklistInstanceId: id } });
      if (dto.responses?.length) {
        await tx.checklistResponse.createMany({
          data: dto.responses.map((r) => ({
            checklistInstanceId: id,
            fieldId: r.fieldId,
            locationId: r.locationId || null,
            value: r.value ?? null,
            notes: r.notes,
          })),
        });
      }

      // Keep the inspection in progress (do NOT send to approval)
      const wasPending = instance.status === 'pending';
      await tx.checklistInstance.update({
        where: { id },
        data: {
          status: 'in_progress',
          ...(wasPending ? { startedAt: new Date() } : {}),
          assignedUserId: instance.assignedUserId || userId,
        },
      });

      if (wasPending) {
        await tx.checklistInstanceHistory.create({
          data: { instanceId: id, action: 'started', performedBy: userId },
        });
      }
    });

    return { message: 'checklistInstance.draftSaved', messageParams: { name: instance.template.name } };
  }

  async submit(id: string, dto: SubmitChecklistInstanceDto, userId: string) {
    const instance = await this.findOne(id);
    this.validateTransition(instance.status, 'submitted');

    // Verify user is the assignee
    if (instance.assignedUserId !== userId) {
      throw new BadRequestException('checklistInstance.notAssigned');
    }

    // Determine the response set to validate and (optionally) persist.
    // When called without responses (e.g. from the list view), the already
    // saved draft responses are submitted as-is.
    const incoming = dto.responses;
    const persistIncoming = Array.isArray(incoming) && incoming.length > 0;
    const effective = persistIncoming
      ? incoming!
      : (instance.responses ?? []).map((r: any) => ({
          fieldId: r.fieldId,
          locationId: r.locationId ?? undefined,
          value: r.value,
          notes: r.notes ?? undefined,
        }));

    // Validate required fields (plain fields + required table columns)
    this.validateRequiredResponses(instance.template.fields, effective);

    // Save responses and update status in transaction
    const needsApproval =
      !!instance.assignment?.requiresApproval && (instance.assignment.approvalSteps?.length ?? 0) > 0;
    const firstStep = needsApproval ? instance.assignment.approvalSteps[0].stepOrder : null;

    await this.prisma.$transaction(async (tx) => {
      if (persistIncoming) {
        // Replace existing responses with the submitted snapshot
        await tx.checklistResponse.deleteMany({ where: { checklistInstanceId: id } });
        await tx.checklistResponse.createMany({
          data: incoming!.map((r) => ({
            checklistInstanceId: id,
            fieldId: r.fieldId,
            locationId: r.locationId || null,
            value: r.value ?? null,
            notes: r.notes,
          })),
        });
      }

      // Update instance status. With an approval chain it awaits approval;
      // otherwise the submission completes the instance.
      const startedAt = instance.startedAt ?? new Date();
      await tx.checklistInstance.update({
        where: { id },
        data: needsApproval
          ? { status: 'submitted', startedAt, submittedAt: new Date(), currentApprovalStep: firstStep }
          : { status: 'approved', startedAt, submittedAt: new Date(), completedAt: new Date(), currentApprovalStep: null },
      });

      await tx.checklistInstanceHistory.create({
        data: { instanceId: id, action: 'submitted', performedBy: userId },
      });

      if (!needsApproval) {
        await tx.checklistInstanceHistory.create({
          data: { instanceId: id, action: 'approved', performedBy: userId },
        });
      }
    });

    return { message: 'checklistInstance.submitted', messageParams: { name: instance.template.name } };
  }

  async approve(id: string, userId: string, comment?: string, canApproveAll = false) {
    const instance = await this.findOne(id);
    if (instance.status !== 'submitted') {
      throw new BadRequestException('checklistInstance.invalidTransition');
    }

    const steps: any[] = instance.assignment?.approvalSteps ?? [];
    const hasChain = !!instance.assignment?.requiresApproval && steps.length > 0;

    if (hasChain) {
      const currentStepOrder = instance.currentApprovalStep ?? steps[0].stepOrder;
      const currentStep = steps.find((s) => s.stepOrder === currentStepOrder);
      if (!canApproveAll && (!currentStep || currentStep.approverId !== userId)) {
        throw new ForbiddenException('checklistInstance.notCurrentApprover');
      }

      const nextStep = steps
        .filter((s) => s.stepOrder > currentStepOrder)
        .sort((a, b) => a.stepOrder - b.stepOrder)[0];

      await this.prisma.$transaction(async (tx) => {
        await tx.checklistInstance.update({
          where: { id },
          data: nextStep
            ? { currentApprovalStep: nextStep.stepOrder }
            : { status: 'approved', completedAt: new Date(), currentApprovalStep: null },
        });
        await tx.checklistInstanceHistory.create({
          data: { instanceId: id, action: 'approved', performedBy: userId, comment },
        });
      });

      return { message: 'checklistInstance.approved', messageParams: { name: instance.template.name } };
    }

    // No approval chain — direct approval
    await this.prisma.$transaction(async (tx) => {
      await tx.checklistInstance.update({
        where: { id },
        data: { status: 'approved', completedAt: new Date() },
      });

      await tx.checklistInstanceHistory.create({
        data: { instanceId: id, action: 'approved', performedBy: userId, comment },
      });
    });

    return { message: 'checklistInstance.approved', messageParams: { name: instance.template.name } };
  }

  async reject(id: string, userId: string, comment?: string, canRejectAll = false) {
    const instance = await this.findOne(id);
    if (instance.status !== 'submitted') {
      throw new BadRequestException('checklistInstance.invalidTransition');
    }

    const steps: any[] = instance.assignment?.approvalSteps ?? [];
    const hasChain = !!instance.assignment?.requiresApproval && steps.length > 0;

    if (hasChain) {
      const currentStepOrder = instance.currentApprovalStep ?? steps[0].stepOrder;
      const currentStep = steps.find((s) => s.stepOrder === currentStepOrder);
      if (!canRejectAll && (!currentStep || currentStep.approverId !== userId)) {
        throw new ForbiddenException('checklistInstance.notCurrentApprover');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.checklistInstance.update({
        where: { id },
        data: { status: 'rejected', currentApprovalStep: null },
      });

      await tx.checklistInstanceHistory.create({
        data: { instanceId: id, action: 'rejected', performedBy: userId, comment },
      });
    });

    return { message: 'checklistInstance.rejected', messageParams: { name: instance.template.name } };
  }

  async getHistory(id: string) {
    const instance = await this.prisma.checklistInstance.findUnique({ where: { id } });
    if (!instance) throw new NotFoundException('checklistInstance.notFound');

    const history = await this.prisma.checklistInstanceHistory.findMany({
      where: { instanceId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Enrich performer names
    const performerIds = [...new Set(history.map((h) => h.performedBy).filter(Boolean))] as string[];
    const users = performerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: performerIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return history.map((h) => ({
      ...h,
      performedBy: h.performedBy ? userMap.get(h.performedBy) || null : null,
    }));
  }

  async findAllForApprover(approverId: string, query: QueryChecklistInstanceDto) {
    // Find all InspectionAssignments where this user is an approval step
    const approverAssignments = await this.prisma.inspectionApprovalStep.findMany({
      where: { approverId },
      select: { assignmentId: true },
    });
    const assignmentIds = [...new Set(approverAssignments.map((s) => s.assignmentId))];

    if (!assignmentIds.length) {
      return { data: [], meta: { page: 1, pageSize: query.pageSize ?? 10, total: 0, totalPages: 0 } };
    }

    // Filter instances to only those belonging to these assignments
    const modifiedQuery: QueryChecklistInstanceDto = {
      ...query,
      // inject assignment filter — we override findAll's where by passing a
      // dedicated param; easiest is to reuse findAll with an added assignmentIds filter.
    };
    return this.findAll(modifiedQuery, assignmentIds);
  }

  async myInstances(userId: string, query: QueryChecklistInstanceDto) {
    const modifiedQuery = { ...query, assignedUserId: userId };
    return this.findAll(modifiedQuery);
  }

  private validateTransition(currentStatus: string, targetStatus: string) {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new BadRequestException('checklistInstance.invalidTransition');
    }
  }

  private isEmptyValue(v: any): boolean {
    if (v === null || v === undefined || v === '') return true;
    if (Array.isArray(v)) return v.length === 0;
    // yes_no cells that also collect files are stored as { answer, files }.
    if (typeof v === 'object' && 'answer' in v) {
      return v.answer !== 'yes' && v.answer !== 'no';
    }
    return false;
  }

  // True when a yes_no answer triggers a file requirement but no file is attached.
  private isYesNoFileMissing(col: any, value: any): boolean {
    const fileReq = col?.fileRequirement;
    if (!fileReq || fileReq === 'none' || fileReq === 'optional') return false;
    const answer =
      value && typeof value === 'object' && !Array.isArray(value) ? value.answer : value;
    if (answer !== 'yes' && answer !== 'no') return false;
    const files =
      value && typeof value === 'object' && !Array.isArray(value) && Array.isArray(value.files)
        ? value.files
        : [];
    const required =
      fileReq === 'always' ||
      fileReq === 'required' ||
      (fileReq === 'onYes' && answer === 'yes') ||
      (fileReq === 'onNo' && answer === 'no');
    return required && files.length === 0;
  }

  private validateRequiredResponses(fields: any[], responses: any[]) {
    if (!this.areRequiredResponsesComplete(fields, responses)) {
      throw new BadRequestException('checklistInstance.requiredFieldMissing');
    }
  }

  // Returns true when every required field/cell is filled and all file
  // requirements are satisfied. Used both for submit validation and to decide
  // whether the "submit for approval" action should be available.
  private areRequiredResponsesComplete(fields: any[], responses: any[]): boolean {
    for (const field of fields) {
      const cfg = (field.fieldConfig as any) || {};

      if (field.fieldType === 'table') {
        const cols: any[] = cfg.tableColumns ?? [];
        const locs: any[] = cfg.tableLocations ?? [];
        const requiredCols = cols.filter((c) => c.required && c.type !== 'formula');
        const fileCols = cols.filter(
          (c) =>
            c.type === 'yes_no' &&
            c.fileRequirement &&
            c.fileRequirement !== 'none' &&
            c.fileRequirement !== 'optional',
        );
        if (!requiredCols.length && !fileCols.length) continue;
        for (const loc of locs) {
          const resp = responses.find((r) => r.fieldId === field.id && r.locationId === loc.id);
          const val = resp?.value && typeof resp.value === 'object' ? resp.value : {};
          for (const col of requiredCols) {
            if (this.isEmptyValue(val[col.id])) return false;
          }
          for (const col of fileCols) {
            if (this.isYesNoFileMissing(col, val[col.id])) return false;
          }
        }
      } else if (cfg.required) {
        const resp = responses.find((r) => r.fieldId === field.id);
        if (!resp || this.isEmptyValue(resp.value)) return false;
      }
    }
    return true;
  }
}
