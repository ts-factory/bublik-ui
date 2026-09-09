/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { test } from '@playwright/test';

type StepBody<T> = () => T | Promise<T>;

function step<T>(keyword: string, text: string, body: StepBody<T>): Promise<T> {
	return test.step(`${keyword} ${text}`, body);
}

function given<T>(text: string, body: StepBody<T>): Promise<T> {
	return step('Given', text, body);
}

function when<T>(text: string, body: StepBody<T>): Promise<T> {
	return step('When', text, body);
}

function then<T>(text: string, body: StepBody<T>): Promise<T> {
	return step('Then', text, body);
}

function and<T>(text: string, body: StepBody<T>): Promise<T> {
	return step('And', text, body);
}

function but<T>(text: string, body: StepBody<T>): Promise<T> {
	return step('But', text, body);
}

export { and, but, given, then, when };
