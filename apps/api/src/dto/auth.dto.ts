export class RegisterDto {
    email: string;
    password: string;
    orgID?: string;
    roles?: string[];
}

export class LoginDto {
    email: string;
    password: string;
}