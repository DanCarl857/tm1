export class CreateTaskDto {
    title: string;
    description?: string;
    organizationId: string;
    assigneeIds?: string[];
}

export class UpdateTaskDto {
    title?: string;
    description?: string;
    completed?: boolean;
    assigneeIds?: string[];
}