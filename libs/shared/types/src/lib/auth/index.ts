/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

const PasswordSchema = z
	.string({ required_error: 'Password must be provided!' })
	.min(1, 'Password must not be empty!');

const RolesSchema = z.enum(['admin', 'user']);

/**
 |--------------------------------------------------
 | REFRESH
 |--------------------------------------------------
 */

export const RefreshTokenMutationResponseSchema = z.object({
	message: z.string()
});

export type RefreshTokenMutationResponse = z.infer<
	typeof RefreshTokenMutationResponseSchema
>;

/**
 |--------------------------------------------------
 | ME
 |--------------------------------------------------
 */

export const UserSchema = z.object({
	email: z.string(),
	first_name: z.string(),
	last_name: z.string(),
	roles: RolesSchema,
	is_active: z.boolean().nullable()
});

export type User = z.infer<typeof UserSchema>;

/**
 |--------------------------------------------------
 | LOGIN
 |--------------------------------------------------
 */

export const LoginFormSchema = z.object({
	email: z.string().email(),
	password: PasswordSchema
});

export type LoginFormInputs = z.infer<typeof LoginFormSchema>;

export const LoginMutationResponseSchema = z.object({
	user: UserSchema
});

export type LoginMutationResponse = z.infer<typeof LoginMutationResponseSchema>;

/**
 |--------------------------------------------------
 | FORGOT PASSWORD
 |--------------------------------------------------
 */

export const ForgotPasswordSchema = z.object({
	email: z.string().email({ message: 'Must be a valid email' })
});

export type ForgotPasswordInputs = z.infer<typeof ForgotPasswordSchema>;

/**
 |--------------------------------------------------
 | CHANGE PASSWORD FORM
 |--------------------------------------------------
 */

export const ChangePasswordFormSchema = z
	.object({ password: PasswordSchema, passwordConfirm: PasswordSchema })
	.superRefine(({ password, passwordConfirm }, ctx) => {
		if (password !== passwordConfirm) {
			const errorMessage = 'The passwords did not match';

			ctx.addIssue({
				code: 'custom',
				path: ['password'],
				message: errorMessage
			});
			ctx.addIssue({
				code: 'custom',
				path: ['passwordConfirm'],
				message: errorMessage
			});
		}
	});

export type ChangePasswordFormInputs = z.infer<typeof ChangePasswordFormSchema>;

export const ResetPasswordParamsSchema = z.object({
	userId: z.string(),
	resetToken: z.string()
});

export type ResetPasswordParamsInputs = z.infer<
	typeof ResetPasswordParamsSchema
>;

export const AdminCreateUserInputsSchema = z
	.object({
		email: z.string().email(),
		password: PasswordSchema,
		password_confirm: PasswordSchema,
		first_name: z.string().min(1),
		last_name: z.string().min(1)
	})
	.superRefine(({ password, password_confirm }, ctx) => {
		if (password !== password_confirm) {
			const errorMessage = 'The passwords did not match';

			ctx.addIssue({
				code: 'custom',
				path: ['password'],
				message: errorMessage
			});
			ctx.addIssue({
				code: 'custom',
				path: ['password_confirm'],
				message: errorMessage
			});
		}
	});

export type AdminCreateUserInputs = z.infer<typeof AdminCreateUserInputsSchema>;

export const AdminUpdateUserSchema = z.object({
	email: z.string().email(),
	first_name: z.string().min(1, 'Must be provided!').optional(),
	last_name: z.string().min(1, 'Must be provided!').optional(),
	password: z.string().optional()
});

export type AdminUpdateUserInputs = z.infer<typeof AdminUpdateUserSchema>;

export const AdminDeleteUser = z.object({ email: z.string().email() });

export type AdminDeleteUserInputs = z.infer<typeof AdminDeleteUser>;

export const ProfileChangePasswordInputs = z
	.object({
		current_password: z.string().min(1, 'Must be provided!'),
		new_password: PasswordSchema,
		new_password_confirm: PasswordSchema
	})
	.superRefine(({ new_password, new_password_confirm }, ctx) => {
		if (new_password !== new_password_confirm) {
			const errorMessage = 'The passwords did not match!';

			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['new_password'],
				message: errorMessage
			});
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['new_password_confirm'],
				message: errorMessage
			});
		}
	});

export type ProfileChangePassword = z.infer<typeof ProfileChangePasswordInputs>;

export const VerifyEmailSchemaInputs = z.object({
	userId: z.string(),
	token: z.string()
});

export type VerifyEmailInputs = z.infer<typeof VerifyEmailSchemaInputs>;

export const ChangePasswordInputsSchema = z.object({
	current_password: PasswordSchema,
	new_password_confirm: PasswordSchema,
	new_password: PasswordSchema
});

export type ChangePasswordInputs = z.infer<typeof ChangePasswordInputsSchema>;

export const UpdateUserProfileInfoSchema = z.object({
	first_name: z.string(),
	last_name: z.string()
});

export type UpdateUserProfileInfoInputs = z.infer<
	typeof UpdateUserProfileInfoSchema
>;

export const ResetUserPasswordSchema = z
	.object({
		new_password: PasswordSchema,
		new_password_confirm: PasswordSchema
	})
	.superRefine(({ new_password, new_password_confirm }, ctx) => {
		if (new_password !== new_password_confirm) {
			const errorMessage = 'The passwords did not match!';

			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['new_password'],
				message: errorMessage
			});
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['new_password_confirm'],
				message: errorMessage
			});
		}
	});

export type ResetUserPasswordFormInputs = z.infer<
	typeof ResetUserPasswordSchema
>;
