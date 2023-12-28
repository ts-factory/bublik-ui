/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
declare module '*.mdx' {
	let MDXComponent: (props: any) => JSX.Element;
	export default MDXComponent;
}
