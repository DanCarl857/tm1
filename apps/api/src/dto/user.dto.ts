export class CreateUserDto {
    email: string;
    password: string;
    orgID?: string;
    roles?: string[];
}

export class UpdateUserDto {
    password?: string;
    orgID?: string;
    roles?: string[];
}